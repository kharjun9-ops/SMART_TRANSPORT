const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const ETAEngine = require('../engines/eta');
const CrowdIntelligenceEngine = require('../engines/crowdIntelligence');
const GamificationEngine = require('../engines/gamification');
const NotificationEngine = require('../engines/notifications');

const router = express.Router();

// GET /api/trips/active - Get all active trips
router.get('/active', (req, res) => {
    const db = getDb();

    const trips = db.prepare(`
        SELECT t.*, b.bus_number, b.capacity, b.current_latitude, b.current_longitude,
               b.current_speed_kmh, r.name as route_name, r.route_number, r.color as route_color
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        WHERE t.status = 'active'
        ORDER BY r.route_number, t.scheduled_start
    `).all();

    const enrichedTrips = trips.map(trip => {
        const percentage = trip.capacity > 0 ? trip.current_passenger_count / trip.capacity : 0;

        // Get current stop name
        const currentStop = db.prepare(`
            SELECT s.name FROM route_stops rs
            JOIN stops s ON rs.stop_id = s.id
            WHERE rs.route_id = ? AND rs.sequence_order = ?
        `).get(trip.route_id, trip.current_stop_index);

        // Get multi-stop forecast summary
        const forecast = CrowdIntelligenceEngine.calculateMultiStopCrowdForecast(trip.id);

        return {
            ...trip,
            crowd_level: percentage <= 0.4 ? 'low' : (percentage <= 0.7 ? 'medium' : 'high'),
            crowd_percentage: Math.round(percentage * 100),
            current_stop_name: currentStop ? currentStop.name : 'Starting',
            next_stop_forecast: forecast ? forecast.next_stop_forecast : null,
            next_next_stop_forecast: forecast ? forecast.next_next_stop_forecast : null
        };
    });

    res.json({ trips: enrichedTrips });
});

// POST /api/trips/waitlist/join - Join stop waiting list
router.post('/waitlist/join', authenticateToken, (req, res) => {
    try {
        const { stopId, routeId, tripId, destinationStopId, latitude, longitude, isDemo } = req.body;
        const userId = req.user.id;

        if (!stopId || !routeId) {
            return res.status(400).json({ error: 'stopId and routeId are required' });
        }

        const result = CrowdIntelligenceEngine.joinWaitingList(userId, stopId, routeId, tripId, destinationStopId);

        // Verification check for waitlist registration
        const verification = VerificationEngine.verifyUpdate({
            id: result.id,
            user_id: userId,
            trip_id: tripId || null,
            stop_id: stopId,
            update_type: 'waitlist_join',
            latitude: latitude || null,
            longitude: longitude || null,
            is_demo: !!isDemo,
            timestamp: new Date().toISOString()
        });

        // Award points only if verified
        const pointsResult = GamificationEngine.awardPoints(userId, 'waitlist_join', result.id, verification);

        if (pointsResult && pointsResult.points > 0) {
            NotificationEngine.sendPointsEarned(userId, pointsResult.points, 'verified stop waitlist registration');
        }

        // Recalculate forecast for the trip if provided
        let forecast = null;
        if (tripId) {
            forecast = CrowdIntelligenceEngine.calculateMultiStopCrowdForecast(tripId);
        }

        res.json({
            message: pointsResult.message || 'Added to stop waitlist queue',
            waitlist: result,
            forecast,
            points: pointsResult.points,
            verification: {
                status: verification.status,
                confidence: verification.confidenceScore,
                distanceToStopMeters: verification.distanceToStopMeters,
                isVerified: verification.isVerified
            }
        });
    } catch (err) {
        console.error('Join waitlist error:', err);
        res.status(500).json({ error: 'Failed to join stop waitlist' });
    }
});

// POST /api/trips/waitlist/leave - Leave stop waiting list
router.post('/waitlist/leave', authenticateToken, (req, res) => {
    try {
        const { stopId, tripId } = req.body;
        const userId = req.user.id;

        CrowdIntelligenceEngine.leaveWaitingList(userId, stopId, tripId);
        res.json({ message: 'Removed from stop waiting list' });
    } catch (err) {
        console.error('Leave waitlist error:', err);
        res.status(500).json({ error: 'Failed to leave stop waitlist' });
    }
});

// GET /api/trips/waitlist/my - Get user's active waitlists
router.get('/waitlist/my', authenticateToken, (req, res) => {
    try {
        const waitlists = CrowdIntelligenceEngine.getUserActiveWaitlists(req.user.id);
        res.json({ waitlists });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch waitlists' });
    }
});

// GET /api/trips/:id/waitlist-forecast - Get comprehensive multi-stop crowd & waitlist forecast
router.get('/:id/waitlist-forecast', (req, res) => {
    try {
        const forecast = CrowdIntelligenceEngine.calculateMultiStopCrowdForecast(req.params.id);
        if (!forecast) {
            return res.status(404).json({ error: 'Trip forecast not found' });
        }
        res.json({ forecast });
    } catch (err) {
        console.error('Forecast error:', err);
        res.status(500).json({ error: 'Failed to calculate crowd forecast' });
    }
});

