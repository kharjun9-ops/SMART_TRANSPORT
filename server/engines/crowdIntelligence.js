const { getDb } = require('../db/database');
const ETAEngine = require('./eta');
const { v4: uuidv4 } = require('uuid');

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

        // If user was on the stop waiting list, mark as boarded
        if (userId && stopId) {
            db.prepare("UPDATE stop_waiting_list SET status = 'boarded' WHERE user_id = ? AND stop_id = ? AND status = 'waiting'")
                .run(userId, stopId);
        }

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
     * Join stop waiting list
     */
    static joinWaitingList(userId, stopId, routeId, tripId = null, destinationStopId = null) {
        const db = getDb();
        
        // Remove previous waiting status at same stop/route for user
        db.prepare("UPDATE stop_waiting_list SET status = 'cancelled' WHERE user_id = ? AND stop_id = ? AND status = 'waiting'")
            .run(userId, stopId);

        const waitlistId = 'wait_' + uuidv4().substring(0, 8);
        db.prepare(`
            INSERT INTO stop_waiting_list (id, user_id, stop_id, route_id, trip_id, destination_stop_id, status)
            VALUES (?, ?, ?, ?, ?, ?, 'waiting')
        `).run(waitlistId, userId, stopId, routeId, tripId || null, destinationStopId || null);

        return {
            id: waitlistId,
            user_id: userId,
            stop_id: stopId,
            route_id: routeId,
            trip_id: tripId || null,
            destination_stop_id: destinationStopId || null,
            status: 'waiting',
            message: 'Joined stop waiting list successfully'
        };
    }

    /**
     * Leave stop waiting list
     */
    static leaveWaitingList(userId, stopId, tripId = null) {
        const db = getDb();
        if (stopId) {
            db.prepare("UPDATE stop_waiting_list SET status = 'cancelled' WHERE user_id = ? AND stop_id = ? AND status = 'waiting'")
                .run(userId, stopId);
        } else {
            db.prepare("UPDATE stop_waiting_list SET status = 'cancelled' WHERE user_id = ? AND status = 'waiting'")
                .run(userId);
        }
        return { success: true };
    }

    /**
     * Get active waiting list at a stop
     */
    static getStopWaitlist(stopId, routeId = null) {
        const db = getDb();
        let waiting = [];
        if (routeId) {
            waiting = db.prepare("SELECT * FROM stop_waiting_list WHERE stop_id = ? AND route_id = ? AND status = 'waiting'")
                .all(stopId, routeId);
        } else {
            waiting = db.prepare("SELECT * FROM stop_waiting_list WHERE stop_id = ? AND status = 'waiting'")
                .all(stopId);
        }
        return waiting;
    }

    /**
     * Get user's active waitlists
     */
    static getUserActiveWaitlists(userId) {
        const db = getDb();
        return db.prepare("SELECT * FROM stop_waiting_list WHERE user_id = ? AND status = 'waiting'").all(userId);
    }

    /**
     * Multi-Stop Crowd & Waitlist Forecaster
     * Calculates:
     * 1. Next Stop: Waiting passengers queue + wait time + expected boarding/deboarding
     * 2. Next-Next Stop: Propagated crowd level, remaining seats, and boarding probability for waiting commuters
     */
    static calculateMultiStopCrowdForecast(tripId) {
        const db = getDb();
        const trip = db.prepare(`
            SELECT t.*, b.capacity, b.bus_number, b.current_speed_kmh, r.name as route_name, r.route_number
            FROM trips t
            JOIN buses b ON t.bus_id = b.id
            JOIN routes r ON t.route_id = r.id
            WHERE t.id = ?
        `).get(tripId);

        if (!trip) return null;

        const capacity = trip.capacity || 50;
        const currentPassengers = trip.current_passenger_count || 0;
        const currentIndex = trip.current_stop_index || 0;

        const rawRouteStops = db.prepare(`
            SELECT rs.*, s.name as stop_name, s.latitude, s.longitude, s.is_major
            FROM route_stops rs
            JOIN stops s ON rs.stop_id = s.id
            WHERE rs.route_id = ?
            ORDER BY rs.sequence_order
        `).all(trip.route_id);

        const routeStops = trip.direction === 'inbound' ? [...rawRouteStops].reverse() : rawRouteStops;

        if (!routeStops || routeStops.length === 0) return null;

        const currentStop = routeStops[currentIndex] || routeStops[0];
        const nextStop = currentIndex + 1 < routeStops.length ? routeStops[currentIndex + 1] : null;
        const nextNextStop = currentIndex + 2 < routeStops.length ? routeStops[currentIndex + 2] : null;

        // --- 1. NEXT STOP CALCULATIONS ---
        let nextStopForecast = null;
        let busPassengersDepartingNext = currentPassengers;

        if (nextStop) {
            const nextEta = ETAEngine.calculateETA(tripId, nextStop.stop_id);
            const waitlistUsers = this.getStopWaitlist(nextStop.stop_id, trip.route_id);
            
            // Base simulated queue for realism + live active waitlist users
            const baseQueue = nextStop.is_major ? 4 : 2;
            const waitingCount = baseQueue + waitlistUsers.length;
            
            // Deboarding calculation at next stop (major stops have higher deboard)
            const deboardRate = nextStop.is_major ? 0.22 : 0.12;
            const expectedDeboarding = Math.min(currentPassengers, Math.max(1, Math.round(currentPassengers * deboardRate)));
            
            // Available space before boarding
            const spaceAvailable = Math.max(0, capacity - (currentPassengers - expectedDeboarding));
            const expectedBoarding = Math.min(spaceAvailable, waitingCount);

            busPassengersDepartingNext = Math.max(0, Math.min(capacity, currentPassengers - expectedDeboarding + expectedBoarding));
            const remainingSeatsAfterNext = Math.max(0, capacity - busPassengersDepartingNext);
            const nextOccupancyPercent = Math.round((busPassengersDepartingNext / capacity) * 100);

            nextStopForecast = {
                stop_id: nextStop.stop_id,
                stop_name: nextStop.stop_name,
                sequence_order: nextStop.sequence_order,
                is_major: !!nextStop.is_major,
                wait_time_minutes: nextEta ? nextEta.eta_minutes : 1,
                eta_seconds: nextEta ? nextEta.eta_seconds : 60,
                display_text: nextEta ? nextEta.display_text : '1 min',
                is_approaching: nextEta ? nextEta.is_approaching : false,
                is_at_stop: nextEta ? nextEta.is_at_stop : (state.state === 'at_stop' && currentIndex === nextStop.sequence_order - 1),
                arrival_time: nextEta ? nextEta.arrival_time : new Date(Date.now() + 60000).toISOString(),
                waiting_passengers_count: waitingCount,
                live_registered_waiters: waitlistUsers.length,
                expected_deboarding: expectedDeboarding,
                expected_boarding: expectedBoarding,
                bus_occupancy_after_departure: nextOccupancyPercent,
                seats_remaining_after_departure: remainingSeatsAfterNext,
                crowd_level_after_departure: this.percentageToLevel(busPassengersDepartingNext / capacity)
            };
        }

        // --- 2. NEXT-NEXT STOP CALCULATIONS ---
        let nextNextStopForecast = null;

        if (nextNextStop) {
            const nextNextEta = ETAEngine.calculateETA(tripId, nextNextStop.stop_id);
            const waitlistUsersNextNext = this.getStopWaitlist(nextNextStop.stop_id, trip.route_id);
            
            const baseQueueNextNext = nextNextStop.is_major ? 6 : 3;
            const waitingCountNextNext = baseQueueNextNext + waitlistUsersNextNext.length;

            // Expected deboarding when bus arrives at Next-Next stop
            const deboardRateNextNext = nextNextStop.is_major ? 0.25 : 0.15;
            const expectedDeboardingNextNext = Math.min(busPassengersDepartingNext, Math.max(1, Math.round(busPassengersDepartingNext * deboardRateNextNext)));
            
            // Available capacity for commuters waiting at Next-Next stop
            const seatsLeftBeforeDeboard = Math.max(0, capacity - busPassengersDepartingNext);
            const availableSlotsOnArrival = seatsLeftBeforeDeboard + expectedDeboardingNextNext;

            // Boarding probability score for commuters waiting at next-next stop (0 to 100%)
            let boardingProbability = Math.min(100, Math.round((availableSlotsOnArrival / Math.max(1, waitingCountNextNext)) * 100));
            boardingProbability = Math.max(10, boardingProbability);

            const arrivalPassengers = busPassengersDepartingNext;
            const arrivalOccupancyPercent = Math.round((arrivalPassengers / capacity) * 100);
            const arrivalCrowdLevel = this.percentageToLevel(arrivalPassengers / capacity);

            // Verdict and smart recommendation
            let verdict = 'Optimal Boarding';
            let verdictLevel = 'optimal';
            let advice = `Great boarding conditions! Approximately ${availableSlotsOnArrival} seats/standing slots will be available when bus arrives.`;

            if (boardingProbability >= 85) {
                verdict = 'Seats Guaranteed';
                verdictLevel = 'optimal';
                advice = `High chance of finding a seat (~${availableSlotsOnArrival} available slots).`;
            } else if (boardingProbability >= 50) {
                verdict = 'Standing Room Likely';
                verdictLevel = 'moderate';
                advice = `Moderate crowd expected. Standing room available (~${availableSlotsOnArrival} available slots for ${waitingCountNextNext} waiting commuters).`;
            } else {
                verdict = 'High Overcrowding Alert';
                verdictLevel = 'critical';
                advice = `Bus will be heavily crowded (${arrivalOccupancyPercent}% full) after departures from ${nextStop ? nextStop.stop_name : 'previous stop'}. Consider the next scheduled bus for a comfortable ride.`;
            }

            nextNextStopForecast = {
                stop_id: nextNextStop.stop_id,
                stop_name: nextNextStop.stop_name,
                sequence_order: nextNextStop.sequence_order,
                is_major: !!nextNextStop.is_major,
                wait_time_minutes: nextNextEta ? nextNextEta.eta_minutes : 6,
                eta_seconds: nextNextEta ? nextNextEta.eta_seconds : 360,
                display_text: nextNextEta ? nextNextEta.display_text : '6 mins',
                arrival_time: nextNextEta ? nextNextEta.arrival_time : new Date(Date.now() + 6 * 60000).toISOString(),
                waiting_passengers_count: waitingCountNextNext,
                live_registered_waiters: waitlistUsersNextNext.length,
                expected_deboarding_on_arrival: expectedDeboardingNextNext,
                available_slots_on_arrival: availableSlotsOnArrival,
                anticipated_bus_occupancy_on_arrival: arrivalOccupancyPercent,
                anticipated_crowd_level: arrivalCrowdLevel,
                boarding_probability_percentage: boardingProbability,
                verdict: verdict,
                verdict_level: verdictLevel,
                commuter_advice: advice
            };
        }

        // --- 3. FULL MULTI-STOP DOWNSTREAM TIMELINE ---
        let runningPassengerLoad = currentPassengers;
        const timeline = [];

        for (let i = currentIndex; i < routeStops.length; i++) {
            const stop = routeStops[i];
            const eta = i === currentIndex ? { eta_minutes: 0 } : ETAEngine.calculateETA(tripId, stop.stop_id);
            const waitlist = this.getStopWaitlist(stop.stop_id, trip.route_id);
            const baseWaiting = stop.is_major ? 4 : 2;
            const waitingCount = Math.max(waitlist.length, baseWaiting);

            let deboard = 0;
            let board = 0;

            if (i > currentIndex) {
                const deboardRate = stop.is_major ? 0.20 : 0.12;
                deboard = Math.min(runningPassengerLoad, Math.max(1, Math.round(runningPassengerLoad * deboardRate)));
                const space = Math.max(0, capacity - (runningPassengerLoad - deboard));
                board = Math.min(space, waitingCount);
                runningPassengerLoad = Math.max(0, Math.min(capacity, runningPassengerLoad - deboard + board));
            }

            const occupancyPercent = Math.round((runningPassengerLoad / capacity) * 100);

            timeline.push({
                stop_id: stop.stop_id,
                stop_name: stop.stop_name,
                sequence_order: stop.sequence_order,
                is_current: i === currentIndex,
                is_next: i === currentIndex + 1,
                is_next_next: i === currentIndex + 2,
                is_major: !!stop.is_major,
                eta_minutes: eta ? eta.eta_minutes : 0,
                waiting_count: waitingCount,
                projected_occupancy_percentage: occupancyPercent,
                projected_crowd_level: this.percentageToLevel(runningPassengerLoad / capacity),
                seats_free: Math.max(0, capacity - runningPassengerLoad)
            });
        }

        return {
            trip_id: tripId,
            route_name: trip.route_name,
            route_number: trip.route_number,
            bus_number: trip.bus_number,
            bus_capacity: capacity,
            current_passengers: currentPassengers,
            current_stop: {
                stop_id: currentStop.stop_id,
                stop_name: currentStop.name || currentStop.stop_name,
                sequence_order: currentStop.sequence_order
            },
            next_stop_forecast: nextStopForecast,
            next_next_stop_forecast: nextNextStopForecast,
            downstream_timeline: timeline,
            generated_at: new Date().toISOString()
        };
    }

    /**
     * Get crowd estimate for a specific trip at a specific stop
     */
    static getCrowdEstimate(tripId, stopId) {
        const db = getDb();

        const estimate = db.prepare('SELECT * FROM crowd_estimates WHERE trip_id = ? AND stop_id = ?').get(tripId, stopId);
        if (estimate) return estimate;

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
            confidence: 0.3,
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
        const rawRouteStops = db.prepare(`
            SELECT rs.*, s.name as stop_name 
            FROM route_stops rs 
            JOIN stops s ON rs.stop_id = s.id 
            WHERE rs.route_id = ? 
            ORDER BY rs.sequence_order
        `).all(trip.route_id);

        // Direction-aware ordering (must match simulation engine)
        const routeStops = trip.direction === 'inbound' ? [...rawRouteStops].reverse() : rawRouteStops;

        const currentIndex = trip.current_stop_index;
        const targetIndex = routeStops.findIndex(rs => rs.stop_id === targetStopId);
        const targetStop = targetIndex >= 0 ? routeStops[targetIndex] : null;
        if (!targetStop) return null;

        let predictedCount = trip.current_passenger_count;

        for (let i = currentIndex + 1; i <= targetIndex; i++) {
            const stop = routeStops[i];
            const isMajorStop = db.prepare('SELECT is_major FROM stops WHERE id = ?').get(stop.stop_id);

            if (isMajorStop && isMajorStop.is_major) {
                if (trip.direction === 'outbound') {
                    predictedCount += Math.floor(Math.random() * 5) - 2;
                } else {
                    predictedCount += Math.floor(Math.random() * 5) - 1;
                }
            } else {
                predictedCount += Math.floor(Math.random() * 3) - 1;
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
