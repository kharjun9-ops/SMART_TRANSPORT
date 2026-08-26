const { getDb } = require('../db/database');

class SimulationEngine {
    static simulationInterval = null;
    static tripStates = {}; // tripId -> { segmentProgress, state: 'in_transit'|'at_stop', dwellTicks: 0, heading: 0 }

    /**
     * Start the simulation - moves buses along routes smoothly in real-time
     */
    static start(intervalMs = 2500) {
        if (this.simulationInterval) return;

        console.log('🚌 Simulation engine started (Continuous Real-Time Transit Telemetry & Stop Dwell Sync)');
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
                    SET segment_progress = ?, state = ?, dwell_seconds = ? 
                    WHERE id = ?
                `).run(0.0, 'at_stop', state.dwellTicks * 2, trip.id);
                return;
            } else {
                // Dwell finished -> transition to in_transit towards next stop
                state.state = 'in_transit';
                state.segmentProgress = 0.05;
            }
        }

        // 2. IN TRANSIT ADVANCEMENT
        // Progress rate is distance and time calibrated:
        // Shorter segments move faster in fraction, longer segments progress proportionally
        const baseStep = Math.max(0.06, Math.min(0.18, 0.7 / timeMin));
        state.segmentProgress += baseStep;

        const heading = this.calculateBearing(currentStop.latitude, currentStop.longitude, nextStop.latitude, nextStop.longitude);
        state.heading = Math.round(heading);

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
                state.dwellTicks = 3; // 3 ticks dwell at terminal hub
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
                        segment_progress = ?,
                        state = ?,
                        dwell_seconds = ?
                    WHERE id = ?
                `).run(initialPassengers, nextDirection, 0.0, 'at_stop', 8, trip.id);
            } else {
                // Advance stop index and start station dwell
                trip.current_stop_index = nextIndex;
                state.segmentProgress = 0.0;
                state.state = 'at_stop';
                state.dwellTicks = arrivedStop.is_major ? 3 : 2; // 2-3 ticks dwell
                trip.current_passenger_count = newPassengerCount;
                trip.delay_minutes = newDelay;

                db.prepare(`
                    UPDATE trips 
                    SET current_stop_index = ?, current_passenger_count = ?, delay_minutes = ?,
                        segment_progress = ?, state = ?, dwell_seconds = ?
                    WHERE id = ?
                `).run(nextIndex, newPassengerCount, newDelay, 0.0, 'at_stop', state.dwellTicks * 2, trip.id);
            }
        } else {
            // Bus is smoothly moving between currentStop and nextStop
            const p = state.segmentProgress;

            // Interpolate position smoothly along the direction of travel
            const lat = currentStop.latitude + (nextStop.latitude - currentStop.latitude) * p;
            const lng = currentStop.longitude + (nextStop.longitude - currentStop.longitude) * p;

            // Smooth bell-curve speed profile: accelerates out of stop (18 km/h), cruises mid-segment (38-48 km/h), slows near stop (15 km/h)
            const speedCurve = Math.sin(p * Math.PI);
            const speed = Math.round(20 + speedCurve * 26 + (Math.random() * 4 - 2));

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
