const { getDb } = require('../db/database');
const { v4: uuidv4 } = require('uuid');

class NotificationEngine {
    static wsClients = new Map(); // userId -> Set of ws connections

    /**
     * Register a WebSocket connection for a user
     */
    static registerClient(userId, ws) {
        if (!this.wsClients.has(userId)) {
            this.wsClients.set(userId, new Set());
        }
        this.wsClients.get(userId).add(ws);

        ws.on('close', () => {
            const clients = this.wsClients.get(userId);
            if (clients) {
                clients.delete(ws);
                if (clients.size === 0) this.wsClients.delete(userId);
            }
        });
    }

    /**
     * Send real-time notification to a user
     */
    static sendToUser(userId, notification) {
        const clients = this.wsClients.get(userId);
        if (clients) {
            const message = JSON.stringify(notification);
            clients.forEach(ws => {
                if (ws.readyState === 1) { // OPEN
                    ws.send(message);
                }
            });
        }
    }

    /**
     * Broadcast notification to all connected users
     */
    static broadcast(notification) {
        const message = JSON.stringify(notification);
        this.wsClients.forEach((clients) => {
            clients.forEach(ws => {
                if (ws.readyState === 1) {
                    ws.send(message);
                }
            });
        });
    }

    /**
     * Create and send a notification
     */
    static createNotification(userId, type, title, message, data = null) {
        const db = getDb();
        const id = uuidv4();

        db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message, data)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, userId, type, title, message, data ? JSON.stringify(data) : null);

        const notification = { id, type, title, message, data, is_read: false, created_at: new Date().toISOString() };

        // Send real-time
        this.sendToUser(userId, {
            event: 'notification',
            data: notification
        });

        return notification;
    }

    /**
     * Send bus approaching alert
     */
    static sendBusApproachingAlert(userId, tripId, stopName, etaMinutes) {
        return this.createNotification(
            userId,
            'bus_approaching',
            '🚌 Bus Approaching!',
            `Your bus will arrive at ${stopName} in approximately ${etaMinutes} minutes.`,
            { tripId, stopName, etaMinutes }
        );
    }

    /**
     * Send delay notification
     */
    static sendDelayNotification(userId, tripId, routeName, delayMinutes) {
        return this.createNotification(
            userId,
            'delay',
            '⏰ Delay Alert',
            `Route ${routeName} is delayed by ${delayMinutes} minutes.`,
            { tripId, routeName, delayMinutes }
        );
    }

    /**
     * Send destination approaching alert
     */
    static sendDestinationAlert(userId, tripId, stopName, stopsRemaining) {
        return this.createNotification(
            userId,
            'destination_approaching',
            '📍 Destination Approaching!',
            `${stopName} is ${stopsRemaining} stop${stopsRemaining > 1 ? 's' : ''} away. Get ready to deboard!`,
            { tripId, stopName, stopsRemaining }
        );
    }

    /**
     * Send badge earned notification
     */
    static sendBadgeEarned(userId, badge) {
        return this.createNotification(
            userId,
            'badge_earned',
            `${badge.icon} Badge Earned!`,
            `You've earned the "${badge.name}" badge: ${badge.description}`,
            { badgeId: badge.id, badgeName: badge.name, badgeIcon: badge.icon }
        );
    }

    /**
     * Send points earned notification
     */
    static sendPointsEarned(userId, points, reason) {
        return this.createNotification(
            userId,
            'points_earned',
            '⭐ Points Earned!',
            `You earned ${points} points for ${reason}.`,
            { points, reason }
        );
    }

    /**
     * Get user notifications
     */
    static getNotifications(userId, limit = 50, unreadOnly = false) {
        const db = getDb();
        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [userId];

        if (unreadOnly) {
            query += ' AND is_read = 0';
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        return db.prepare(query).all(params);
    }

    /**
     * Mark notification as read
     */
    static markAsRead(notificationId, userId) {
        const db = getDb();
        db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
            .run(notificationId, userId);
    }

    /**
     * Mark all notifications as read
     */
    static markAllAsRead(userId) {
        const db = getDb();
        db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
            .run(userId);
    }

    /**
     * Get unread count
     */
    static getUnreadCount(userId) {
        const db = getDb();
        const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
            .get(userId);
        return result ? result.count : 0;
    }
}

module.exports = NotificationEngine;
