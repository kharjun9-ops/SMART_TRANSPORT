const fs = require('fs');
const path = require('path');

// In-Memory Database store with disk persistence
class MemoryDatabase {
    constructor() {
        this.tables = {
            users: [],
            routes: [],
            stops: [],
            route_stops: [],
            buses: [],
            trips: [],
            user_updates: [],
            crowd_estimates: [],
            badges: [],
            user_badges: [],
            complaints: [],
            notifications: [],
            point_transactions: [],
            user_journeys: []
        };
        this.dbPath = path.join(__dirname, '..', '..', 'data', 'transit_store.json');
    }

    pragma() {}

    exec(sql) {
        // No-op for direct schema parsing since memory structure is pre-declared
        return true;
    }

    saveToDisk() {
        try {
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(this.dbPath, JSON.stringify(this.tables, null, 2), 'utf-8');
        } catch (e) {}
    }

    loadFromDisk() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const raw = fs.readFileSync(this.dbPath, 'utf-8');
                const loaded = JSON.parse(raw);
                this.tables = { ...this.tables, ...loaded };
                return true;
            }
        } catch (e) {}
        return false;
    }

    prepare(query) {
        const self = this;
        const normalized = query.trim().replace(/\s+/g, ' ');

        return {
            get(...params) {
                const results = self.executeQuery(normalized, params);
                return results.length > 0 ? results[0] : undefined;
            },
            all(...params) {
                return self.executeQuery(normalized, params);
            },
            run(...params) {
                return self.executeMutation(normalized, params);
            }
        };
    }

    executeQuery(sql, params = []) {
        const lower = sql.toLowerCase();

        // 1. Users
        if (lower.startsWith('select * from users where id = ?') || lower.includes('from users where id = ?')) {
            const u = this.tables.users.find(x => x.id === params[0]);
            return u ? [{ ...u }] : [];
        }
        if (lower.startsWith('select * from users where email = ?') || lower.includes('from users where email = ?')) {
            const u = this.tables.users.find(x => x.email.toLowerCase() === (params[0] || '').toLowerCase());
            return u ? [{ ...u }] : [];
        }
        if (lower.startsWith('select id from users where email = ?')) {
            const u = this.tables.users.find(x => x.email.toLowerCase() === (params[0] || '').toLowerCase());
            return u ? [{ id: u.id }] : [];
        }
        if (lower.includes('from users order by points desc')) {
            const limit = typeof params[0] === 'number' ? params[0] : 20;
            return this.tables.users
                .map(u => ({ ...u }))
                .sort((a, b) => (b.points || 0) - (a.points || 0))
                .slice(0, limit);
        }

        // 2. Routes
        if (lower.includes('select r.*') && lower.includes('from routes r') && lower.includes('active_trips')) {
            return this.tables.routes
                .filter(r => r.status === 'active')
                .map(r => ({
                    ...r,
                    active_trips: this.tables.trips.filter(t => t.route_id === r.id && t.status === 'active').length
                }))
                .sort((a, b) => (a.route_number || '').localeCompare(b.route_number || ''));
        }
        if (lower === "select * from routes where status = 'active'" || lower.includes('from routes where status = ?')) {
            return this.tables.routes.filter(r => r.status === 'active').map(r => ({ ...r }));
        }
        if (lower.startsWith('select * from routes where id = ?')) {
            const r = this.tables.routes.find(x => x.id === params[0]);
            return r ? [{ ...r }] : [];
        }
        if (lower.includes('from routes r') && lower.includes('join route_stops rs1') && lower.includes('s1.name like ?')) {
            const fromTerm = (params[0] || '').replace(/%/g, '').toLowerCase();
            const toTerm = (params[1] || '').replace(/%/g, '').toLowerCase();

            return this.tables.routes.filter(r => {
                const stopsForRoute = this.tables.route_stops
                    .filter(rs => rs.route_id === r.id)
                    .sort((a, b) => a.sequence_order - b.sequence_order);

                const stopNames = stopsForRoute.map(rs => {
                    const st = this.tables.stops.find(s => s.id === rs.stop_id);
                    return { ...rs, name: st ? st.name.toLowerCase() : '' };
                });

                const fromIdx = stopNames.findIndex(s => s.name.includes(fromTerm));
                const toIdx = stopNames.findIndex(s => s.name.includes(toTerm));

                return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
            }).map(r => ({ ...r }));
        }
        if (lower.includes('from routes r') && lower.includes('join route_stops rs') && lower.includes('rs.stop_id in')) {
            const stopIds = new Set(params);
            const routeIds = new Set(
                this.tables.route_stops.filter(rs => stopIds.has(rs.stop_id)).map(rs => rs.route_id)
            );
            return this.tables.routes.filter(r => routeIds.has(r.id) && r.status === 'active').map(r => ({ ...r }));
        }

        // 3. Stops
        if (lower.startsWith('select * from stops order by name')) {
            return this.tables.stops.map(s => ({ ...s })).sort((a, b) => a.name.localeCompare(b.name));
        }
        if (lower.startsWith('select * from stops')) {
            return this.tables.stops.map(s => ({ ...s }));
        }
        if (lower.startsWith('select latitude, longitude from stops where id = ?') || lower.startsWith('select is_major from stops where id = ?') || lower.startsWith('select * from stops where id = ?')) {
            const s = this.tables.stops.find(x => x.id === params[0]);
            return s ? [{ ...s }] : [];
        }

        // 4. Route Stops
        if (lower.includes('from route_stops rs') && lower.includes('join stops s') && lower.includes('rs.route_id = ?')) {
            return this.tables.route_stops
                .filter(rs => rs.route_id === params[0])
                .sort((a, b) => a.sequence_order - b.sequence_order)
                .map(rs => {
                    const s = this.tables.stops.find(x => x.id === rs.stop_id) || {};
                    return {
                        ...rs,
                        ...s,
                        stop_id: rs.stop_id,
                        stop_name: s.name,
                        latitude: s.latitude,
                        longitude: s.longitude,
                        is_major: s.is_major
                    };
                });
        }
        if (lower.includes('from route_stops where route_id = ? and stop_id = ?')) {
            const rs = this.tables.route_stops.find(x => x.route_id === params[0] && x.stop_id === params[1]);
            return rs ? [{ ...rs }] : [];
        }
        if (lower.includes('from route_stops rs') && lower.includes('join stops s') && lower.includes('rs.sequence_order = ?')) {
            const rs = this.tables.route_stops.find(x => x.route_id === params[0] && x.sequence_order === params[1]);
            if (!rs) return [];
            const s = this.tables.stops.find(x => x.id === rs.stop_id);
            return s ? [{ ...s, name: s.name }] : [];
        }
        if (lower.includes('from route_stops rs') && lower.includes('join routes r') && lower.includes('rs.stop_id = ?')) {
            const matchingRouteIds = this.tables.route_stops.filter(rs => rs.stop_id === params[0]).map(rs => rs.route_id);
            return this.tables.routes.filter(r => matchingRouteIds.includes(r.id) && r.status === 'active').map(r => ({ ...r }));
        }

        // 5. Trips
        if (lower.includes('from trips t') && lower.includes('join buses b') && lower.includes("t.status = 'active'")) {
            return this.tables.trips
                .filter(t => t.status === 'active')
                .map(t => {
                    const b = this.tables.buses.find(x => x.id === t.bus_id) || {};
                    const r = this.tables.routes.find(x => x.id === t.route_id) || {};
                    return {
                        ...t,
                        bus_number: b.bus_number,
                        capacity: b.capacity || 50,
                        current_latitude: b.current_latitude,
                        current_longitude: b.current_longitude,
                        current_speed_kmh: b.current_speed_kmh,
                        route_name: r.name,
                        route_number: r.route_number,
                        route_color: r.color
                    };
                });
        }
        if (lower.includes('from trips t') && lower.includes('join buses b') && lower.includes('t.route_id = ?')) {
            return this.tables.trips
                .filter(t => t.route_id === params[0] && ['active', 'scheduled'].includes(t.status))
                .map(t => {
                    const b = this.tables.buses.find(x => x.id === t.bus_id) || {};
                    return { ...t, bus_number: b.bus_number, capacity: b.capacity || 50 };
                });
        }
        if (lower.includes('from trips t') && lower.includes('where t.id = ?')) {
            const t = this.tables.trips.find(x => x.id === params[0]);
            if (!t) return [];
            const b = this.tables.buses.find(x => x.id === t.bus_id) || {};
            const r = this.tables.routes.find(x => x.id === t.route_id) || {};
            return [{
                ...t,
                bus_number: b.bus_number,
                capacity: b.capacity || 50,
                current_latitude: b.current_latitude,
                current_longitude: b.current_longitude,
                current_speed_kmh: b.current_speed_kmh,
                driver_name: b.driver_name,
                route_name: r.name,
                route_number: r.route_number,
                route_color: r.color,
                fare_lkr: r.fare_lkr
            }];
        }
        if (lower.startsWith('select * from trips where id = ?')) {
            const t = this.tables.trips.find(x => x.id === params[0]);
            return t ? [{ ...t }] : [];
        }
        if (lower.includes("from trips where status = 'completed'")) {
            return this.tables.trips.filter(t => t.status === 'completed').map(t => ({ ...t }));
        }
        if (lower.includes("from trips where status = 'scheduled'")) {
            return this.tables.trips.filter(t => t.status === 'scheduled').map(t => ({ ...t }));
        }
        if (lower.includes('from trips t') && lower.includes("where t.status = 'active'")) {
            return this.tables.trips.filter(t => t.status === 'active').map(t => {
                const b = this.tables.buses.find(x => x.id === t.bus_id) || {};
                const r = this.tables.routes.find(x => x.id === t.route_id) || {};
                return { ...t, capacity: b.capacity || 50, bus_id: b.id, route_name: r.name };
            });
        }

        // 6. Buses
        if (lower.startsWith('select * from buses where id = ?') || lower.startsWith('select capacity from buses where id = ?')) {
            const b = this.tables.buses.find(x => x.id === params[0]);
            return b ? [{ ...b }] : [];
        }
        if (lower.includes('from buses b') && lower.includes('where b.route_id = ?')) {
            return this.tables.buses.filter(b => b.route_id === params[0]).map(b => {
                const t = this.tables.trips.find(x => x.bus_id === b.id && x.status === 'active') || {};
                return {
                    ...b,
                    trip_id: t.id,
                    trip_status: t.status,
                    current_stop_index: t.current_stop_index,
                    current_passenger_count: t.current_passenger_count,
                    delay_minutes: t.delay_minutes,
                    direction: t.direction
                };
            });
        }

        // 7. Crowd Estimates
        if (lower.includes('from crowd_estimates where trip_id = ? and stop_id = ?')) {
            const c = this.tables.crowd_estimates.find(x => x.trip_id === params[0] && x.stop_id === params[1]);
            return c ? [{ ...c }] : [];
        }

        // 8. Badges
        if (lower.startsWith('select * from badges order by rarity, name') || lower.startsWith('select * from badges')) {
            return this.tables.badges.map(b => ({ ...b }));
        }
        if (lower.includes('from user_badges ub') && lower.includes('join badges b') && lower.includes('where ub.user_id = ?')) {
            const userBadges = this.tables.user_badges.filter(ub => ub.user_id === params[0]);
            return userBadges.map(ub => {
                const b = this.tables.badges.find(x => x.id === ub.badge_id) || {};
                return { ...b, earned_at: ub.earned_at };
            });
        }
        if (lower.startsWith('select badge_id from user_badges where user_id = ?')) {
            return this.tables.user_badges.filter(ub => ub.user_id === params[0]).map(ub => ({ badge_id: ub.badge_id }));
        }

        // 9. Complaints
        if (lower.includes('from complaints c') && lower.includes('where c.id = ? and c.user_id = ?')) {
            const c = this.tables.complaints.find(x => x.id === params[0] && x.user_id === params[1]);
            return c ? [{ ...c }] : [];
        }
        if (lower.includes('from complaints c') && lower.includes('where c.user_id = ?')) {
            return this.tables.complaints.filter(c => c.user_id === params[0]).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        // 10. Notifications
        if (lower.includes('select count(*) as count from notifications where user_id = ? and is_read = 0')) {
            const count = this.tables.notifications.filter(n => n.user_id === params[0] && !n.is_read).length;
            return [{ count }];
        }
        if (lower.includes('from notifications where user_id = ?')) {
            let list = this.tables.notifications.filter(n => n.user_id === params[0]);
            if (lower.includes('and is_read = 0')) {
                list = list.filter(n => !n.is_read);
            }
            return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, params[1] || 50);
        }

        // 11. Point transactions
        if (lower.includes('from point_transactions where user_id = ?')) {
            return this.tables.point_transactions
                .filter(pt => pt.user_id === params[0])
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 50);
        }
        if (lower.includes('from point_transactions where related_update_id = ? and is_verified = 0')) {
            const pt = this.tables.point_transactions.find(x => x.related_update_id === params[0] && !x.is_verified);
            return pt ? [{ ...pt }] : [];
        }
        if (lower.includes('from point_transactions where related_update_id = ? and is_permanent = 0')) {
            const pt = this.tables.point_transactions.find(x => x.related_update_id === params[0] && !x.is_permanent);
            return pt ? [{ ...pt }] : [];
        }

        // 12. User updates
        if (lower.startsWith('select * from user_updates where id = ?')) {
            const u = this.tables.user_updates.find(x => x.id === params[0]);
            return u ? [{ ...u }] : [];
        }
        if (lower.includes('from user_updates where user_id = ? and verification_status != ?') || lower.includes("verification_status != 'pending'")) {
            const items = this.tables.user_updates.filter(u => u.user_id === params[0] && u.verification_status !== 'pending');
            const verified = items.filter(u => u.verification_status === 'verified').length;
            const rejected = items.filter(u => u.verification_status === 'rejected').length;
            const avg_confidence = items.length > 0 ? items.reduce((acc, x) => acc + (x.confidence_score || 0.5), 0) / items.length : 0.5;
            return [{ total: items.length, verified, rejected, avg_confidence }];
        }
        if (lower.includes('from user_updates where user_id = ?')) {
            const items = this.tables.user_updates.filter(u => u.user_id === params[0]);
            return [{
                total_updates: items.length,
                boarding_count: items.filter(u => u.update_type === 'board').length,
                deboarding_count: items.filter(u => u.update_type === 'deboard').length,
                crowd_feedback_count: items.filter(u => u.update_type === 'crowd_feedback').length
            }];
        }
        if (lower.includes('from user_updates u') && lower.includes('join users usr') && lower.includes('u.trip_id = ?')) {
            return this.tables.user_updates
                .filter(u => u.trip_id === params[0])
                .map(u => {
                    const usr = this.tables.users.find(x => x.id === u.user_id) || {};
                    return { ...u, user_name: usr.name || 'Anonymous' };
                });
        }
        if (lower.includes('from user_updates') && lower.includes('where trip_id = ?')) {
            return this.tables.user_updates.filter(u => u.trip_id === params[0]);
        }

        return [];
    }

    executeMutation(sql, params = []) {
        const lower = sql.toLowerCase();

        // 1. Users
        if (lower.startsWith('insert into users')) {
            const [id, name, email, password_hash, phone] = params;
            this.tables.users.push({
                id, name, email, password_hash, phone: phone || null,
                points: 0, level: 'Commuter', reliability_score: 0.5,
                total_contributions: 0, streak_days: 1, last_contribution_date: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString()
            });
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update users set points = points + ? where id = ?')) {
            const u = this.tables.users.find(x => x.id === params[1]);
            if (u) u.points = (u.points || 0) + params[0];
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update users set points = max(0, points - ?) where id = ?')) {
            const u = this.tables.users.find(x => x.id === params[1]);
            if (u) u.points = Math.max(0, (u.points || 0) - params[0]);
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update users set level = ? where id = ?')) {
            const u = this.tables.users.find(x => x.id === params[1]);
            if (u) u.level = params[0];
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update users set streak_days = streak_days + 1')) {
            const u = this.tables.users.find(x => x.id === params[1]);
            if (u) {
                u.streak_days = (u.streak_days || 0) + 1;
                u.last_contribution_date = params[0];
            }
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update users set streak_days = 1')) {
            const u = this.tables.users.find(x => x.id === params[1]);
            if (u) {
                u.streak_days = 1;
                u.last_contribution_date = params[0];
            }
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update users set total_contributions = total_contributions + 1 where id = ?')) {
            const u = this.tables.users.find(x => x.id === params[0]);
            if (u) u.total_contributions = (u.total_contributions || 0) + 1;
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update users set reliability_score = ?, total_contributions = ? where id = ?')) {
            const u = this.tables.users.find(x => x.id === params[2]);
            if (u) {
                u.reliability_score = params[0];
                u.total_contributions = params[1];
            }
            this.saveToDisk();
            return { changes: 1 };
        }

        // 2. Trips
        if (lower.includes('update trips set current_passenger_count = current_passenger_count + 1 where id = ?')) {
            const t = this.tables.trips.find(x => x.id === params[0]);
            if (t) t.current_passenger_count = (t.current_passenger_count || 0) + 1;
            return { changes: 1 };
        }
        if (lower.includes('update trips set current_passenger_count = ? where id = ?')) {
            const t = this.tables.trips.find(x => x.id === params[1]);
            if (t) t.current_passenger_count = params[0];
            return { changes: 1 };
        }
        if (lower.includes('update trips set delay_minutes = ? where id = ?')) {
            const t = this.tables.trips.find(x => x.id === params[1]);
            if (t) t.delay_minutes = params[0];
            return { changes: 1 };
        }
        if (lower.includes('update trips set current_stop_index = ?, current_passenger_count = ?, delay_minutes = ? where id = ?')) {
            const t = this.tables.trips.find(x => x.id === params[3]);
            if (t) {
                t.current_stop_index = params[0];
                t.current_passenger_count = params[1];
                t.delay_minutes = params[2];
            }
            return { changes: 1 };
        }
        if (lower.includes("update trips set status = 'completed'")) {
            const t = this.tables.trips.find(x => x.id === params[0]);
            if (t) {
                t.status = 'completed';
                t.actual_end = new Date().toISOString();
            }
            return { changes: 1 };
        }
        if (lower.includes("update trips set status = 'active'")) {
            const t = this.tables.trips.find(x => x.id === (params[1] || params[0]));
            if (t) {
                t.status = 'active';
                t.current_stop_index = 0;
                t.current_passenger_count = params[0] || 10;
                t.delay_minutes = 0;
                t.actual_start = new Date().toISOString();
                t.direction = t.direction === 'outbound' ? 'inbound' : 'outbound';
            }
            return { changes: 1 };
        }

        // 3. Buses
        if (lower.includes('update buses set current_latitude = ?, current_longitude = ?, current_speed_kmh = ? where id = ?')) {
            const b = this.tables.buses.find(x => x.id === params[3]);
            if (b) {
                b.current_latitude = params[0];
                b.current_longitude = params[1];
                b.current_speed_kmh = params[2];
            }
            return { changes: 1 };
        }

        // 4. User Updates
        if (lower.startsWith('insert into user_updates')) {
            const [id, user_id, trip_id, stop_id, update_type, ...rest] = params;
            let crowd_level = null;
            let lat = null, lng = null;

            if (update_type === 'crowd_feedback') {
                crowd_level = rest[0];
                lat = rest[1];
                lng = rest[2];
            } else {
                lat = rest[0];
                lng = rest[1];
            }

            this.tables.user_updates.push({
                id, user_id, trip_id, stop_id, update_type, crowd_level,
                latitude: lat, longitude: lng, gps_verified: 1,
                verification_status: 'verified', confidence_score: 0.85,
                timestamp: new Date().toISOString()
            });
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update user_updates set confidence_score = ?, verification_status = ? where id = ?')) {
            const u = this.tables.user_updates.find(x => x.id === params[2]);
            if (u) {
                u.confidence_score = params[0];
                u.verification_status = params[1];
            }
            return { changes: 1 };
        }
        if (lower.includes('update user_updates set confidence_score = ?, verification_status = ?, verification_notes = ?, gps_verified = ? where id = ?')) {
            const u = this.tables.user_updates.find(x => x.id === params[4]);
            if (u) {
                u.confidence_score = params[0];
                u.verification_status = params[1];
                u.verification_notes = params[2];
                u.gps_verified = params[3];
            }
            return { changes: 1 };
        }

        // 5. Crowd Estimates
        if (lower.includes('insert into crowd_estimates') || lower.includes('insert or replace into crowd_estimates')) {
            const [trip_id, stop_id, estimated_level, estimated_count, capacity_percentage, confidence, data_sources] = params;
            const existingIdx = this.tables.crowd_estimates.findIndex(x => x.trip_id === trip_id && x.stop_id === stop_id);
            const entry = {
                trip_id, stop_id, estimated_level, estimated_count, capacity_percentage,
                confidence: confidence || 0.6, data_sources: data_sources || 1,
                updated_at: new Date().toISOString()
            };
            if (existingIdx !== -1) {
                this.tables.crowd_estimates[existingIdx] = entry;
            } else {
                this.tables.crowd_estimates.push(entry);
            }
            return { changes: 1 };
        }
        if (lower.includes('update crowd_estimates set estimated_level = ?, estimated_count = ?, capacity_percentage = ?')) {
            const c = this.tables.crowd_estimates.find(x => x.trip_id === params[params.length - 2] && x.stop_id === params[params.length - 1]);
            if (c) {
                c.estimated_level = params[0];
                c.estimated_count = params[1];
                c.capacity_percentage = params[2];
                c.updated_at = new Date().toISOString();
            }
            return { changes: 1 };
        }

        // 6. Badges & User Badges
        if (lower.includes('insert or ignore into user_badges') || lower.includes('insert into user_badges')) {
            const [user_id, badge_id] = params;
            const exists = this.tables.user_badges.find(x => x.user_id === user_id && x.badge_id === badge_id);
            if (!exists) {
                this.tables.user_badges.push({ user_id, badge_id, earned_at: new Date().toISOString() });
                this.saveToDisk();
            }
            return { changes: 1 };
        }

        // 7. Complaints
        if (lower.startsWith('insert into complaints')) {
            const [id, user_id, trip_id, bus_id, category, description, image_path, severity] = params;
            this.tables.complaints.push({
                id, user_id, trip_id, bus_id, category, description,
                image_path, severity: severity || 'medium', status: 'under_review',
                created_at: new Date().toISOString()
            });
            this.saveToDisk();
            return { changes: 1 };
        }

        // 8. Notifications
        if (lower.startsWith('insert into notifications')) {
            const [id, user_id, type, title, message, data] = params;
            this.tables.notifications.push({
                id, user_id, type, title, message, data,
                is_read: 0, created_at: new Date().toISOString()
            });
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update notifications set is_read = 1 where id = ? and user_id = ?')) {
            const n = this.tables.notifications.find(x => x.id === params[0] && x.user_id === params[1]);
            if (n) n.is_read = 1;
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update notifications set is_read = 1 where user_id = ? and is_read = 0')) {
            this.tables.notifications.filter(x => x.user_id === params[0]).forEach(n => { n.is_read = 1; });
            this.saveToDisk();
            return { changes: 1 };
        }

        // 9. Point Transactions
        if (lower.startsWith('insert into point_transactions')) {
            const [id, user_id, amount, reason, related_update_id] = params;
            this.tables.point_transactions.push({
                id, user_id, amount, reason, related_update_id,
                is_verified: 0, is_permanent: 0, created_at: new Date().toISOString()
            });
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update point_transactions set is_verified = 1, is_permanent = 1')) {
            const pt = this.tables.point_transactions.find(x => x.id === params[0]);
            if (pt) {
                pt.is_verified = 1;
                pt.is_permanent = 1;
                pt.verified_at = new Date().toISOString();
            }
            this.saveToDisk();
            return { changes: 1 };
        }

        // 10. User Journeys
        if (lower.startsWith('insert into user_journeys')) {
            const [id, user_id, trip_id, board_stop_id] = params;
            this.tables.user_journeys.push({
                id, user_id, trip_id, board_stop_id,
                boarded_at: new Date().toISOString(), status: 'active'
            });
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update user_journeys set deboard_stop_id = ?')) {
            const [deboard_stop_id, user_id, trip_id] = params;
            const uj = this.tables.user_journeys.find(x => x.user_id === user_id && x.trip_id === trip_id && x.status === 'active');
            if (uj) {
                uj.deboard_stop_id = deboard_stop_id;
                uj.deboarded_at = new Date().toISOString();
                uj.status = 'completed';
            }
            this.saveToDisk();
            return { changes: 1 };
        }

        return { changes: 0 };
    }
}

