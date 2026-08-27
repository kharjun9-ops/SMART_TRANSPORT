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
        const { tripId, stopId, latitude, longitude, isDemo } = req.body;
        const userId = req.user.id;

        if (!tripId) {
            return res.status(400).json({ error: 'tripId is required' });
        }

        const db = getDb();
        const updateId = uuidv4();

        // 1. Run Verification First
        const updateCandidate = {
            id: updateId,
            user_id: userId,
            trip_id: tripId,
            stop_id: stopId || null,
            update_type: 'board',
            latitude: latitude || null,
            longitude: longitude || null,
            is_demo: !!isDemo,
            timestamp: new Date().toISOString()
        };

        const verification = VerificationEngine.verifyUpdate(updateCandidate);

        // Save the update record
        db.prepare(`
            INSERT INTO user_updates (id, user_id, trip_id, stop_id, update_type, latitude, longitude, gps_verified, verification_status, confidence_score, verification_notes)
            VALUES (?, ?, ?, ?, 'board', ?, ?, ?, ?, ?, ?)
        `).run(
            updateId, userId, tripId, stopId || null, latitude || null, longitude || null,
            verification.isVerified ? 1 : 0, verification.status, verification.confidenceScore,
        );

        // Process in crowd intelligence engine
        const boardRes = CrowdIntelligenceEngine.processBoarding(tripId, stopId, userId);

        // Create user journey record
        const journeyId = uuidv4();
        db.prepare(`
            INSERT INTO user_journeys (id, user_id, trip_id, board_stop_id)
            VALUES (?, ?, ?, ?)
        `).run(journeyId, userId, tripId, stopId || 'unknown');

        // Award points based on verification
        const pointsResult = GamificationEngine.awardPoints(userId, 'board', updateId, verification);

        if (pointsResult && pointsResult.points > 0) {
            NotificationEngine.sendPointsEarned(userId, pointsResult.points, 'verified boarding confirmation');
        }

        // Check for new badges
        const newBadges = GamificationEngine.checkBadges(userId);
        for (const badge of newBadges) {
            NotificationEngine.sendBadgeEarned(userId, badge);
        }

        // Update total contributions only for verified actions
        if (verification.isVerified) {
            db.prepare('UPDATE users SET total_contributions = total_contributions + 1 WHERE id = ?').run(userId);
        }

        res.json({
            verified: verification.isVerified,
            message: pointsResult.message,
            updateId,
            journeyId,
            passengerCount: boardRes ? boardRes.passengerCount : undefined,
            points: pointsResult.points,
            pendingPoints: pointsResult.pendingPoints || 0,
            verification: {
                status: verification.status,
                confidence: verification.confidenceScore,
                distanceToStopMeters: verification.distanceToStopMeters,
                distanceToBusMeters: verification.distanceToBusMeters,
                allowedPerimeterMeters: verification.allowedPerimeterMeters,
                checks: verification.checks
            },
            newBadges
        });
    } catch (err) {
        console.error('Board update error:', err);
        res.status(500).json({ error: 'Failed to process boarding' });
    }
});

// POST /api/updates/deboard - Report deboarding
router.post('/deboard', authenticateToken, (req, res) => {
    try {
        const { tripId, stopId, latitude, longitude, isDemo } = req.body;
        const userId = req.user.id;

        if (!tripId) {
            return res.status(400).json({ error: 'tripId is required' });
        }

        const db = getDb();
        const updateId = uuidv4();

        const updateCandidate = {
            id: updateId,
            user_id: userId,
            trip_id: tripId,
            stop_id: stopId || null,
            update_type: 'deboard',
            latitude: latitude || null,
            longitude: longitude || null,
            is_demo: !!isDemo,
            timestamp: new Date().toISOString()
        };

        const verification = VerificationEngine.verifyUpdate(updateCandidate);

        // Record the update
        db.prepare(`
            INSERT INTO user_updates (id, user_id, trip_id, stop_id, update_type, latitude, longitude, gps_verified, verification_status, confidence_score, verification_notes)
            VALUES (?, ?, ?, ?, 'deboard', ?, ?, ?, ?, ?, ?)
        `).run(
            updateId, userId, tripId, stopId || null, latitude || null, longitude || null,
            verification.isVerified ? 1 : 0, verification.status, verification.confidenceScore,
            verification.notes ? verification.notes.join('; ') : ''
        );

        // Process in crowd intelligence engine
        const deboardRes = CrowdIntelligenceEngine.processDeboarding(tripId, stopId, userId);

        // Complete user journey
        db.prepare(`
            UPDATE user_journeys 
            SET deboard_stop_id = ?, deboarded_at = datetime('now'), status = 'completed'
            WHERE user_id = ? AND trip_id = ? AND status = 'active'
        `).run(stopId || 'unknown', userId, tripId);

        // Award points
        const pointsResult = GamificationEngine.awardPoints(userId, 'deboard', updateId, verification);

        if (verification.isVerified) {
            db.prepare('UPDATE users SET total_contributions = total_contributions + 1 WHERE id = ?').run(userId);
        }

        res.json({
            verified: verification.isVerified,
            message: pointsResult.message,
            updateId,
            passengerCount: deboardRes ? deboardRes.passengerCount : undefined,
            points: pointsResult.points,
            pendingPoints: pointsResult.pendingPoints || 0,
            verification: {
                status: verification.status,
                confidence: verification.confidenceScore,
                distanceToStopMeters: verification.distanceToStopMeters,
                distanceToBusMeters: verification.distanceToBusMeters,
                checks: verification.checks
            }
        });
    } catch (err) {
        console.error('Deboard update error:', err);
        res.status(500).json({ error: 'Failed to record deboarding' });
    }
});

