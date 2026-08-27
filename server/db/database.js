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
            user_journeys: [],
            stop_waiting_list: []
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
        if (lower.includes('from stops where id = ?')) {
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
                        current_speed_kmh: b.current_speed_kmh || 0,
                        heading: b.heading || 0,
                        segment_progress: t.segment_progress !== undefined ? t.segment_progress : 0.0,
                        state: t.state || 'in_transit',
                        dwell_seconds: t.dwell_seconds || 0,
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
                    return {
                        ...t,
                        bus_number: b.bus_number,
                        capacity: b.capacity || 50,
                        current_latitude: b.current_latitude,
                        current_longitude: b.current_longitude,
                        current_speed_kmh: b.current_speed_kmh || 0,
                        heading: b.heading || 0,
                        segment_progress: t.segment_progress !== undefined ? t.segment_progress : 0.0,
                        state: t.state || 'in_transit'
                    };
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
                current_speed_kmh: b.current_speed_kmh || 0,
                heading: b.heading || 0,
                segment_progress: t.segment_progress !== undefined ? t.segment_progress : 0.0,
                state: t.state || 'in_transit',
                dwell_seconds: t.dwell_seconds || 0,
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
        if (lower === "select * from trips where status = 'active'" || lower.includes("from trips where status = 'active'")) {
            return this.tables.trips.filter(t => t.status === 'active').map(t => ({
                ...t,
                segment_progress: t.segment_progress !== undefined ? t.segment_progress : 0.0,
                state: t.state || 'in_transit',
                dwell_seconds: t.dwell_seconds || 0
            }));
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
                return {
                    ...t,
                    capacity: b.capacity || 50,
                    bus_id: b.id,
                    heading: b.heading || 0,
                    current_latitude: b.current_latitude,
                    current_longitude: b.current_longitude,
                    current_speed_kmh: b.current_speed_kmh || 0,
                    segment_progress: t.segment_progress !== undefined ? t.segment_progress : 0.0,
                    state: t.state || 'in_transit',
                    route_name: r.name
                };
            });
        }

        // 6. Buses
        if (lower.includes('from buses where id = ?') || lower.includes('from buses b where b.id = ?')) {
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
            const limit = params[1] || 50;
            return this.tables.point_transactions
                .filter(pt => pt.user_id === params[0])
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, limit);
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

        // 13. Stop Waiting List
        if (lower.includes('from stop_waiting_list where stop_id = ? and route_id = ? and status = ?')) {
            return this.tables.stop_waiting_list.filter(w => w.stop_id === params[0] && w.route_id === params[1] && w.status === params[2]);
        }
        if (lower.includes('from stop_waiting_list where stop_id = ? and status = ?')) {
            return this.tables.stop_waiting_list.filter(w => w.stop_id === params[0] && w.status === params[1]);
        }
        if (lower.includes('from stop_waiting_list where trip_id = ? and status = ?')) {
            return this.tables.stop_waiting_list.filter(w => w.trip_id === params[0] && w.status === params[1]);
        }
        if (lower.includes('from stop_waiting_list where user_id = ? and status = ?')) {
            return this.tables.stop_waiting_list.filter(w => w.user_id === params[0] && w.status === params[1]);
        }
        if (lower.includes('from stop_waiting_list where id = ?')) {
            const w = this.tables.stop_waiting_list.find(x => x.id === params[0]);
            return w ? [{ ...w }] : [];
        }
        if (lower.includes('from stop_waiting_list')) {
            return this.tables.stop_waiting_list.map(w => ({ ...w }));
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
        if (lower.includes('update trips set segment_progress = ?, state = ?, dwell_seconds = ? where id = ?')) {
            const t = this.tables.trips.find(x => x.id === params[3]);
            if (t) {
                t.segment_progress = params[0];
                t.state = params[1];
                t.dwell_seconds = params[2];
            }
            return { changes: 1 };
        }
        if (lower.includes('update trips set segment_progress = ?, state =') || lower.includes('update trips set segment_progress = ?')) {
            const tripId = params[params.length - 1];
            const t = this.tables.trips.find(x => x.id === tripId);
            if (t) {
                t.segment_progress = params[0];
                if (lower.includes("state = 'at_stop'")) t.state = 'at_stop';
                else if (lower.includes("state = 'in_transit'")) t.state = 'in_transit';
                if (lower.includes("dwell_seconds = 0")) t.dwell_seconds = 0;
                else if (params.length > 2 && typeof params[1] === 'number') t.dwell_seconds = params[1];
            }
            return { changes: 1 };
        }
        if (lower.includes('update trips set current_stop_index = ?, current_passenger_count = ?, delay_minutes = ?, segment_progress = ?, state = ?, dwell_seconds = ? where id = ?')) {
            const tripId = params[6];
            const t = this.tables.trips.find(x => x.id === tripId);
            if (t) {
                t.current_stop_index = params[0];
                t.current_passenger_count = params[1];
                t.delay_minutes = params[2];
                t.segment_progress = params[3];
                t.state = params[4];
                t.dwell_seconds = params[5];
            }
            return { changes: 1 };
        }
        if (lower.includes('update trips set current_stop_index')) {
            const tripId = params[params.length - 1];
            const t = this.tables.trips.find(x => x.id === tripId);
            if (t) {
                t.current_stop_index = params[0];
                if (params.length >= 3) {
                    t.current_passenger_count = params[1];
                    t.delay_minutes = params[2];
                }
                if (lower.includes("state = 'at_stop'")) t.state = 'at_stop';
                if (lower.includes("segment_progress = 0")) t.segment_progress = 0.0;
                if (params.length === 5) {
                    t.dwell_seconds = params[3];
                }
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
            const tripId = params[params.length - 1] || params[0];
            const t = this.tables.trips.find(x => x.id === tripId);
            if (t) {
                t.status = 'active';
                t.current_stop_index = 0;
                t.current_passenger_count = (typeof params[0] === 'number') ? params[0] : 25;
                t.delay_minutes = 0;
                t.segment_progress = 0.0;
                t.state = 'in_transit';
                t.dwell_seconds = 0;
                t.actual_start = new Date().toISOString();
                t.actual_end = null;
                if (params.length >= 3 && typeof params[1] === 'string') {
                    t.direction = params[1];
                }
            }
            return { changes: 1 };
        }

        // 3. Buses
        if (lower.includes('update buses set current_latitude = ?, current_longitude = ?, current_speed_kmh = ?, heading = ? where id = ?')) {
            const b = this.tables.buses.find(x => x.id === params[4]);
            if (b) {
                b.current_latitude = params[0];
                b.current_longitude = params[1];
                b.current_speed_kmh = params[2];
                b.heading = params[3];
            }
            return { changes: 1 };
        }
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

        // 11. Stop Waiting List
        if (lower.startsWith('insert into stop_waiting_list')) {
            const [id, user_id, stop_id, route_id, trip_id, destination_stop_id, status] = params;
            this.tables.stop_waiting_list.push({
                id,
                user_id,
                stop_id,
                route_id,
                trip_id: trip_id || null,
                destination_stop_id: destination_stop_id || null,
                status: status || 'waiting',
                joined_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            });
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update stop_waiting_list set status = ? where id = ?')) {
            const item = this.tables.stop_waiting_list.find(x => x.id === params[1]);
            if (item) {
                item.status = params[0];
                item.updated_at = new Date().toISOString();
            }
            this.saveToDisk();
            return { changes: 1 };
        }
        if (lower.includes('update stop_waiting_list set status = ? where user_id = ? and stop_id = ? and status = ?')) {
            const items = this.tables.stop_waiting_list.filter(x => x.user_id === params[1] && x.stop_id === params[2] && x.status === params[3]);
            items.forEach(item => {
                item.status = params[0];
                item.updated_at = new Date().toISOString();
            });
            this.saveToDisk();
            return { changes: items.length };
        }
        if (lower.includes('update stop_waiting_list set status = ? where user_id = ? and status = ?')) {
            const items = this.tables.stop_waiting_list.filter(x => x.user_id === params[1] && x.status === params[2]);
            items.forEach(item => {
                item.status = params[0];
                item.updated_at = new Date().toISOString();
            });
            this.saveToDisk();
            return { changes: items.length };
        }
        if (lower.includes('delete from stop_waiting_list where id = ?')) {
            const idx = this.tables.stop_waiting_list.findIndex(x => x.id === params[0]);
            if (idx !== -1) {
                this.tables.stop_waiting_list.splice(idx, 1);
                this.saveToDisk();
                return { changes: 1 };
            }
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

    // Seed Data - Single Route 378 (Electronic City to Kengeri TTMC)
    if (!loaded || !db.tables.routes || db.tables.routes.length === 0 || db.tables.routes[0].route_number !== '378' || !db.tables.routes[0].name.includes('Electronic City')) {
        const bcrypt = require('bcryptjs');
        const demoHash = bcrypt.hashSync('password123', 10);

        db.tables.users = [
            { id: 'usr_01', name: 'Karthik Rao', email: 'karthik@demo.in', password_hash: demoHash, points: 1695, level: 'Contributor', reliability_score: 0.96, total_contributions: 23, streak_days: 2, last_contribution_date: '2026-08-24' },
            { id: 'usr_02', name: 'Sneha Hegde', email: 'sneha@demo.in', password_hash: demoHash, points: 1020, level: 'Contributor', reliability_score: 0.91, total_contributions: 48, streak_days: 9 },
            { id: 'usr_03', name: 'Praveen Gowda', email: 'praveen@demo.in', password_hash: demoHash, points: 810, level: 'Contributor', reliability_score: 0.88, total_contributions: 36, streak_days: 6 },
            { id: 'usr_04', name: 'Deepa Narayan', email: 'deepa@demo.in', password_hash: demoHash, points: 460, level: 'Regular', reliability_score: 0.84, total_contributions: 22, streak_days: 5 }
        ];

        db.tables.stops = [
            { id: 'stop_blr_01', name: 'Electronic City Wipro Gate', latitude: 12.84515, longitude: 77.66021, zone: 'Electronic City Hub', is_major: 1 },
            { id: 'stop_blr_02', name: 'Electronic City Toll Gate / Phase 1', latitude: 12.84923, longitude: 77.67052, zone: 'Electronic City Corridor', is_major: 0 },
            { id: 'stop_blr_03', name: 'Konappana Agrahara', latitude: 12.85795, longitude: 77.67498, zone: 'Hosur Rd Corridor', is_major: 0 },
            { id: 'stop_blr_04', name: 'Hosa Road Junction', latitude: 12.87079, longitude: 77.66602, zone: 'Hosur Rd Corridor', is_major: 0 },
            { id: 'stop_blr_05', name: 'Gottigere (Bannerghatta Rd)', latitude: 12.85819, longitude: 77.58531, zone: 'Bannerghatta Corridor', is_major: 0 },
            { id: 'stop_blr_06', name: 'Silk Institute (Kanakapura Rd)', latitude: 12.86242, longitude: 77.53028, zone: 'Kanakapura Corridor', is_major: 1 },
            { id: 'stop_blr_07', name: 'Thalaghattapura', latitude: 12.87181, longitude: 77.53717, zone: 'Kanakapura Corridor', is_major: 0 },
            { id: 'stop_blr_08', name: 'Vajrahalli', latitude: 12.88140, longitude: 77.54630, zone: 'Kanakapura Corridor', is_major: 0 },
            { id: 'stop_blr_09', name: 'Konanakunte Cross', latitude: 12.88950, longitude: 77.57381, zone: 'South Hub', is_major: 1 },
            { id: 'stop_blr_10', name: 'Uttarahalli / Channasandra', latitude: 12.90500, longitude: 77.52494, zone: 'Uttarahalli Corridor', is_major: 0 },
            { id: 'stop_blr_11', name: 'Rajarajeshwari Nagar Gate', latitude: 12.92891, longitude: 77.51884, zone: 'Mysore Rd Corridor', is_major: 0 },
            { id: 'stop_blr_12', name: 'Bangalore University Gate', latitude: 12.91833, longitude: 77.50172, zone: 'Mysore Rd Corridor', is_major: 0 },
            { id: 'stop_blr_13', name: 'Kengeri TTMC / Bus Terminal', latitude: 12.90804, longitude: 77.48350, zone: 'West Terminal', is_major: 1 },
            { id: 'stop_blr_14', name: 'Kengeri Satellite Town', latitude: 12.89858, longitude: 77.47800, zone: 'West Terminal', is_major: 0 }
        ];

        db.tables.routes = [
            { id: 'route_blr_378', name: 'Electronic City - Kengeri TTMC', route_number: '378', color: '#10B981', description: 'Direct BMTC Route 378 connecting Electronic City to Kengeri TTMC via Begur, Gottigere, Konanakunte & Uttarahalli', total_distance_km: 32.0, avg_duration_minutes: 75, fare_lkr: 45, status: 'active' }
        ];

        db.tables.route_stops = [
            { route_id: 'route_blr_378', stop_id: 'stop_blr_01', sequence_order: 1, distance_from_start_km: 0, avg_time_from_start_min: 0 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_02', sequence_order: 2, distance_from_start_km: 2.0, avg_time_from_start_min: 5 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_03', sequence_order: 3, distance_from_start_km: 4.2, avg_time_from_start_min: 10 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_04', sequence_order: 4, distance_from_start_km: 6.8, avg_time_from_start_min: 16 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_05', sequence_order: 5, distance_from_start_km: 13.5, avg_time_from_start_min: 30 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_06', sequence_order: 6, distance_from_start_km: 19.0, avg_time_from_start_min: 42 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_07', sequence_order: 7, distance_from_start_km: 20.8, avg_time_from_start_min: 47 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_08', sequence_order: 8, distance_from_start_km: 22.5, avg_time_from_start_min: 52 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_09', sequence_order: 9, distance_from_start_km: 25.0, avg_time_from_start_min: 58 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_10', sequence_order: 10, distance_from_start_km: 27.5, avg_time_from_start_min: 64 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_11', sequence_order: 11, distance_from_start_km: 29.5, avg_time_from_start_min: 68 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_12', sequence_order: 12, distance_from_start_km: 30.8, avg_time_from_start_min: 71 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_13', sequence_order: 13, distance_from_start_km: 32.0, avg_time_from_start_min: 75 },
            { route_id: 'route_blr_378', stop_id: 'stop_blr_14', sequence_order: 14, distance_from_start_km: 33.5, avg_time_from_start_min: 80 }
        ];

        db.tables.buses = [
            { id: 'bus_blr_01', route_id: 'route_blr_378', bus_number: 'KA-01-F-3781', capacity: 55, current_latitude: 12.8518, current_longitude: 77.6716, current_speed_kmh: 34, driver_name: 'Manjunath Gowda', status: 'in_service', heading: 323 },
            { id: 'bus_blr_02', route_id: 'route_blr_378', bus_number: 'KA-57-F-3782', capacity: 55, current_latitude: 12.8637, current_longitude: 77.5500, current_speed_kmh: 42, driver_name: 'Ramesh Kumar', status: 'in_service', heading: 40 },
            { id: 'bus_blr_03', route_id: 'route_blr_378', bus_number: 'KA-41-F-3783', capacity: 52, current_latitude: 12.9117, current_longitude: 77.4899, current_speed_kmh: 38, driver_name: 'Shankarappa', status: 'in_service', heading: 60 },
            { id: 'bus_blr_04', route_id: 'route_blr_378', bus_number: 'KA-05-AF-3784', capacity: 55, current_latitude: 12.8972, current_longitude: 77.5494, current_speed_kmh: 40, driver_name: 'Venkatesh Murthy', status: 'in_service', heading: 115 }
        ];

        db.tables.trips = [
            { id: 'trip_blr_01', bus_id: 'bus_blr_01', route_id: 'route_blr_378', direction: 'outbound', scheduled_start: new Date(Date.now() - 5 * 60000).toISOString(), status: 'active', current_stop_index: 1, current_passenger_count: 16, delay_minutes: 0, segment_progress: 0.25, state: 'in_transit', dwell_seconds: 0 },
            { id: 'trip_blr_02', bus_id: 'bus_blr_02', route_id: 'route_blr_378', direction: 'outbound', scheduled_start: new Date(Date.now() - 28 * 60000).toISOString(), status: 'active', current_stop_index: 5, current_passenger_count: 32, delay_minutes: 1, segment_progress: 0.40, state: 'in_transit', dwell_seconds: 0 },
            { id: 'trip_blr_03', bus_id: 'bus_blr_03', route_id: 'route_blr_378', direction: 'inbound', scheduled_start: new Date(Date.now() - 12 * 60000).toISOString(), status: 'active', current_stop_index: 2, current_passenger_count: 20, delay_minutes: 0, segment_progress: 0.35, state: 'in_transit', dwell_seconds: 0 },
            { id: 'trip_blr_04', bus_id: 'bus_blr_04', route_id: 'route_blr_378', direction: 'inbound', scheduled_start: new Date(Date.now() - 36 * 60000).toISOString(), status: 'active', current_stop_index: 8, current_passenger_count: 45, delay_minutes: 2, segment_progress: 0.50, state: 'in_transit', dwell_seconds: 0 }
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

        db.tables.stop_waiting_list = [];

        db.tables.user_updates = [];
        db.tables.crowd_estimates = [];
        db.tables.user_badges = [];
        db.tables.complaints = [];
        db.tables.notifications = [];
        db.tables.point_transactions = [];
        db.tables.user_journeys = [];

        db.saveToDisk();
    } else {
        if (!db.tables.stop_waiting_list) {
            db.tables.stop_waiting_list = [];
            db.saveToDisk();
        }
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
