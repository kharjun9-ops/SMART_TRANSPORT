const { getDb } = require('../db/database');

class ETAEngine {
    /**
     * Calculate continuous, sub-segment synchronized ETA for a trip to reach a specific stop
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

        if (!rawRouteStops || rawRouteStops.length === 0) return null;

        // Direction-aware ordering (must match simulation engine)
        const routeStops = trip.direction === 'inbound' ? [...rawRouteStops].reverse() : rawRouteStops;

        const currentIndex = trip.current_stop_index || 0;
        const currentStopData = routeStops[currentIndex];
        const targetIndex = routeStops.findIndex(rs => rs.stop_id === targetStopId);
        const targetStopData = targetIndex >= 0 ? routeStops[targetIndex] : null;

        if (!currentStopData || !targetStopData) return null;

        const p = Math.max(0.0, Math.min(1.0, trip.segment_progress !== undefined ? trip.segment_progress : 0.0));
        const state = trip.state || 'in_transit';

        // Check if bus is at or past the stop
        if (targetIndex < currentIndex) {
            return {
                eta_minutes: 0,
                eta_seconds: 0,
                display_text: 'Passed',
                status: 'passed',
                message: 'Bus has already passed this stop',
                is_passed: true,
                is_at_stop: false,
                is_approaching: false
            };
        }

        if (targetIndex === currentIndex) {
            if (state === 'at_stop') {
                return {
                    eta_minutes: 0,
                    eta_seconds: 0,
                    display_text: 'At Stop',
                    status: 'at_stop',
                    message: 'Bus is at this stop now (Boarding/Deboarding)',
                    arrival_time: new Date().toISOString(),
                    is_passed: false,
                    is_at_stop: true,
                    is_approaching: true,
                    stops_remaining: 0,
                    distance_remaining_km: 0
                };
            } else {
                return {
                    eta_minutes: 0,
                    eta_seconds: 0,
                    display_text: 'Departed',
                    status: 'passed',
                    message: 'Bus just departed this stop',
                    is_passed: true,
                    is_at_stop: false,
                    is_approaching: false
                };
            }
        }

        // Target stop is ahead in the sequence (targetIndex > currentIndex)
        const nextStopData = routeStops[currentIndex + 1];
        if (!nextStopData) return null;

        // Scheduled segment duration and distance for current leg (currentIndex -> currentIndex + 1)
        const currSegmentTime = Math.max(1.5, Math.abs(
            (nextStopData.avg_time_from_start_min || 0) - (currentStopData.avg_time_from_start_min || 0)
        ));
        const currSegmentDist = Math.max(0.5, Math.abs(
            (nextStopData.distance_from_start_km || 0) - (currentStopData.distance_from_start_km || 0)
        ));

        // Calculate remaining time and distance to immediate next stop
        let remainingTimeToNext;
        let remainingDistToNext;

        if (state === 'at_stop') {
            const dwellMin = (trip.dwell_seconds || 5) / 60;
            remainingTimeToNext = currSegmentTime + dwellMin;
            remainingDistToNext = currSegmentDist;
        } else {
            // In transit: fractional remaining progress
            const remainingFraction = Math.max(0.05, 1.0 - p);
            remainingTimeToNext = remainingFraction * currSegmentTime;
            remainingDistToNext = remainingFraction * currSegmentDist;
        }

        // Compute total base travel time from current live position to target stop
        let baseTime;
        let distanceRemainingKm;

        if (targetIndex === currentIndex + 1) {
            baseTime = Math.max(0.2, remainingTimeToNext);
            distanceRemainingKm = Math.max(0.1, remainingDistToNext);
        } else {
            const downstreamTime = Math.abs(
                (targetStopData.avg_time_from_start_min || 0) - (nextStopData.avg_time_from_start_min || 0)
            );
            const downstreamDist = Math.abs(
                (targetStopData.distance_from_start_km || 0) - (nextStopData.distance_from_start_km || 0)
            );
            baseTime = remainingTimeToNext + downstreamTime;
            distanceRemainingKm = remainingDistToNext + downstreamDist;
        }

        // Apply traffic factor based on time of day
        const trafficFactor = this.getTrafficFactor();

        // Apply delay factor
        const delayFactor = (trip.delay_minutes > 0 && baseTime > 0)
            ? 1 + (trip.delay_minutes / baseTime) * 0.25
            : 1;

        // Calculate adjusted ETA in minutes and exact seconds
        const adjustedMinutes = baseTime * trafficFactor * delayFactor;
        const etaSeconds = Math.max(10, Math.round(adjustedMinutes * 60));
        const etaMinutes = Math.max(1, Math.round(adjustedMinutes));

        // Format user-friendly display text
        let displayText;
        if (adjustedMinutes < 0.6) {
            displayText = 'Arriving now';
        } else if (adjustedMinutes < 1.2) {
            displayText = '< 1 min';
        } else {
            displayText = `${etaMinutes} mins`;
        }

        const arrivalTime = new Date(Date.now() + etaSeconds * 1000);

        return {
            eta_minutes: etaMinutes,
            eta_seconds: etaSeconds,
            display_text: displayText,
            arrival_time: arrivalTime.toISOString(),
            base_time: Math.round(baseTime * 10) / 10,
            traffic_factor: Math.round(trafficFactor * 100) / 100,
            delay_minutes: trip.delay_minutes || 0,
            stops_remaining: targetIndex - currentIndex,
            distance_remaining_km: Math.round(distanceRemainingKm * 10) / 10,
            is_approaching: adjustedMinutes <= 2.2,
            is_at_stop: false,
            status: 'upcoming'
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
            SELECT rs.*, s.name as stop_name, s.latitude, s.longitude, s.is_major
            FROM route_stops rs
            JOIN stops s ON rs.stop_id = s.id
            WHERE rs.route_id = ?
            ORDER BY rs.sequence_order
        `).all(trip.route_id);

        if (!rawRouteStops || rawRouteStops.length === 0) return [];

        // Direction-aware ordering
        const routeStops = trip.direction === 'inbound' ? [...rawRouteStops].reverse() : rawRouteStops;

        const etas = [];
        for (let i = trip.current_stop_index; i < routeStops.length; i++) {
            const stop = routeStops[i];
            const eta = this.calculateETA(tripId, stop.stop_id);
            if (eta) {
                etas.push({
                    stop_id: stop.stop_id,
                    stop_name: stop.stop_name,
                    sequence_order: stop.sequence_order,
                    is_major: !!stop.is_major,
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

        const routeStops = trip.direction === 'inbound' ? [...rawRouteStops].reverse() : rawRouteStops;
        const currentStop = routeStops[trip.current_stop_index];
        if (!currentStop) return null;

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
            return 1.35 + Math.random() * 0.15; // 1.35x - 1.5x
        }
        // Moderate: 9-11 AM, 3-5 PM
        if ((hour >= 9 && hour <= 11) || (hour >= 15 && hour <= 17)) {
            return 1.15 + Math.random() * 0.1; // 1.15x - 1.25x
        }
        // Light traffic: late night / early morning
        if (hour >= 22 || hour <= 5) {
            return 0.9 + Math.random() * 0.08; // 0.9x - 0.98x
        }
        // Normal
        return 1.0 + Math.random() * 0.08; // 1.0x - 1.08x
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