// POST /api/updates/crowd - Submit crowd feedback with strict verification
router.post('/crowd', authenticateToken, (req, res) => {
    try {
        const { tripId, stopId, crowdLevel, latitude, longitude, isDemo } = req.body;
        const userId = req.user.id;

        if (!tripId || !crowdLevel) {
            return res.status(400).json({ error: 'tripId and crowdLevel are required' });
        }

        if (!['low', 'medium', 'high'].includes(crowdLevel)) {
            return res.status(400).json({ error: 'crowdLevel must be low, medium, or high' });
        }

        const db = getDb();
        const updateId = uuidv4();

        const updateCandidate = {
            id: updateId,
            user_id: userId,
            trip_id: tripId,
            stop_id: stopId || null,
            update_type: 'crowd_feedback',
            crowd_level: crowdLevel,
            latitude: latitude || null,
            longitude: longitude || null,
            is_demo: !!isDemo,
            timestamp: new Date().toISOString()
        };

        // 1. Verify First
        const verification = VerificationEngine.verifyUpdate(updateCandidate);

        if (verification.status === 'rejected') {
            return res.status(422).json({
                verified: false,
                status: 'rejected',
                points: 0,
                message: verification.rejectionReason,
                verification: {
                    confidence: verification.confidenceScore,
                    distanceToStopMeters: verification.distanceToStopMeters,
                    distanceToBusMeters: verification.distanceToBusMeters,
                    allowedPerimeterMeters: verification.allowedPerimeterMeters,
                    checks: verification.checks
                }
            });
        }

        db.prepare(`
            INSERT INTO user_updates (id, user_id, trip_id, stop_id, update_type, crowd_level, latitude, longitude, gps_verified, verification_status, confidence_score, verification_notes)
            VALUES (?, ?, ?, ?, 'crowd_feedback', ?, ?, ?, ?, ?, ?, ?)
        `).run(
            updateId, userId, tripId, stopId || null, crowdLevel, latitude || null, longitude || null,
            verification.isVerified ? 1 : 0, verification.status, verification.confidenceScore,
            verification.notes ? verification.notes.join('; ') : ''
        );

        // Process crowd feedback in engine
        CrowdIntelligenceEngine.processCrowdFeedback(tripId, stopId, crowdLevel);

        // Award points
        const pointsResult = GamificationEngine.awardPoints(userId, 'crowd_feedback', updateId, verification);

        // Cross-verify older pending updates
        const pendingUpdates = db.prepare(`
            SELECT id FROM user_updates 
            WHERE trip_id = ? AND verification_status = 'pending' AND id != ?
        `).all(tripId, updateId);
        for (const pu of pendingUpdates) {
            VerificationEngine.crossVerifyWithSubsequent(pu.id);
        }

        if (verification.isVerified) {
            db.prepare('UPDATE users SET total_contributions = total_contributions + 1 WHERE id = ?').run(userId);
            VerificationEngine.updateUserReliability(userId);
        }

        res.json({
            verified: verification.isVerified,
            message: pointsResult.message,
            updateId,
            points: pointsResult.points,
            pendingPoints: pointsResult.pendingPoints || 0,
            verification: {
                status: verification.status,
                confidence: verification.confidenceScore,
                distanceToStopMeters: verification.distanceToStopMeters,
                distanceToBusMeters: verification.distanceToBusMeters,
                allowedPerimeterMeters: verification.allowedPerimeterMeters,
                checks: verification.checks
            }
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

// GET /api/updates/my - Get user's own updates with verification history
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
