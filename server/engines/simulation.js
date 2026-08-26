const { getDb } = require('../db/database');

class SimulationEngine {
    static simulationInterval = null;
    static segmentProgress = {}; // tripId -> progress (0.0 to 1.0)

    /**
     * Start the simulation - moves buses along routes smoothly in real-time
     */
    static start(intervalMs = 4000) {
        if (this.simulationInterval) return;

        console.log('🚌 Simulation engine started (Continuous Real-Time Transit Telemetry)');
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
     * Single simulation tick - advance all active trips forward
     */
    static tick() {
        const db = getDb();

        try {
            // Get all active trips
            const activeTrips = db.prepare(`
                SELECT t.*, b.capacity, b.id as bus_id, r.name as route_name
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
            // Silently handle errors to keep simulation running
        }
    }

    /**
     * Advance a single trip forward along its route stops
     */
    static advanceTrip(trip) {
        const db = getDb();

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
        if (currentIndex >= routeStops.length - 1) {
            // Bus reached terminus, turn around for return trip
            const nextDirection = trip.direction === 'outbound' ? 'inbound' : 'outbound';
            const initialPassengers = Math.floor(Math.random() * 12) + 18;
            this.segmentProgress[trip.id] = 0.0;
            trip.current_stop_index = 0;
            trip.direction = nextDirection;
            trip.current_passenger_count = initialPassengers;

            db.prepare(`
                UPDATE trips 
                SET status = 'active', 
                    current_stop_index = 0, 
                    current_passenger_count = ?,
                    delay_minutes = 0,
                    direction = ?
                WHERE id = ?
            `).run(initialPassengers, nextDirection, trip.id);
            return;
        }

        const currentStop = routeStops[currentIndex];
        const nextStop = routeStops[currentIndex + 1];

        // Advance segment progress steadily forward (0.0 -> 0.25 -> 0.50 -> 0.75 -> 1.0)
        let progress = (this.segmentProgress[trip.id] || 0) + 0.25;

        if (progress >= 1.0) {
            // Bus has arrived at the next stop
            const nextIndex = currentIndex + 1;
            const arrivedStop = nextStop;

            // Simulate realistic passenger boarding and deboarding at this stop
            let passengerChange = 0;
            if (arrivedStop.is_major) {
                const boarding = Math.floor(Math.random() * 4) + 2;
                const deboarding = Math.floor(Math.random() * 3) + 1;
                passengerChange = boarding - deboarding;
            } else {
                const boarding = Math.floor(Math.random() * 2) + 1;
                const deboarding = Math.floor(Math.random() * 2);
                passengerChange = boarding - deboarding;
            }

            const currentCount = trip.current_passenger_count || 20;
            const newPassengerCount = Math.max(8, Math.min(trip.capacity || 55, currentCount + passengerChange));

            // Small random traffic delay adjustment (0 to 1 min)
            const delayChange = Math.random() < 0.15 ? (Math.random() < 0.5 ? 1 : -1) : 0;
            const newDelay = Math.max(0, (trip.delay_minutes || 0) + delayChange);

            // Update bus position exactly to the stop coordinates
            db.prepare(`
                UPDATE buses 
                SET current_latitude = ?, current_longitude = ?, current_speed_kmh = ?
                WHERE id = ?
            `).run(arrivedStop.latitude, arrivedStop.longitude, 25, trip.bus_id);

            // Update crowd estimate
            const capacity = trip.capacity || 55;
            const percentage = capacity > 0 ? newPassengerCount / capacity : 0;
            const level = percentage <= 0.4 ? 'low' : (percentage <= 0.7 ? 'medium' : 'high');

            db.prepare(`
                INSERT OR REPLACE INTO crowd_estimates (trip_id, stop_id, estimated_level, estimated_count, capacity_percentage, confidence, data_sources, updated_at)
                VALUES (?, ?, ?, ?, ?, 0.85, 2, datetime('now'))
            `).run(trip.id, arrivedStop.stop_id, level, newPassengerCount, percentage);

            // Check if final destination reached
            if (nextIndex >= routeStops.length - 1) {
                // Bus reached final terminus, seamlessly turnaround for next trip
                const nextDirection = trip.direction === 'outbound' ? 'inbound' : 'outbound';
                const initialPassengers = Math.floor(Math.random() * 12) + 18;
                this.segmentProgress[trip.id] = 0.0;
                trip.current_stop_index = 0;
                trip.direction = nextDirection;
                trip.current_passenger_count = initialPassengers;

                db.prepare(`
                    UPDATE trips 
                    SET status = 'active', 
                        current_stop_index = 0, 
                        current_passenger_count = ?,
                        delay_minutes = 0,
                        direction = ?
                    WHERE id = ?
                `).run(initialPassengers, nextDirection, trip.id);
            } else {
                // Update trip record
                trip.current_stop_index = nextIndex;
                this.segmentProgress[trip.id] = 0.0;
                trip.current_passenger_count = newPassengerCount;
                trip.delay_minutes = newDelay;

                db.prepare(`
                    UPDATE trips 
                    SET current_stop_index = ?, current_passenger_count = ?, delay_minutes = ?
                    WHERE id = ?
                `).run(nextIndex, newPassengerCount, newDelay, trip.id);
            }
        } else {
            // Bus is moving smoothly between currentStop and nextStop
            this.segmentProgress[trip.id] = progress;

            // Interpolate position along the direction of travel
            const lat = currentStop.latitude + (nextStop.latitude - currentStop.latitude) * progress;
            const lng = currentStop.longitude + (nextStop.longitude - currentStop.longitude) * progress;
            const speed = 28 + Math.round(Math.sin(progress * Math.PI) * 12); // Speed peaks mid-segment

            db.prepare(`
                UPDATE buses 
                SET current_latitude = ?, current_longitude = ?, current_speed_kmh = ?
                WHERE id = ?
            `).run(lat, lng, speed, trip.bus_id);
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
            this.segmentProgress[trip.id] = 0.0;

            db.prepare(`
                UPDATE trips 
                SET status = 'active', 
                    current_stop_index = 0, 
                    current_passenger_count = ?,
                    delay_minutes = 0,
                    actual_start = datetime('now'),
                    actual_end = NULL,
                    direction = ?
                WHERE id = ?
            `).run(initialPassengers, nextDirection, trip.id);
        }
    }
}

module.exports = SimulationEngine;
