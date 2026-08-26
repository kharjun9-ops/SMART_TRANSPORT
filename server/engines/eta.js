const { getDb } = require('../db/database');

class ETAEngine {
    /**
     * Calculate ETA for a trip to reach a specific stop
     */
    static calculateETA(tripId, targetStopId) {
        const db = getDb();
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
        if (!trip) return null;

        const rawRouteStops = db.prepare(`
            SELECT rs.*, s.name as stop_name, s.latitude, s.longitude
            FROM route_stops rs
            JOIN stops s ON rs.stop_id = s.id
            WHERE rs.route_id = ?
            ORDER BY rs.sequence_order
        `).all(trip.route_id);

        // Direction-aware ordering (must match simulation engine)
        const routeStops = trip.direction === 'inbound' ? [...rawRouteStops].reverse() : rawRouteStops;

        const currentStopData = routeStops[trip.current_stop_index];
        const targetIndex = routeStops.findIndex(rs => rs.stop_id === targetStopId);
        const targetStopData = targetIndex >= 0 ? routeStops[targetIndex] : null;

        if (!currentStopData || !targetStopData) return null;

        if (targetIndex <= trip.current_stop_index) {
            return { eta_minutes: 0, message: 'Bus has already passed this stop' };
        }

        // Base time from route schedule using absolute time differences
        const baseTime = Math.abs(targetStopData.avg_time_from_start_min - currentStopData.avg_time_from_start_min);

        // Apply traffic factor based on time of day
        const trafficFactor = this.getTrafficFactor();

        // Apply delay factor
        const delayFactor = (trip.delay_minutes > 0 && baseTime > 0) ? 1 + (trip.delay_minutes / baseTime) * 0.3 : 1;

        // Calculate adjusted ETA
        const adjustedETA = Math.max(1, Math.round(baseTime * trafficFactor * delayFactor));

        // Calculate arrival time
        const arrivalTime = new Date(Date.now() + adjustedETA * 60 * 1000);

        return {
            eta_minutes: adjustedETA,
            arrival_time: arrivalTime.toISOString(),
            base_time: baseTime,
            traffic_factor: trafficFactor,
            delay_minutes: trip.delay_minutes,
            stops_remaining: targetIndex - trip.current_stop_index,
            distance_remaining_km: Math.round(Math.abs(targetStopData.distance_from_start_km - currentStopData.distance_from_start_km) * 10) / 10
        };
    }

    /**
     * Calculate ETAs for all upcoming stops on a trip
     */
    static calculateAllETAs(tripId) {
        const db = getDb();
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
        if (!trip) return [];

        const rawRouteStops = db.prepare(`
            SELECT rs.*, s.name as stop_name, s.latitude, s.longitude
            FROM route_stops rs
            JOIN stops s ON rs.stop_id = s.id
            WHERE rs.route_id = ?
            ORDER BY rs.sequence_order
        `).all(trip.route_id);

        // Direction-aware ordering
        const routeStops = trip.direction === 'inbound' ? [...rawRouteStops].reverse() : rawRouteStops;

        const etas = [];
        for (let i = trip.current_stop_index + 1; i < routeStops.length; i++) {
            const stop = routeStops[i];
            const eta = this.calculateETA(tripId, stop.stop_id);
            if (eta) {
                etas.push({
                    stop_id: stop.stop_id,
                    stop_name: stop.stop_name,
                    sequence_order: stop.sequence_order,
                    ...eta
                });
            }
        }

        return etas;
    }

