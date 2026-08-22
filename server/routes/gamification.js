const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const GamificationEngine = require('../engines/gamification');

const router = express.Router();

// GET /api/gamification/profile - Get gamification profile
router.get('/profile', authenticateToken, (req, res) => {
    const profile = GamificationEngine.getProfile(req.user.id);
    if (!profile) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ profile });
});

// GET /api/gamification/leaderboard - Get leaderboard
router.get('/leaderboard', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = GamificationEngine.getLeaderboard(limit);
    res.json({ leaderboard });
});

// GET /api/gamification/badges - Get all available badges
router.get('/badges', (req, res) => {
    const db = getDb();
    const badges = db.prepare('SELECT * FROM badges ORDER BY rarity, name').all();
    res.json({ badges });
});

// GET /api/gamification/badges/my - Get user's badges
router.get('/badges/my', authenticateToken, (req, res) => {
    const db = getDb();
    const badges = db.prepare(`
        SELECT b.*, ub.earned_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ?
        ORDER BY ub.earned_at DESC
    `).all(req.user.id);

    res.json({ badges });
});

// GET /api/gamification/history - Get point transaction history
router.get('/history', authenticateToken, (req, res) => {
    const db = getDb();
    const transactions = db.prepare(`
        SELECT * FROM point_transactions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    `).all(req.user.id);

    res.json({ transactions });
});

module.exports = router;