// GET /api/trips/:id - Get trip details with multi-stop crowd calculations
router.get('/:id', (req, res) => {
    const db = getDb();

    const trip = db.prepare(`
        SELECT t.*, b.bus_number, b.capacity, b.current_latitude, b.current_longitude,
               b.current_speed_kmh, b.driver_name,
               r.name as route_name, r.route_number, r.color as route_color, r.fare_lkr
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        WHERE t.id = ?
    `).get(req.params.id);

    if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
    }

    // Get route stops with ETAs
    const routeStops = db.prepare(`
        SELECT rs.*, s.name as stop_name, s.latitude, s.longitude, s.is_major
        FROM route_stops rs
        JOIN stops s ON rs.stop_id = s.id
        WHERE rs.route_id = ?
        ORDER BY rs.sequence_order
    `).all(trip.route_id);

    const percentage = trip.capacity > 0 ? trip.current_passenger_count / trip.capacity : 0;

    // Calculate multi-stop downstream crowd & waitlist forecast
    const multiStopForecast = CrowdIntelligenceEngine.calculateMultiStopCrowdForecast(trip.id);

    // Calculate ETAs for upcoming stops
    const stopsWithETAs = routeStops.map((stop, index) => {
        let eta = null;
        let crowdPrediction = null;

        if (index > trip.current_stop_index) {
            eta = ETAEngine.calculateETA(trip.id, stop.stop_id);
            crowdPrediction = CrowdIntelligenceEngine.predictCrowdAtStop(trip.id, stop.stop_id);
        }

        const waitlist = CrowdIntelligenceEngine.getStopWaitlist(stop.stop_id, trip.route_id);

        return {
            ...stop,
            is_current: index === trip.current_stop_index,
            is_passed: index < trip.current_stop_index,
            is_upcoming: index > trip.current_stop_index,
            eta,
            crowd_prediction: crowdPrediction,
            waiting_passengers: waitlist.length
        };
    });

    res.json({
        trip: {
            ...trip,
            crowd_level: percentage <= 0.4 ? 'low' : (percentage <= 0.7 ? 'medium' : 'high'),
            crowd_percentage: Math.round(percentage * 100),
            stops: stopsWithETAs,
            forecast: multiStopForecast
        }
    });
});

// GET /api/trips/:id/track - Real-time tracking data with live waitlist & next-next crowd telemetry
router.get('/:id/track', (req, res) => {
    const db = getDb();

    const trip = db.prepare(`
        SELECT t.*, b.current_latitude, b.current_longitude, b.current_speed_kmh,
               b.capacity, r.name as route_name, r.route_number
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        WHERE t.id = ?
    `).get(req.params.id);

    if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
    }

    const percentage = trip.capacity > 0 ? trip.current_passenger_count / trip.capacity : 0;

    // Get current stop
    const currentStop = db.prepare(`
        SELECT s.* FROM route_stops rs
        JOIN stops s ON rs.stop_id = s.id
        WHERE rs.route_id = ? AND rs.sequence_order = ?
    `).get(trip.route_id, trip.current_stop_index);

    // Get delay info
    const delay = ETAEngine.detectDelay(trip.id);

    // Multi-stop crowd forecast
    const forecast = CrowdIntelligenceEngine.calculateMultiStopCrowdForecast(trip.id);

    res.json({
        tracking: {
            trip_id: trip.id,
            latitude: trip.current_latitude,
            longitude: trip.current_longitude,
            speed_kmh: trip.current_speed_kmh,
            current_stop_index: trip.current_stop_index,
            current_stop: currentStop,
            passenger_count: trip.current_passenger_count,
            crowd_level: percentage <= 0.4 ? 'low' : (percentage <= 0.7 ? 'medium' : 'high'),
            crowd_percentage: Math.round(percentage * 100),
            delay: delay,
            status: trip.status,
            forecast: forecast
        }
    });
});

// GET /api/stops - Get all stops
router.get('/stops/all', (req, res) => {
    const db = getDb();
    const stops = db.prepare('SELECT * FROM stops ORDER BY name').all();
    res.json({ stops });
});

// GET /api/stops/nearby - Get nearby stops
router.get('/stops/nearby', (req, res) => {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({ error: 'lat and lng are required' });
    }

    const db = getDb();
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = parseFloat(radius) || 2; // km

    const allStops = db.prepare('SELECT * FROM stops').all();

    const nearbyStops = allStops
        .map(stop => {
            const distance = Math.sqrt(
                Math.pow((stop.latitude - userLat) * 111.32, 2) +
                Math.pow((stop.longitude - userLng) * 111.32 * Math.cos(userLat * Math.PI / 180), 2)
            );
            return { ...stop, distance_km: Math.round(distance * 100) / 100 };
        })
        .filter(stop => stop.distance_km <= searchRadius)
        .sort((a, b) => a.distance_km - b.distance_km);

    // Enrich with route info
    const enrichedStops = nearbyStops.map(stop => {
        const routes = db.prepare(`
            SELECT DISTINCT r.id, r.name, r.route_number, r.color
            FROM route_stops rs
            JOIN routes r ON rs.route_id = r.id
            WHERE rs.stop_id = ? AND r.status = 'active'
        `).all(stop.id);

        return { ...stop, routes };
    });

    res.json({ stops: enrichedStops });
});

module.exports = router;
