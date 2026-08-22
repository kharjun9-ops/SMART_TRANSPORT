const express = require('express');
const { getDb } = require('../db/database');
const { optionalAuth } = require('../middleware/auth');
const CrowdIntelligenceEngine = require('../engines/crowdIntelligence');
const ETAEngine = require('../engines/eta');

const router = express.Router();

// GET /api/routes - List all routes
router.get('/', (req, res) => {
    const db = getDb();
    const routes = db.prepare(`
        SELECT r.*, 
            (SELECT COUNT(*) FROM trips t WHERE t.route_id = r.id AND t.status = 'active') as active_trips
        FROM routes r
        WHERE r.status = 'active'
        ORDER BY r.route_number
    `).all();

    res.json({ routes });
});

// GET /api/routes/search - Search routes by source/destination
router.get('/search', (req, res) => {
    const { from, to, fromLat, fromLng } = req.query;
    const db = getDb();

    let matchedRoutes = [];

    if (from && to) {
        // Text-based search
        matchedRoutes = db.prepare(`
            SELECT DISTINCT r.* FROM routes r
            JOIN route_stops rs1 ON r.id = rs1.route_id
            JOIN stops s1 ON rs1.stop_id = s1.id
            JOIN route_stops rs2 ON r.id = rs2.route_id
            JOIN stops s2 ON rs2.stop_id = s2.id
            WHERE s1.name LIKE ? AND s2.name LIKE ?
            AND rs1.sequence_order < rs2.sequence_order
            AND r.status = 'active'
        `).all(`%${from}%`, `%${to}%`);
    } else if (fromLat && fromLng) {
        // Find nearest stops and their routes
        const lat = parseFloat(fromLat);
        const lng = parseFloat(fromLng);

        // Get all stops and calculate distances
        const allStops = db.prepare('SELECT * FROM stops').all();
        const nearbyStops = allStops
            .map(stop => ({
                ...stop,
                distance: Math.sqrt(Math.pow(stop.latitude - lat, 2) + Math.pow(stop.longitude - lng, 2))
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5);

        const nearbyStopIds = nearbyStops.map(s => s.id);

        if (nearbyStopIds.length > 0) {
            const placeholders = nearbyStopIds.map(() => '?').join(',');
            matchedRoutes = db.prepare(`
                SELECT DISTINCT r.* FROM routes r
                JOIN route_stops rs ON r.id = rs.route_id
                WHERE rs.stop_id IN (${placeholders})
                AND r.status = 'active'
            `).all(...nearbyStopIds);
        }
    } else {
        // Return all routes
        matchedRoutes = db.prepare("SELECT * FROM routes WHERE status = 'active'").all();
    }

    // Enrich with active trip info
    const enrichedRoutes = matchedRoutes.map(route => {
        const activeTrips = db.prepare(`
            SELECT t.*, b.bus_number, b.capacity
            FROM trips t
            JOIN buses b ON t.bus_id = b.id
            WHERE t.route_id = ? AND t.status IN ('active', 'scheduled')
            ORDER BY t.status DESC, t.scheduled_start
        `).all(route.id);

        const stops = db.prepare(`
            SELECT s.*, rs.sequence_order, rs.distance_from_start_km, rs.avg_time_from_start_min
            FROM route_stops rs
            JOIN stops s ON rs.stop_id = s.id
            WHERE rs.route_id = ?
            ORDER BY rs.sequence_order
        `).all(route.id);

        return {
            ...route,
            stops,
            activeTrips: activeTrips.map(trip => ({
                ...trip,
                crowd_level: getCrowdLevel(trip),
                crowd_percentage: trip.capacity > 0 ? Math.round((trip.current_passenger_count / trip.capacity) * 100) : 0
            }))
        };
    });

    res.json({ routes: enrichedRoutes });
});

// GET /api/routes/:id - Get route details
router.get('/:id', (req, res) => {
    const db = getDb();
    const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(req.params.id);

    if (!route) {
        return res.status(404).json({ error: 'Route not found' });
    }

    // Get stops
    const stops = db.prepare(`
        SELECT s.*, rs.sequence_order, rs.distance_from_start_km, rs.avg_time_from_start_min
        FROM route_stops rs
        JOIN stops s ON rs.stop_id = s.id
        WHERE rs.route_id = ?
        ORDER BY rs.sequence_order
    `).all(route.id);

    // Get active trips
    const activeTrips = db.prepare(`
        SELECT t.*, b.bus_number, b.capacity
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        WHERE t.route_id = ? AND t.status IN ('active', 'scheduled')
    `).all(route.id);

    res.json({
        route: {
            ...route,
            stops,
            activeTrips: activeTrips.map(trip => {
                const percentage = trip.capacity > 0 ? trip.current_passenger_count / trip.capacity : 0;
                return {
                    ...trip,
                    crowd_level: percentage <= 0.4 ? 'low' : (percentage <= 0.7 ? 'medium' : 'high'),
                    crowd_percentage: Math.round(percentage * 100)
                };
            })
        }
    });
});

// GET /api/routes/:id/buses - Active buses on route
router.get('/:id/buses', (req, res) => {
    const db = getDb();

    const buses = db.prepare(`
        SELECT b.*, t.id as trip_id, t.status as trip_status, t.current_stop_index,
               t.current_passenger_count, t.delay_minutes, t.direction
        FROM buses b
        LEFT JOIN trips t ON b.id = t.bus_id AND t.status = 'active'
        WHERE b.route_id = ?
    `).all(req.params.id);

    res.json({ buses });
});

// Helper function to get crowd level from trip data
function getCrowdLevel(trip) {
    const percentage = trip.capacity > 0 ? trip.current_passenger_count / trip.capacity : 0;
    if (percentage <= 0.4) return 'low';
    if (percentage <= 0.7) return 'medium';
    return 'high';
}

module.exports = router;