    /**
     * Detect delays for a trip
     */
    static detectDelay(tripId) {
        const db = getDb();
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
        if (!trip || trip.status !== 'active') return null;

        const rawRouteStops = db.prepare(`
            SELECT rs.*, s.name as stop_name
            FROM route_stops rs
            JOIN stops s ON rs.stop_id = s.id
            WHERE rs.route_id = ?
            ORDER BY rs.sequence_order
        `).all(trip.route_id);

        // Direction-aware ordering
        const routeStops = trip.direction === 'inbound' ? [...rawRouteStops].reverse() : rawRouteStops;

        const currentStop = routeStops[trip.current_stop_index];
        if (!currentStop) return null;

        // Calculate expected time at current stop
        // For inbound trips, compute elapsed time as the time from the inbound start to this stop
        const tripStart = new Date(trip.actual_start || trip.scheduled_start);
        const totalRouteTime = rawRouteStops[rawRouteStops.length - 1].avg_time_from_start_min;
        let expectedMinutesAtCurrentStop;
        if (trip.direction === 'inbound') {
            expectedMinutesAtCurrentStop = Math.abs(totalRouteTime - currentStop.avg_time_from_start_min);
        } else {
            expectedMinutesAtCurrentStop = currentStop.avg_time_from_start_min;
        }
        const expectedTimeAtCurrentStop = new Date(tripStart.getTime() + expectedMinutesAtCurrentStop * 60 * 1000);
        const actualTime = new Date();

        const delayMinutes = Math.max(0, Math.round((actualTime - expectedTimeAtCurrentStop) / (1000 * 60)));

        // Update delay in trip
        if (delayMinutes !== trip.delay_minutes) {
            db.prepare('UPDATE trips SET delay_minutes = ? WHERE id = ?').run(delayMinutes, tripId);
        }

        return {
            delay_minutes: delayMinutes,
            is_delayed: delayMinutes > 3,
            severity: delayMinutes > 15 ? 'high' : (delayMinutes > 5 ? 'medium' : 'low'),
            current_stop: currentStop.stop_name,
            expected_time: expectedTimeAtCurrentStop.toISOString(),
            actual_time: actualTime.toISOString()
        };
    }

    /**
     * Get travel time estimate between two stops for a specific route
     */
    static getTravelTime(routeId, fromStopId, toStopId) {
        const db = getDb();
        const fromStop = db.prepare('SELECT * FROM route_stops WHERE route_id = ? AND stop_id = ?').get(routeId, fromStopId);
        const toStop = db.prepare('SELECT * FROM route_stops WHERE route_id = ? AND stop_id = ?').get(routeId, toStopId);

        if (!fromStop || !toStop) return null;

        const baseTime = Math.abs(toStop.avg_time_from_start_min - fromStop.avg_time_from_start_min);
        const distance = Math.abs(toStop.distance_from_start_km - fromStop.distance_from_start_km);
        const trafficFactor = this.getTrafficFactor();

        return {
            base_time_minutes: baseTime,
            adjusted_time_minutes: Math.round(baseTime * trafficFactor),
            distance_km: Math.round(distance * 10) / 10,
            traffic_condition: this.getTrafficCondition()
        };
    }

    /**
     * Get traffic factor based on current time of day
     */
    static getTrafficFactor() {
        const hour = new Date().getHours();

        // Peak hours: 7-9 AM, 5-7 PM
        if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
            return 1.4 + Math.random() * 0.2; // 1.4x - 1.6x
        }
        // Moderate: 9-11 AM, 3-5 PM
        if ((hour >= 9 && hour <= 11) || (hour >= 15 && hour <= 17)) {
            return 1.15 + Math.random() * 0.15; // 1.15x - 1.3x
        }
        // Light traffic: late night / early morning
        if (hour >= 22 || hour <= 5) {
            return 0.85 + Math.random() * 0.1; // 0.85x - 0.95x
        }
        // Normal
        return 1.0 + Math.random() * 0.1; // 1.0x - 1.1x
    }

    /**
     * Get human-readable traffic condition
     */
    static getTrafficCondition() {
        const hour = new Date().getHours();
        if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) return 'heavy';
        if ((hour >= 9 && hour <= 11) || (hour >= 15 && hour <= 17)) return 'moderate';
        if (hour >= 22 || hour <= 5) return 'light';
        return 'normal';
    }
}

module.exports = ETAEngine;
