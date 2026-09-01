const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/database');
const NotificationEngine = require('./notifications');

let routeSegments = {};
try {
    const segFile = path.join(__dirname, '..', '..', 'data', 'route_378_segments.json');
    if (fs.existsSync(segFile)) {
        const segs = JSON.parse(fs.readFileSync(segFile, 'utf8'));
        segs.forEach(s => {
            routeSegments[`${s.from_stop_id}_${s.to_stop_id}`] = s.coordinates;
        });
    }
} catch (e) {
    console.error('Failed to load route segments:', e);
}

class SimulationEngine {
    static simulationInterval = null;
    static tripStates = {}; // tripId -> { segmentProgress, state: 'in_transit'|'at_stop', dwellTicks: 0, heading: 0 }

    /**
     * Start the simulation - moves buses along routes smoothly in real-time
     */
    static start(intervalMs = 1000) {
        if (this.simulationInterval) return;

        console.log('🚌 Simulation engine started (Continuous Real-Time Transit Telemetry & Stop Dwell Sync - 1s Tick)');
        this.simulationInterval = setInterval(() => {
            this.tick();
        }, intervalMs);

        // Initial tick
        this.tick();
    }

    /**
     * Stop the simulation
     */
    static stop() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
            console.log('Simulation engine stopped');
        }
    }

    /**
     * Calculate compass bearing between two coordinates in degrees (0-360)
     */
    static calculateBearing(lat1, lon1, lat2, lon2) {
        const toRad = Math.PI / 180;
        const toDeg = 180 / Math.PI;
        const phi1 = lat1 * toRad;
        const phi2 = lat2 * toRad;
        const deltaLambda = (lon2 - lon1) * toRad;

        const y = Math.sin(deltaLambda) * Math.cos(phi2);
        const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
        const bearing = Math.atan2(y, x) * toDeg;

        return (bearing + 360) % 360;
    }

    /**
     * Single simulation tick - advance all active trips forward
     */
    static tick() {
        const db = getDb();

        try {
            // Get all active trips
            const activeTrips = db.prepare(`
                SELECT t.*, b.capacity, b.id as bus_id, b.bus_number, r.name as route_name
                FROM trips t
                JOIN buses b ON t.bus_id = b.id
                JOIN routes r ON t.route_id = r.id
                WHERE t.status = 'active'
            `).all();

            for (const trip of activeTrips) {
                this.advanceTrip(trip);
            }

            // Check for scheduled trips that should start
            this.startScheduledTrips();

            // Restart completed trips to keep the demo alive
            this.recycleCompletedTrips();
        } catch (err) {
            console.error('Simulation tick error:', err);
        }
    }

    /**
     * Advance a single trip forward along its route stops
     */
    static advanceTrip(trip) {
        const db = getDb();

        // Initialize state tracker for this trip if missing
        if (!this.tripStates[trip.id]) {
            this.tripStates[trip.id] = {
                segmentProgress: trip.segment_progress !== undefined ? trip.segment_progress : 0.0,
                state: trip.state || 'in_transit',
                dwellTicks: trip.dwell_seconds ? Math.ceil(trip.dwell_seconds / 2.5) : 0,
                heading: trip.heading || 0
            };
        }

        const state = this.tripStates[trip.id];

        // Get route stops ordered by sequence
        const rawRouteStops = db.prepare(`
            SELECT rs.*, s.latitude, s.longitude, s.name as stop_name, s.is_major
            FROM route_stops rs
            JOIN stops s ON rs.stop_id = s.id
            WHERE rs.route_id = ?
            ORDER BY rs.sequence_order
        `).all(trip.route_id);

        if (!rawRouteStops || rawRouteStops.length === 0) return;

        // Sequence according to direction
        const isOutbound = trip.direction === 'outbound';
        const routeStops = isOutbound ? rawRouteStops : [...rawRouteStops].reverse();

        let currentIndex = trip.current_stop_index || 0;

        // Check if terminus reached
        if (currentIndex >= routeStops.length - 1) {
            const nextDirection = trip.direction === 'outbound' ? 'inbound' : 'outbound';
            const initialPassengers = Math.floor(Math.random() * 12) + 18;
            state.segmentProgress = 0.0;
            state.state = 'in_transit';
            state.dwellTicks = 0;
            trip.current_stop_index = 0;
            trip.direction = nextDirection;
            trip.current_passenger_count = initialPassengers;

            db.prepare(`
                UPDATE trips 
                SET status = 'active', 
                    current_stop_index = 0, 
                    current_passenger_count = ?,
                    delay_minutes = 0,
                    direction = ?,
                    segment_progress = 0.0,
                    state = 'in_transit',
                    dwell_seconds = 0
                WHERE id = ?
            `).run(initialPassengers, nextDirection, trip.id);

            const firstStop = isOutbound ? rawRouteStops[rawRouteStops.length - 1] : rawRouteStops[0];
            db.prepare(`
                UPDATE buses 
                SET current_latitude = ?, current_longitude = ?, current_speed_kmh = ?, heading = ?
                WHERE id = ?
            `).run(firstStop.latitude, firstStop.longitude, 20, state.heading, trip.bus_id);
            return;
        }

        const currentStop = routeStops[currentIndex];
        const nextStop = routeStops[currentIndex + 1];

        // Compute expected travel time and distance for this segment
        const distKm = Math.max(0.8, Math.abs((nextStop.distance_from_start_km || 0) - (currentStop.distance_from_start_km || 0)));
        const timeMin = Math.max(2, Math.abs((nextStop.avg_time_from_start_min || 0) - (currentStop.avg_time_from_start_min || 0)));

        // 1. DWELL AT STOP HANDLING
        if (state.state === 'at_stop') {
            if (state.dwellTicks > 0) {
                state.dwellTicks -= 1;
                // Bus is completely stationary at the stop
                db.prepare(`
                    UPDATE buses 
                    SET current_latitude = ?, current_longitude = ?, current_speed_kmh = 0, heading = ?
                    WHERE id = ?
                `).run(currentStop.latitude, currentStop.longitude, state.heading, trip.bus_id);

                db.prepare(`
                    UPDATE trips 
                    SET segment_progress = 0.0, state = 'at_stop', dwell_seconds = ? 
                    WHERE id = ?
                `).run(state.dwellTicks, trip.id);
                return;
            } else {
                // Dwell finished -> transition to in_transit towards next stop
                state.state = 'in_transit';
                state.segmentProgress = 0.003;

                db.prepare(`
                    UPDATE trips 
                    SET segment_progress = 0.003, state = 'in_transit', dwell_seconds = 0 
                    WHERE id = ?
                `).run(trip.id);

                // Auto-expire unboarded waitlist entries for currentStop as bus departs stop
                try {
                    db.prepare("UPDATE stop_waiting_list SET status = 'expired' WHERE stop_id = ? AND route_id = ? AND status = 'waiting'")
                        .run(currentStop.stop_id, trip.route_id);
                } catch (e) {}
            }
        }

        // 2. IN TRANSIT ADVANCEMENT
        // Calibrated realistic bus pacing: ~100-180 seconds per road segment
        const segmentDurationSec = Math.max(90, Math.min(220, timeMin * 26));
        const baseStep = 1.0 / segmentDurationSec;
        state.segmentProgress += baseStep;

        if (state.segmentProgress >= 1.0) {
            // Bus has arrived at next stop
            const nextIndex = currentIndex + 1;
            const arrivedStop = nextStop;

            // Simulate realistic passenger boarding and deboarding at this stop
            let passengerChange = 0;
            if (arrivedStop.is_major) {
                const boarding = Math.floor(Math.random() * 5) + 3;
                const deboarding = Math.floor(Math.random() * 4) + 2;
                passengerChange = boarding - deboarding;
            } else {
                const boarding = Math.floor(Math.random() * 3) + 1;
                const deboarding = Math.floor(Math.random() * 2) + 1;
                passengerChange = boarding - deboarding;
            }

            const currentCount = trip.current_passenger_count || 20;
            const newPassengerCount = Math.max(8, Math.min(trip.capacity || 55, currentCount + passengerChange));

            // Small random traffic delay adjustment (0 to 1 min)
            const delayChange = Math.random() < 0.12 ? (Math.random() < 0.5 ? 1 : -1) : 0;
            const newDelay = Math.max(0, (trip.delay_minutes || 0) + delayChange);

            // Update bus position exactly to the stop coordinates, 0 speed during stop arrival
            db.prepare(`
                UPDATE buses 
                SET current_latitude = ?, current_longitude = ?, current_speed_kmh = 0, heading = ?
                WHERE id = ?
            `).run(arrivedStop.latitude, arrivedStop.longitude, state.heading, trip.bus_id);

            // Update crowd estimate
            const capacity = trip.capacity || 55;
            const percentage = capacity > 0 ? newPassengerCount / capacity : 0;
            const level = percentage <= 0.4 ? 'low' : (percentage <= 0.7 ? 'medium' : 'high');

            db.prepare(`
                INSERT OR REPLACE INTO crowd_estimates (trip_id, stop_id, estimated_level, estimated_count, capacity_percentage, confidence, data_sources, updated_at)
                VALUES (?, ?, ?, ?, ?, 0.88, 3, datetime('now'))
            `).run(trip.id, arrivedStop.stop_id, level, newPassengerCount, percentage);

            // Check if final destination reached
            if (nextIndex >= routeStops.length - 1) {
                // Reached final terminus, turn around for next journey
                const nextDirection = trip.direction === 'outbound' ? 'inbound' : 'outbound';
                const initialPassengers = Math.floor(Math.random() * 12) + 18;
                state.segmentProgress = 0.0;
                state.state = 'at_stop';
                state.dwellTicks = 24; // 24 seconds dwell at terminal hub
                trip.current_stop_index = 0;
                trip.direction = nextDirection;
                trip.current_passenger_count = initialPassengers;

                db.prepare(`
                    UPDATE trips 
                    SET status = 'active', 
                        current_stop_index = 0, 
                        current_passenger_count = ?,
                        delay_minutes = 0,
                        direction = ?,
                        segment_progress = 0.0,
                        state = 'at_stop',
                        dwell_seconds = 24
                    WHERE id = ?
                `).run(initialPassengers, nextDirection, trip.id);
            } else {
                // Advance stop index and start station dwell
                trip.current_stop_index = nextIndex;
                state.segmentProgress = 0.0;
                state.state = 'at_stop';
                state.dwellTicks = arrivedStop.is_major ? 18 : 12; // 12-18 seconds dwell
                trip.current_passenger_count = newPassengerCount;
                trip.delay_minutes = newDelay;

                db.prepare(`
                    UPDATE trips 
                    SET current_stop_index = ?, current_passenger_count = ?, delay_minutes = ?,
                        segment_progress = 0.0, state = 'at_stop', dwell_seconds = ?
                    WHERE id = ?
                `).run(nextIndex, newPassengerCount, newDelay, state.dwellTicks, trip.id);
            }
        } else {
            // Bus is smoothly moving along the road network between currentStop and nextStop
            const p = Math.max(0, Math.min(0.999, state.segmentProgress));

            // Find segment road coordinates
            const fromId = currentStop.stop_id || currentStop.id;
            const toId = nextStop.stop_id || nextStop.id;
            let segmentCoords = routeSegments[`${fromId}_${toId}`];
            
            if (!segmentCoords && routeSegments[`${toId}_${fromId}`]) {
                segmentCoords = [...routeSegments[`${toId}_${fromId}`]].reverse();
            }

            let lat, lng;
            if (segmentCoords && segmentCoords.length > 0) {
                const idx = Math.min(segmentCoords.length - 1, Math.max(0, Math.floor(p * (segmentCoords.length - 1))));
                lat = segmentCoords[idx][0];
                lng = segmentCoords[idx][1];

                // Calculate realistic heading along road tangent
                let heading = state.heading;
                if (idx < segmentCoords.length - 1) {
                    heading = this.calculateBearing(segmentCoords[idx][0], segmentCoords[idx][1], segmentCoords[idx + 1][0], segmentCoords[idx + 1][1]);
                } else if (idx > 0) {
                    heading = this.calculateBearing(segmentCoords[idx - 1][0], segmentCoords[idx - 1][1], segmentCoords[idx][0], segmentCoords[idx][1]);
                }
                state.heading = Math.round(heading);
            } else {
                // Fallback straight interpolation
                lat = currentStop.latitude + (nextStop.latitude - currentStop.latitude) * p;
                lng = currentStop.longitude + (nextStop.longitude - currentStop.longitude) * p;
            }

            // Smooth bell-curve city bus speed profile (16 to 36 km/h)
            const speedCurve = Math.sin(p * Math.PI);
            const speed = Math.round(16 + speedCurve * 18 + (Math.random() * 2 - 1));

            db.prepare(`
                UPDATE buses 
                SET current_latitude = ?, current_longitude = ?, current_speed_kmh = ?, heading = ?
                WHERE id = ?
            `).run(lat, lng, speed, state.heading, trip.bus_id);

            db.prepare(`
                UPDATE trips 
                SET segment_progress = ?, state = ?, dwell_seconds = ?
                WHERE id = ?
            `).run(p, 'in_transit', 0, trip.id);
        }
    }

    /**
     * Start scheduled trips that are past their start time
     */
    static startScheduledTrips() {
        const db = getDb();
        const scheduledTrips = db.prepare(`
            SELECT * FROM trips 
            WHERE status = 'scheduled' AND scheduled_start <= datetime('now')
        `).all();

        for (const trip of scheduledTrips) {
            db.prepare(`
                UPDATE trips SET status = 'active', actual_start = datetime('now')
                WHERE id = ?
            `).run(trip.id);
        }
    }

    /**
     * Recycle completed trips so the live demo keeps running seamlessly
     */
    static recycleCompletedTrips() {
        const db = getDb();
        const completedTrips = db.prepare("SELECT * FROM trips WHERE status = 'completed'").all();

        for (const trip of completedTrips) {
            const initialPassengers = Math.floor(Math.random() * 12) + 18;
            const nextDirection = trip.direction === 'outbound' ? 'inbound' : 'outbound';
            if (this.tripStates[trip.id]) {
                this.tripStates[trip.id] = { segmentProgress: 0.0, state: 'in_transit', dwellTicks: 0, heading: 0 };
            }

            db.prepare(`
                UPDATE trips 
                SET status = 'active', 
                    current_stop_index = 0, 
                    current_passenger_count = ?,
                    delay_minutes = 0,
                    segment_progress = 0.0,
                    state = 'in_transit',
                    dwell_seconds = 0,
                    actual_start = datetime('now'),
                    actual_end = NULL,
                    direction = ?
                WHERE id = ?
            `).run(initialPassengers, nextDirection, trip.id);
        }
    }
}

module.exports = SimulationEngine;