let dbInstance = null;

function getDb() {
    if (dbInstance) return dbInstance;
    dbInstance = new MemoryDatabase();
    return dbInstance;
}

function initializeDatabase() {
    const db = getDb();
    const loaded = db.loadFromDisk();

    // Default Seed Data
    if (!loaded || db.tables.stops.length === 0) {
        db.tables.stops = [
            { id: 'stop_blr_01', name: 'Yeshwanthpur TTMC', latitude: 13.0238, longitude: 77.5503, zone: 'North Zone', is_major: 1 },
            { id: 'stop_blr_02', name: 'Yeshwanthpur Railway Station', latitude: 13.0280, longitude: 77.5406, zone: 'North Zone', is_major: 1 },
            { id: 'stop_blr_03', name: 'Malleshwaram 18th Cross', latitude: 13.0085, longitude: 77.5685, zone: 'North Zone', is_major: 0 },
            { id: 'stop_blr_04', name: 'Malleshwaram 8th Cross', latitude: 12.9980, longitude: 77.5710, zone: 'Central Zone', is_major: 0 },
            { id: 'stop_blr_05', name: 'Rajajinagar 1st Block', latitude: 13.0038, longitude: 77.5555, zone: 'West Zone', is_major: 0 },
            { id: 'stop_blr_06', name: 'Kempegowda Bus Station (Majestic)', latitude: 12.9778, longitude: 77.5726, zone: 'Central Hub', is_major: 1 },
            { id: 'stop_blr_07', name: 'Corporation / Town Hall', latitude: 12.9634, longitude: 77.5855, zone: 'Central Zone', is_major: 1 },
            { id: 'stop_blr_08', name: 'Lalbagh Main Gate', latitude: 12.9507, longitude: 77.5844, zone: 'South Zone', is_major: 0 },
            { id: 'stop_blr_09', name: 'South End Circle', latitude: 12.9378, longitude: 77.5785, zone: 'South Zone', is_major: 0 },
            { id: 'stop_blr_10', name: 'Jayanagar 4th Block TTMC', latitude: 12.9299, longitude: 77.5824, zone: 'South Zone', is_major: 1 },
            { id: 'stop_blr_11', name: 'Banashankari TTMC', latitude: 12.9177, longitude: 77.5739, zone: 'South Hub', is_major: 1 },
            { id: 'stop_blr_12', name: 'Sarakki Junction', latitude: 12.9050, longitude: 77.5742, zone: 'South Zone', is_major: 0 },
            { id: 'stop_blr_13', name: 'Konanakunte Cross', latitude: 12.8895, longitude: 77.5738, zone: 'Kanakapura Corridor', is_major: 1 },
            { id: 'stop_blr_14', name: 'Doddakallasandra', latitude: 12.8765, longitude: 77.5615, zone: 'Kanakapura Corridor', is_major: 0 },
            { id: 'stop_blr_15', name: 'Vajrahalli', latitude: 12.8645, longitude: 77.5448, zone: 'Kanakapura Corridor', is_major: 0 },
            { id: 'stop_blr_16', name: 'Thalaghattapura', latitude: 12.8550, longitude: 77.5390, zone: 'Kanakapura Corridor', is_major: 0 },
            { id: 'stop_blr_17', name: 'Silk Institute (Kanakapura Rd)', latitude: 12.8465, longitude: 77.5342, zone: 'South Terminal', is_major: 1 },
            { id: 'stop_blr_18', name: 'Vijayanagar TTMC', latitude: 12.9698, longitude: 77.5360, zone: 'West Hub', is_major: 1 },
            { id: 'stop_blr_19', name: 'Nayandahalli Metro', latitude: 12.9468, longitude: 77.5255, zone: 'Mysore Rd Corridor', is_major: 1 },
            { id: 'stop_blr_20', name: 'Rajarajeshwari Nagar Gate', latitude: 12.9288, longitude: 77.5188, zone: 'Mysore Rd Corridor', is_major: 0 },
            { id: 'stop_blr_21', name: 'Bangalore University Gate', latitude: 12.9185, longitude: 77.5020, zone: 'Mysore Rd Corridor', is_major: 0 },
            { id: 'stop_blr_22', name: 'Kengeri TTMC / Bus Terminal', latitude: 12.9081, longitude: 77.4835, zone: 'West Terminal', is_major: 1 },
            { id: 'stop_blr_23', name: 'Kengeri Satellite Town', latitude: 12.8985, longitude: 77.4780, zone: 'West Terminal', is_major: 0 },
            { id: 'stop_blr_24', name: 'Electronic City Toll Gate', latitude: 12.8452, longitude: 77.6602, zone: 'Tech Hub South', is_major: 1 },
            { id: 'stop_blr_25', name: 'Whitefield TTMC', latitude: 12.9698, longitude: 77.7499, zone: 'IT Corridor East', is_major: 1 }
        ];

        db.tables.routes = [
            { id: 'route_blr_01', name: 'Yeshwanthpur - Majestic Express', route_number: '252', color: '#4285F4', total_distance_km: 8.5, avg_duration_minutes: 30, fare_lkr: 25, status: 'active' },
            { id: 'route_blr_02', name: 'Majestic - Silk Institute via Konanakunte', route_number: '215C', color: '#10B981', total_distance_km: 19.8, avg_duration_minutes: 60, fare_lkr: 45, status: 'active' },
            { id: 'route_blr_03', name: 'Majestic - Kengeri TTMC via Vijayanagar', route_number: '226N', color: '#F59E0B', total_distance_km: 16.2, avg_duration_minutes: 50, fare_lkr: 40, status: 'active' },
            { id: 'route_blr_04', name: 'Yeshwanthpur - Kengeri via Rajajinagar', route_number: '401K', color: '#EC4899', total_distance_km: 18.5, avg_duration_minutes: 55, fare_lkr: 40, status: 'active' },
            { id: 'route_blr_05', name: 'Kengeri - Konanakunte - Silk Institute Link', route_number: '375K', color: '#8B5CF6', total_distance_km: 21.0, avg_duration_minutes: 65, fare_lkr: 50, status: 'active' },
            { id: 'route_blr_06', name: 'Majestic - Electronic City Express', route_number: '356CW', color: '#00bcd4', total_distance_km: 22.0, avg_duration_minutes: 55, fare_lkr: 55, status: 'active' },
            { id: 'route_blr_07', name: 'Majestic - Whitefield IT Corridor', route_number: '335E', color: '#ff7043', total_distance_km: 24.0, avg_duration_minutes: 65, fare_lkr: 60, status: 'active' }
        ];

        db.tables.route_stops = [
            // Route 252: Yeshwanthpur TTMC -> Majestic
            { route_id: 'route_blr_01', stop_id: 'stop_blr_01', sequence_order: 1, distance_from_start_km: 0, avg_time_from_start_min: 0 },
            { route_id: 'route_blr_01', stop_id: 'stop_blr_02', sequence_order: 2, distance_from_start_km: 1.2, avg_time_from_start_min: 4 },
            { route_id: 'route_blr_01', stop_id: 'stop_blr_03', sequence_order: 3, distance_from_start_km: 3.5, avg_time_from_start_min: 12 },
            { route_id: 'route_blr_01', stop_id: 'stop_blr_04', sequence_order: 4, distance_from_start_km: 5.8, avg_time_from_start_min: 20 },
            { route_id: 'route_blr_01', stop_id: 'stop_blr_06', sequence_order: 5, distance_from_start_km: 8.5, avg_time_from_start_min: 30 },

            // Route 215C: Majestic -> Silk Institute via Konanakunte Cross
            { route_id: 'route_blr_02', stop_id: 'stop_blr_06', sequence_order: 1, distance_from_start_km: 0, avg_time_from_start_min: 0 },
            { route_id: 'route_blr_02', stop_id: 'stop_blr_07', sequence_order: 2, distance_from_start_km: 2.1, avg_time_from_start_min: 7 },
            { route_id: 'route_blr_02', stop_id: 'stop_blr_08', sequence_order: 3, distance_from_start_km: 4.2, avg_time_from_start_min: 14 },
            { route_id: 'route_blr_02', stop_id: 'stop_blr_09', sequence_order: 4, distance_from_start_km: 6.0, avg_time_from_start_min: 20 },
            { route_id: 'route_blr_02', stop_id: 'stop_blr_10', sequence_order: 5, distance_from_start_km: 7.8, avg_time_from_start_min: 26 },
            { route_id: 'route_blr_02', stop_id: 'stop_blr_11', sequence_order: 6, distance_from_start_km: 9.6, avg_time_from_start_min: 32 },
            { route_id: 'route_blr_02', stop_id: 'stop_blr_12', sequence_order: 7, distance_from_start_km: 11.5, avg_time_from_start_min: 38 },
            { route_id: 'route_blr_02', stop_id: 'stop_blr_13', sequence_order: 8, distance_from_start_km: 13.8, avg_time_from_start_min: 44 },
            { route_id: 'route_blr_02', stop_id: 'stop_blr_14', sequence_order: 9, distance_from_start_km: 15.6, avg_time_from_start_min: 49 },
            { route_id: 'route_blr_02', stop_id: 'stop_blr_15', sequence_order: 10, distance_from_start_km: 17.2, avg_time_from_start_min: 54 },
            { route_id: 'route_blr_02', stop_id: 'stop_blr_16', sequence_order: 11, distance_from_start_km: 18.5, avg_time_from_start_min: 57 },
            { route_id: 'route_blr_02', stop_id: 'stop_blr_17', sequence_order: 12, distance_from_start_km: 19.8, avg_time_from_start_min: 60 },

            // Route 226N: Majestic -> Kengeri TTMC via Vijayanagar
            { route_id: 'route_blr_03', stop_id: 'stop_blr_06', sequence_order: 1, distance_from_start_km: 0, avg_time_from_start_min: 0 },
            { route_id: 'route_blr_03', stop_id: 'stop_blr_18', sequence_order: 2, distance_from_start_km: 5.2, avg_time_from_start_min: 16 },
            { route_id: 'route_blr_03', stop_id: 'stop_blr_19', sequence_order: 3, distance_from_start_km: 8.5, avg_time_from_start_min: 26 },
            { route_id: 'route_blr_03', stop_id: 'stop_blr_20', sequence_order: 4, distance_from_start_km: 11.0, avg_time_from_start_min: 34 },
            { route_id: 'route_blr_03', stop_id: 'stop_blr_21', sequence_order: 5, distance_from_start_km: 13.5, avg_time_from_start_min: 42 },
            { route_id: 'route_blr_03', stop_id: 'stop_blr_22', sequence_order: 6, distance_from_start_km: 16.2, avg_time_from_start_min: 50 },

            // Route 401K: Yeshwanthpur TTMC -> Kengeri TTMC
            { route_id: 'route_blr_04', stop_id: 'stop_blr_01', sequence_order: 1, distance_from_start_km: 0, avg_time_from_start_min: 0 },
            { route_id: 'route_blr_04', stop_id: 'stop_blr_05', sequence_order: 2, distance_from_start_km: 3.2, avg_time_from_start_min: 10 },
            { route_id: 'route_blr_04', stop_id: 'stop_blr_18', sequence_order: 3, distance_from_start_km: 7.0, avg_time_from_start_min: 22 },
            { route_id: 'route_blr_04', stop_id: 'stop_blr_19', sequence_order: 4, distance_from_start_km: 10.5, avg_time_from_start_min: 32 },
            { route_id: 'route_blr_04', stop_id: 'stop_blr_20', sequence_order: 5, distance_from_start_km: 13.0, avg_time_from_start_min: 40 },
            { route_id: 'route_blr_04', stop_id: 'stop_blr_22', sequence_order: 6, distance_from_start_km: 18.5, avg_time_from_start_min: 55 },

            // Route 375K: Kengeri TTMC -> Konanakunte Cross -> Silk Institute
            { route_id: 'route_blr_05', stop_id: 'stop_blr_22', sequence_order: 1, distance_from_start_km: 0, avg_time_from_start_min: 0 },
            { route_id: 'route_blr_05', stop_id: 'stop_blr_20', sequence_order: 2, distance_from_start_km: 4.8, avg_time_from_start_min: 14 },
            { route_id: 'route_blr_05', stop_id: 'stop_blr_11', sequence_order: 3, distance_from_start_km: 10.5, avg_time_from_start_min: 32 },
            { route_id: 'route_blr_05', stop_id: 'stop_blr_13', sequence_order: 4, distance_from_start_km: 15.0, avg_time_from_start_min: 46 },
            { route_id: 'route_blr_05', stop_id: 'stop_blr_17', sequence_order: 5, distance_from_start_km: 21.0, avg_time_from_start_min: 65 },

            // Route 356CW: Majestic -> Electronic City
            { route_id: 'route_blr_06', stop_id: 'stop_blr_06', sequence_order: 1, distance_from_start_km: 0, avg_time_from_start_min: 0 },
            { route_id: 'route_blr_06', stop_id: 'stop_blr_07', sequence_order: 2, distance_from_start_km: 2.5, avg_time_from_start_min: 8 },
            { route_id: 'route_blr_06', stop_id: 'stop_blr_08', sequence_order: 3, distance_from_start_km: 5.0, avg_time_from_start_min: 15 },
            { route_id: 'route_blr_06', stop_id: 'stop_blr_24', sequence_order: 4, distance_from_start_km: 22.0, avg_time_from_start_min: 55 },

            // Route 335E: Majestic -> Whitefield
            { route_id: 'route_blr_07', stop_id: 'stop_blr_06', sequence_order: 1, distance_from_start_km: 0, avg_time_from_start_min: 0 },
            { route_id: 'route_blr_07', stop_id: 'stop_blr_07', sequence_order: 2, distance_from_start_km: 2.5, avg_time_from_start_min: 8 },
            { route_id: 'route_blr_07', stop_id: 'stop_blr_25', sequence_order: 3, distance_from_start_km: 24.0, avg_time_from_start_min: 65 }
        ];

        db.tables.buses = [
            { id: 'bus_blr_01', route_id: 'route_blr_01', bus_number: 'KA-01-F-4589', capacity: 55, current_latitude: 13.0085, current_longitude: 77.5685, current_speed_kmh: 32, driver_name: 'Manjunath Gowda', status: 'in_service' },
            { id: 'bus_blr_02', route_id: 'route_blr_01', bus_number: 'KA-04-F-2214', capacity: 55, current_latitude: 12.9980, current_longitude: 77.5710, current_speed_kmh: 28, driver_name: 'Ramesh Kumar', status: 'in_service' },
            { id: 'bus_blr_03', route_id: 'route_blr_02', bus_number: 'KA-57-F-7890', capacity: 52, current_latitude: 12.9177, current_longitude: 77.5739, current_speed_kmh: 38, driver_name: 'Shankarappa', status: 'in_service' },
            { id: 'bus_blr_04', route_id: 'route_blr_02', bus_number: 'KA-01-FA-1102', capacity: 52, current_latitude: 12.8895, current_longitude: 77.5738, current_speed_kmh: 35, driver_name: 'Venkatesh Babu', status: 'in_service' },
            { id: 'bus_blr_05', route_id: 'route_blr_03', bus_number: 'KA-41-F-6345', capacity: 50, current_latitude: 12.9468, current_longitude: 77.5255, current_speed_kmh: 40, driver_name: 'Pradeep Patil', status: 'in_service' },
            { id: 'bus_blr_06', route_id: 'route_blr_04', bus_number: 'KA-01-F-9932', capacity: 50, current_latitude: 12.9698, current_longitude: 77.5360, current_speed_kmh: 36, driver_name: 'Anand Murthy', status: 'in_service' },
            { id: 'bus_blr_07', route_id: 'route_blr_05', bus_number: 'KA-57-F-3321', capacity: 50, current_latitude: 12.8765, current_longitude: 77.5615, current_speed_kmh: 30, driver_name: 'Basavaraj Hiremath', status: 'in_service' },
            { id: 'bus_blr_08', route_id: 'route_blr_06', bus_number: 'KA-01-F-8812', capacity: 55, current_latitude: 12.8900, current_longitude: 77.6200, current_speed_kmh: 42, driver_name: 'Kiran Kumar', status: 'in_service' },
            { id: 'bus_blr_09', route_id: 'route_blr_07', bus_number: 'KA-53-F-4411', capacity: 55, current_latitude: 12.9600, current_longitude: 77.6800, current_speed_kmh: 35, driver_name: 'Suresh Reddy', status: 'in_service' }
        ];

        db.tables.trips = [
            { id: 'trip_blr_01', bus_id: 'bus_blr_01', route_id: 'route_blr_01', direction: 'outbound', scheduled_start: new Date(Date.now() - 18 * 60000).toISOString(), status: 'active', current_stop_index: 2, current_passenger_count: 24, delay_minutes: 2 },
            { id: 'trip_blr_02', bus_id: 'bus_blr_02', route_id: 'route_blr_01', direction: 'inbound', scheduled_start: new Date(Date.now() - 10 * 60000).toISOString(), status: 'active', current_stop_index: 3, current_passenger_count: 46, delay_minutes: 0 },
            { id: 'trip_blr_03', bus_id: 'bus_blr_03', route_id: 'route_blr_02', direction: 'outbound', scheduled_start: new Date(Date.now() - 32 * 60000).toISOString(), status: 'active', current_stop_index: 5, current_passenger_count: 38, delay_minutes: 4 },
            { id: 'trip_blr_04', bus_id: 'bus_blr_04', route_id: 'route_blr_02', direction: 'outbound', scheduled_start: new Date(Date.now() - 42 * 60000).toISOString(), status: 'active', current_stop_index: 7, current_passenger_count: 18, delay_minutes: 1 },
            { id: 'trip_blr_05', bus_id: 'bus_blr_05', route_id: 'route_blr_03', direction: 'outbound', scheduled_start: new Date(Date.now() - 22 * 60000).toISOString(), status: 'active', current_stop_index: 2, current_passenger_count: 28, delay_minutes: 3 },
            { id: 'trip_blr_06', bus_id: 'bus_blr_06', route_id: 'route_blr_04', direction: 'outbound', scheduled_start: new Date(Date.now() - 15 * 60000).toISOString(), status: 'active', current_stop_index: 2, current_passenger_count: 32, delay_minutes: 0 },
            { id: 'trip_blr_07', bus_id: 'bus_blr_07', route_id: 'route_blr_05', direction: 'outbound', scheduled_start: new Date(Date.now() - 28 * 60000).toISOString(), status: 'active', current_stop_index: 3, current_passenger_count: 16, delay_minutes: 0 },
            { id: 'trip_blr_08', bus_id: 'bus_blr_08', route_id: 'route_blr_06', direction: 'outbound', scheduled_start: new Date(Date.now() - 20 * 60000).toISOString(), status: 'active', current_stop_index: 2, current_passenger_count: 44, delay_minutes: 2 },
            { id: 'trip_blr_09', bus_id: 'bus_blr_09', route_id: 'route_blr_07', direction: 'outbound', scheduled_start: new Date(Date.now() - 35 * 60000).toISOString(), status: 'active', current_stop_index: 2, current_passenger_count: 35, delay_minutes: 5 }
        ];

        db.tables.badges = [
            { id: 'badge_01', name: 'First Ride', description: 'Board your first BMTC bus', icon: '🎫', rarity: 'common', requirement_type: 'contributions', requirement_value: 1 },
            { id: 'badge_02', name: 'Namma Commuter', description: 'Make 10 verified contributions', icon: '🚌', rarity: 'common', requirement_type: 'contributions', requirement_value: 10 },
            { id: 'badge_03', name: 'Crowd Reporter', description: 'Submit 5 crowd updates', icon: '👥', rarity: 'common', requirement_type: 'contributions', requirement_value: 5 },
            { id: 'badge_04', name: 'Weekly Warrior', description: 'Maintain a 7-day streak across Bengaluru', icon: '🔥', rarity: 'rare', requirement_type: 'streak', requirement_value: 7 },
            { id: 'badge_05', name: 'Transit Expert', description: 'Reach 500 points', icon: '⭐', rarity: 'rare', requirement_type: 'points', requirement_value: 500 },
            { id: 'badge_06', name: 'Community Guardian', description: 'Submit 10 valid reports', icon: '🛡️', rarity: 'rare', requirement_type: 'contributions', requirement_value: 10 },
            { id: 'badge_07', name: 'Century Club', description: 'Make 100 contributions', icon: '💯', rarity: 'epic', requirement_type: 'contributions', requirement_value: 100 },
            { id: 'badge_08', name: 'Trusted Source', description: 'Achieve 90% reliability score', icon: '✅', rarity: 'epic', requirement_type: 'special', requirement_value: 90 },
            { id: 'badge_09', name: 'Bengaluru Transit Legend', description: 'Reach 5000 points', icon: '👑', rarity: 'legendary', requirement_type: 'points', requirement_value: 5000 }
        ];

        // Seed Bengaluru commuters for leaderboard
        const bcrypt = require('bcryptjs');
        const demoHash = bcrypt.hashSync('password123', 10);
        db.tables.users = [
            { id: 'usr_01', name: 'Karthik Rao', email: 'karthik@demo.in', password_hash: demoHash, points: 1540, level: 'Expert', reliability_score: 0.95, total_contributions: 72, streak_days: 14 },
            { id: 'usr_02', name: 'Sneha Hegde', email: 'sneha@demo.in', password_hash: demoHash, points: 1020, level: 'Contributor', reliability_score: 0.91, total_contributions: 48, streak_days: 9 },
            { id: 'usr_03', name: 'Praveen Gowda', email: 'praveen@demo.in', password_hash: demoHash, points: 810, level: 'Contributor', reliability_score: 0.88, total_contributions: 36, streak_days: 6 },
            { id: 'usr_04', name: 'Deepa Narayan', email: 'deepa@demo.in', password_hash: demoHash, points: 460, level: 'Regular', reliability_score: 0.84, total_contributions: 22, streak_days: 5 }
        ];

        db.saveToDisk();
    }

    console.log('✅ TransitIQ In-Memory Database initialized with persistent store');
    return db;
}

function closeDatabase() {
    if (dbInstance) {
        dbInstance.saveToDisk();
        dbInstance = null;
    }
}

module.exports = { getDb, initializeDatabase, closeDatabase };
