const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const CrowdIntelligenceEngine = require('../engines/crowdIntelligence');
const VerificationEngine = require('../engines/verification');
const GamificationEngine = require('../engines/gamification');
const NotificationEngine = require('../engines/notifications');

const router = express.Router();

// POST /api/updates/board - Report boarding a bus
router.post('/board', authenticateToken, (req, res) => {
    try {
        const { tripId, stopId, latitude, longitude } = req.body;
        const userId = req.user.id;

        if (!tripId) {
            return res.status(400).json({ error: 'tripId is required' });
        }

        const db = getDb();
        const updateId = uuidv4();

        // Create update record
        db.prepare(`
            INSERT INTO user_updates (id, user_id, trip_id, stop_id, update_type, latitude, longitude)
            VALUES (?, ?, ?, ?, 'board', ?, ?)
        `).run(updateId, userId, tripId, stopId || null, latitude || null, longitude || null);

        // Process in crowd intelligence engine
        CrowdIntelligenceEngine.processBoarding(tripId, stopId, userId);

        // Create user journey record
        const journeyId = uuidv4();
        db.prepare(`
            INSERT INTO user_journeys (id, user_id, trip_id, board_stop_id)
            VALUES (?, ?, ?, ?)
        `).run(journeyId, userId, tripId, stopId || 'unknown');

        // Run verification
        const update = db.prepare('SELECT * FROM user_updates WHERE id = ?').get(updateId);
        const verification = VerificationEngine.verifyUpdate(update);

        // Award points
        const points = GamificationEngine.awardPoints(userId, 'board', updateId);

        // Send notification
        if (points) {
            NotificationEngine.sendPointsEarned(userId, points.points, 'boarding confirmation');
        }

        // Check for new badges
        const newBadges = GamificationEngine.checkBadges(userId);
        for (const badge of newBadges) {
            NotificationEngine.sendBadgeEarned(userId, badge);
        }

        // Update total contributions
        db.prepare('UPDATE users SET total_contributions = total_contributions + 1 WHERE id = ?').run(userId);

        res.json({
            message: 'Boarding recorded successfully',
            updateId,
            journeyId,
            verification: {
                status: verification.status,
                confidence: verification.confidenceScore
            },
            points: points ? points.points : 0,
            newBadges
        });
    } catch (err) {
        console.error('Board update error:', err);
        res.status(500).json({ error: 'Failed to record boarding' });
    }
});

// POST /api/updates/deboard - Report deboarding
router.post('/deboard', authenticateToken, (req, res) => {
    try {
        const { tripId, stopId, latitude, longitude } = req.body;
        const userId = req.user.id;

        if (!tripId) {
            return res.status(400).json({ error: 'tripId is required' });
        }

        const db = getDb();
        const updateId = uuidv4();

        db.prepare(`
            INSERT INTO user_updates (id, user_id, trip_id, stop_id, update_type, latitude, longitude)
            VALUES (?, ?, ?, ?, 'deboard', ?, ?)
        `).run(updateId, userId, tripId, stopId || null, latitude || null, longitude || null);

        // Process in crowd intelligence engine
        CrowdIntelligenceEngine.processDeboarding(tripId, stopId, userId);

        // Complete user journey
        db.prepare(`
            UPDATE user_journeys 
            SET deboard_stop_id = ?, deboarded_at = datetime('now'), status = 'completed'
            WHERE user_id = ? AND trip_id = ? AND status = 'active'
        `).run(stopId || 'unknown', userId, tripId);

        // Run verification
        const update = db.prepare('SELECT * FROM user_updates WHERE id = ?').get(updateId);
        const verification = VerificationEngine.verifyUpdate(update);

        // Award points
        const points = GamificationEngine.awardPoints(userId, 'deboard', updateId);

        // Update contributions
        db.prepare('UPDATE users SET total_contributions = total_contributions + 1 WHERE id = ?').run(userId);

        res.json({
            message: 'Deboarding recorded successfully',
            updateId,
            verification: {
                status: verification.status,
                confidence: verification.confidenceScore
            },
            points: points ? points.points : 0
        });
    } catch (err) {
        console.error('Deboard update error:', err);
        res.status(500).json({ error: 'Failed to record deboarding' });
    }
});

// POST /api/updates/crowd - Submit crowd feedback
router.post('/crowd', authenticateToken, (req, res) => {
    try {
        const { tripId, stopId, crowdLevel, latitude, longitude } = req.body;
        const userId = req.user.id;

        if (!tripId || !crowdLevel) {
            return res.status(400).json({ error: 'tripId and crowdLevel are required' });
        }

        if (!['low', 'medium', 'high'].includes(crowdLevel)) {
            return res.status(400).json({ error: 'crowdLevel must be low, medium, or high' });
        }

        const db = getDb();
        const updateId = uuidv4();

        db.prepare(`
            INSERT INTO user_updates (id, user_id, trip_id, stop_id, update_type, crowd_level, latitude, longitude)
            VALUES (?, ?, ?, ?, 'crowd_feedback', ?, ?, ?)
        `).run(updateId, userId, tripId, stopId || null, crowdLevel, latitude || null, longitude || null);

        // Process crowd feedback
        CrowdIntelligenceEngine.processCrowdFeedback(tripId, stopId, crowdLevel);

        // Verify
        const update = db.prepare('SELECT * FROM user_updates WHERE id = ?').get(updateId);
        const verification = VerificationEngine.verifyUpdate(update);

        // Award points
        const points = GamificationEngine.awardPoints(userId, 'crowd_feedback', updateId);

        // Cross-verify older pending updates
        const pendingUpdates = db.prepare(`
            SELECT id FROM user_updates 
            WHERE trip_id = ? AND verification_status = 'pending' AND id != ?
        `).all(tripId, updateId);
        for (const pu of pendingUpdates) {
            VerificationEngine.crossVerifyWithSubsequent(pu.id);
        }

        // Update contributions
        db.prepare('UPDATE users SET total_contributions = total_contributions + 1 WHERE id = ?').run(userId);

        // Update user reliability
        VerificationEngine.updateUserReliability(userId);

        res.json({
            message: 'Crowd feedback recorded',
            updateId,
            verification: {
                status: verification.status,
                confidence: verification.confidenceScore
            },
            points: points ? points.points : 0
        });
    } catch (err) {
        console.error('Crowd feedback error:', err);
        res.status(500).json({ error: 'Failed to record crowd feedback' });
    }
});

// GET /api/updates/trip/:tripId - Get updates for a trip
router.get('/trip/:tripId', (req, res) => {
    const db = getDb();
    const updates = db.prepare(`
        SELECT u.*, usr.name as user_name
        FROM user_updates u
        JOIN users usr ON u.user_id = usr.id
        WHERE u.trip_id = ?
        ORDER BY u.timestamp DESC
        LIMIT 50
    `).all(req.params.tripId);

    res.json({ updates });
});

// GET /api/updates/my - Get user's own updates
router.get('/my', authenticateToken, (req, res) => {
    const db = getDb();
    const updates = db.prepare(`
        SELECT u.*, r.name as route_name, r.route_number
        FROM user_updates u
        JOIN trips t ON u.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        WHERE u.user_id = ?
        ORDER BY u.timestamp DESC
        LIMIT 50
    `).all(req.user.id);

    res.json({ updates });
});

module.exports = router;
