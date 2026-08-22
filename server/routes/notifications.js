const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const NotificationEngine = require('../engines/notifications');

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get('/', authenticateToken, (req, res) => {
    const unreadOnly = req.query.unread === 'true';
    const limit = parseInt(req.query.limit) || 50;
    const notifications = NotificationEngine.getNotifications(req.user.id, limit, unreadOnly);
    const unreadCount = NotificationEngine.getUnreadCount(req.user.id);

    res.json({ notifications, unreadCount });
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', authenticateToken, (req, res) => {
    NotificationEngine.markAsRead(req.params.id, req.user.id);
    res.json({ message: 'Marked as read' });
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', authenticateToken, (req, res) => {
    NotificationEngine.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
});

module.exports = router;
