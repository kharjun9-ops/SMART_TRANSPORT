const { getDb } = require('../db/database');

class SimulationEngine {
    static simulationInterval = null;

    /**
     * Start the simulation - moves buses along routes and simulates crowd changes
     */
    static start(intervalMs = 5000) {
        if (this.simulationInterval) return;

        console.log('🚌 Simulation engine started');
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
     * Single simulation tick - advance all active trips
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
     * Advance a single trip along its route
     */
    static advanceTrip(trip) {
        const db = getDb();

        // Get route stops
        const routeStops = db.prepare(`
            SELECT rs.*, s.latitude, s.longitude, s.name as stop_name, s.is_major
            FROM route_stops rs
            JOIN stops s ON rs.stop_id = s.id
            WHERE rs.route_id = ?
            ORDER BY rs.sequence_order
        `).all(trip.route_id);

        if (routeStops.length === 0) return;

        const currentIndex = trip.current_stop_index;

        // Randomly decide whether to advance to next stop (simulates travel time)
        const shouldAdvance = Math.random() < 0.15; // ~15% chance per tick

        if (shouldAdvance && currentIndex < routeStops.length - 1) {
            const nextIndex = currentIndex + 1;
            const nextStop = routeStops[nextIndex];

            // Simulate passenger changes
            let passengerChange = 0;
            if (nextStop.is_major) {
                // Major stops: more activity
                const boarding = Math.floor(Math.random() * 8) + 2;
                const deboarding = Math.floor(Math.random() * 6);
                passengerChange = boarding - deboarding;
            } else {
                const boarding = Math.floor(Math.random() * 4);
                const deboarding = Math.floor(Math.random() * 3);
                passengerChange = boarding - deboarding;
            }

            const newPassengerCount = Math.max(0, Math.min(trip.capacity, trip.current_passenger_count + passengerChange));

            // Simulate delay changes
            const delayChange = Math.random() < 0.2 ? Math.floor(Math.random() * 3) - 1 : 0;
            const newDelay = Math.max(0, (trip.delay_minutes || 0) + delayChange);

            // Update trip
            db.prepare(`
                UPDATE trips 
                SET current_stop_index = ?, current_passenger_count = ?, delay_minutes = ?
                WHERE id = ?
            `).run(nextIndex, newPassengerCount, newDelay, trip.id);

            // Update bus position
            db.prepare(`
                UPDATE buses 
                SET current_latitude = ?, current_longitude = ?, 
                    current_speed_kmh = ?
                WHERE id = ?
            `).run(nextStop.latitude, nextStop.longitude, 15 + Math.random() * 30, trip.bus_id);

            // Update crowd estimate
            const capacity = trip.capacity;
            const percentage = capacity > 0 ? newPassengerCount / capacity : 0;
            const level = percentage <= 0.4 ? 'low' : (percentage <= 0.7 ? 'medium' : 'high');

            db.prepare(`
                INSERT OR REPLACE INTO crowd_estimates (trip_id, stop_id, estimated_level, estimated_count, capacity_percentage, confidence, data_sources, updated_at)
                VALUES (?, ?, ?, ?, ?, 0.6, 1, datetime('now'))
            `).run(trip.id, nextStop.stop_id, level, newPassengerCount, percentage);

            // Check if trip is complete
            if (nextIndex >= routeStops.length - 1) {
                db.prepare("UPDATE trips SET status = 'completed', actual_end = datetime('now') WHERE id = ?")
                    .run(trip.id);
            }
        } else if (currentIndex < routeStops.length - 1) {
            // Interpolate bus position between stops
            const currentStop = routeStops[currentIndex];
            const nextStop = routeStops[currentIndex + 1];

            const progress = Math.random();
            const lat = currentStop.latitude + (nextStop.latitude - currentStop.latitude) * progress;
            const lng = currentStop.longitude + (nextStop.longitude - currentStop.longitude) * progress;

            db.prepare(`
                UPDATE buses 
                SET current_latitude = ?, current_longitude = ?, current_speed_kmh = ?
                WHERE id = ?
            `).run(lat, lng, 10 + Math.random() * 40, trip.bus_id);
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
     * Recycle completed trips to keep the demo running
     */
    static recycleCompletedTrips() {
        const db = getDb();
        const completedTrips = db.prepare("SELECT * FROM trips WHERE status = 'completed'").all();

        for (const trip of completedTrips) {
            const initialPassengers = Math.floor(Math.random() * 15) + 5;
            db.prepare(`
                UPDATE trips 
                SET status = 'active', 
                    current_stop_index = 0, 
                    current_passenger_count = ?,
                    delay_minutes = 0,
                    actual_start = datetime('now'),
                    actual_end = NULL,
                    direction = CASE WHEN direction = 'outbound' THEN 'inbound' ELSE 'outbound' END
                WHERE id = ?
            `).run(initialPassengers, trip.id);
        }
    }
}

module.exports = SimulationEngine;
