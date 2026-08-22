const { getDb } = require('../db/database');

class CrowdIntelligenceEngine {
    /**
     * Process a boarding update
     */
    static processBoarding(tripId, stopId, userId) {
        const db = getDb();
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
        if (!trip) return null;

        // Increment passenger count
        db.prepare('UPDATE trips SET current_passenger_count = current_passenger_count + 1 WHERE id = ?').run(tripId);

        // Update crowd estimate for this stop
        this.updateCrowdEstimate(tripId, stopId, trip.current_passenger_count + 1, this.getBusCapacity(trip.bus_id));

        return { passengerCount: trip.current_passenger_count + 1 };
    }

    /**
     * Process a deboarding update
     */
    static processDeboarding(tripId, stopId, userId) {
        const db = getDb();
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
        if (!trip) return null;

        const newCount = Math.max(0, trip.current_passenger_count - 1);
        db.prepare('UPDATE trips SET current_passenger_count = ? WHERE id = ?').run(newCount, tripId);

        this.updateCrowdEstimate(tripId, stopId, newCount, this.getBusCapacity(trip.bus_id));

        return { passengerCount: newCount };
    }

    /**
     * Process crowd level feedback from a user
     */
    static processCrowdFeedback(tripId, stopId, crowdLevel) {
        const db = getDb();
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
        if (!trip) return null;

        const capacity = this.getBusCapacity(trip.bus_id);

        // Map crowd level to estimated percentage
        const levelToPercentage = { low: 0.25, medium: 0.55, high: 0.85 };
        const estimatedPercentage = levelToPercentage[crowdLevel] || 0.5;
        const estimatedCount = Math.round(capacity * estimatedPercentage);

        // Get existing estimate
        const existing = db.prepare('SELECT * FROM crowd_estimates WHERE trip_id = ? AND stop_id = ?').get(tripId, stopId);

        if (existing) {
            // Weighted average with existing data
            const weight = 1 / (existing.data_sources + 1);
            const newPercentage = existing.capacity_percentage * (1 - weight) + estimatedPercentage * weight;
            const newCount = Math.round(capacity * newPercentage);
            const newLevel = this.percentageToLevel(newPercentage);

            db.prepare(`
                UPDATE crowd_estimates 
                SET estimated_level = ?, estimated_count = ?, capacity_percentage = ?, 
                    confidence = MIN(1.0, confidence + 0.1), data_sources = data_sources + 1,
                    updated_at = datetime('now')
                WHERE trip_id = ? AND stop_id = ?
            `).run(newLevel, newCount, newPercentage, tripId, stopId);
        } else {
            db.prepare(`
                INSERT INTO crowd_estimates (trip_id, stop_id, estimated_level, estimated_count, capacity_percentage, confidence, data_sources)
                VALUES (?, ?, ?, ?, ?, 0.5, 1)
            `).run(tripId, stopId, crowdLevel, estimatedCount, estimatedPercentage);
        }

        return { level: crowdLevel, estimatedCount };
    }

    /**
     * Get crowd estimate for a specific trip at a specific stop
     */
    static getCrowdEstimate(tripId, stopId) {
        const db = getDb();

        // Check if we have a direct estimate
        const estimate = db.prepare('SELECT * FROM crowd_estimates WHERE trip_id = ? AND stop_id = ?').get(tripId, stopId);
        if (estimate) return estimate;

        // Predict based on current passenger count and route patterns
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
        if (!trip) return null;

        const capacity = this.getBusCapacity(trip.bus_id);
        const percentage = capacity > 0 ? trip.current_passenger_count / capacity : 0;

        return {
            trip_id: tripId,
            stop_id: stopId,
            estimated_level: this.percentageToLevel(percentage),
            estimated_count: trip.current_passenger_count,
            capacity_percentage: percentage,
            confidence: 0.3, // Low confidence for predictions
            data_sources: 0,
            predicted: true
        };
    }

    /**
     * Predict crowd level at a future stop based on historical patterns
     */
    static predictCrowdAtStop(tripId, targetStopId) {
        const db = getDb();
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
        if (!trip) return null;

        const capacity = this.getBusCapacity(trip.bus_id);
        const routeStops = db.prepare(`
            SELECT rs.*, s.name as stop_name 
            FROM route_stops rs 
            JOIN stops s ON rs.stop_id = s.id 
            WHERE rs.route_id = ? 
            ORDER BY rs.sequence_order
        `).all(trip.route_id);

        const currentIndex = trip.current_stop_index;
        const targetStop = routeStops.find(rs => rs.stop_id === targetStopId);
        if (!targetStop) return null;

        const targetIndex = routeStops.indexOf(targetStop);

        // Simple prediction: estimate boarding/deboarding at each intermediate stop
        let predictedCount = trip.current_passenger_count;

        for (let i = currentIndex + 1; i <= targetIndex; i++) {
            const stop = routeStops[i];
            // Estimate based on stop characteristics
            const isMajorStop = db.prepare('SELECT is_major FROM stops WHERE id = ?').get(stop.stop_id);

            if (isMajorStop && isMajorStop.is_major) {
                // Major stops: more boarding/deboarding
                if (trip.direction === 'outbound') {
                    predictedCount += Math.floor(Math.random() * 5) - 2; // Net change: -2 to +3
                } else {
                    predictedCount += Math.floor(Math.random() * 5) - 1; // Net change: -1 to +4
                }
            } else {
                predictedCount += Math.floor(Math.random() * 3) - 1; // Net change: -1 to +2
            }

            predictedCount = Math.max(0, Math.min(capacity, predictedCount));
        }

        const percentage = capacity > 0 ? predictedCount / capacity : 0;

        return {
            trip_id: tripId,
            stop_id: targetStopId,
            stop_name: targetStop.stop_name,
            estimated_level: this.percentageToLevel(percentage),
            estimated_count: predictedCount,
            capacity: capacity,
            capacity_percentage: Math.round(percentage * 100),
            confidence: Math.max(0.2, 0.8 - (targetIndex - currentIndex) * 0.1),
            predicted: true
        };
    }

    /**
     * Update crowd estimate in database
     */
    static updateCrowdEstimate(tripId, stopId, passengerCount, capacity) {
        const db = getDb();
        const percentage = capacity > 0 ? passengerCount / capacity : 0;
        const level = this.percentageToLevel(percentage);

        const existing = db.prepare('SELECT * FROM crowd_estimates WHERE trip_id = ? AND stop_id = ?').get(tripId, stopId);

        if (existing) {
            db.prepare(`
                UPDATE crowd_estimates 
                SET estimated_level = ?, estimated_count = ?, capacity_percentage = ?,
                    confidence = MIN(1.0, confidence + 0.05), updated_at = datetime('now')
                WHERE trip_id = ? AND stop_id = ?
            `).run(level, passengerCount, percentage, tripId, stopId);
        } else {
            db.prepare(`
                INSERT INTO crowd_estimates (trip_id, stop_id, estimated_level, estimated_count, capacity_percentage, confidence, data_sources)
                VALUES (?, ?, ?, ?, ?, 0.4, 1)
            `).run(tripId, stopId, level, passengerCount, percentage);
        }
    }

    static getBusCapacity(busId) {
        const db = getDb();
        const bus = db.prepare('SELECT capacity FROM buses WHERE id = ?').get(busId);
        return bus ? bus.capacity : 50;
    }

    static percentageToLevel(percentage) {
        if (percentage <= 0.4) return 'low';
        if (percentage <= 0.7) return 'medium';
        return 'high';
    }
}

module.exports = CrowdIntelligenceEngine;
