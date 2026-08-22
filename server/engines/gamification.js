const { getDb } = require('../db/database');
const { v4: uuidv4 } = require('uuid');

class GamificationEngine {
    // Level thresholds
    static LEVELS = [
        { name: 'Commuter', minPoints: 0, icon: '🚶' },
        { name: 'Regular', minPoints: 100, icon: '🚌' },
        { name: 'Contributor', minPoints: 500, icon: '⭐' },
        { name: 'Expert', minPoints: 2000, icon: '🏆' },
        { name: 'Legend', minPoints: 5000, icon: '👑' }
    ];

    // Point values for different actions
    static POINT_VALUES = {
        board: 5,
        deboard: 5,
        crowd_feedback: 10,
        complaint: 15,
        streak_bonus_multiplier: 2,
        verified_bonus: 5
    };

    /**
     * Award points for a user action
     */
    static awardPoints(userId, action, relatedUpdateId = null) {
        const db = getDb();
        const basePoints = this.POINT_VALUES[action] || 5;

        // Check streak bonus
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) return null;

        let multiplier = 1;
        if (user.streak_days >= 7) {
            multiplier = this.POINT_VALUES.streak_bonus_multiplier;
        }

        const points = basePoints * multiplier;
        const reason = `${action}${multiplier > 1 ? ` (${multiplier}x streak bonus)` : ''}`;

        // Create point transaction (pending verification)
        const transactionId = uuidv4();
        db.prepare(`
            INSERT INTO point_transactions (id, user_id, amount, reason, related_update_id, is_verified, is_permanent)
            VALUES (?, ?, ?, ?, ?, 0, 0)
        `).run(transactionId, userId, points, reason, relatedUpdateId);

        // Add provisional points
        db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(points, userId);

        // Update streak
        this.updateStreak(userId);

        // Check and update level
        this.updateLevel(userId);

        // Check for new badges
        this.checkBadges(userId);

        return { points, multiplier, reason, transactionId };
    }

    /**
     * Verify and make points permanent when the associated update is verified
     */
    static verifyPoints(updateId) {
        const db = getDb();
        const transaction = db.prepare(`
            SELECT * FROM point_transactions WHERE related_update_id = ? AND is_verified = 0
        `).get(updateId);

        if (!transaction) return;

        // Award bonus for verified contribution
        const bonusPoints = this.POINT_VALUES.verified_bonus;

        db.prepare(`
            UPDATE point_transactions SET is_verified = 1, is_permanent = 1, verified_at = datetime('now')
            WHERE id = ?
        `).run(transaction.id);

        // Add verification bonus
        db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(bonusPoints, transaction.user_id);

        this.updateLevel(transaction.user_id);
    }

    /**
     * Revoke points for rejected updates
     */
    static revokePoints(updateId) {
        const db = getDb();
        const transaction = db.prepare(`
            SELECT * FROM point_transactions WHERE related_update_id = ? AND is_permanent = 0
        `).get(updateId);

        if (!transaction) return;

        // Remove the provisional points
        db.prepare('UPDATE users SET points = MAX(0, points - ?) WHERE id = ?')
            .run(transaction.amount, transaction.user_id);

        db.prepare('DELETE FROM point_transactions WHERE id = ?').run(transaction.id);

        this.updateLevel(transaction.user_id);
    }

    /**
     * Update user's streak
     */
    static updateStreak(userId) {
        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const lastDate = user.last_contribution_date;

        if (!lastDate) {
            db.prepare('UPDATE users SET streak_days = 1, last_contribution_date = ? WHERE id = ?')
                .run(today, userId);
        } else if (lastDate === today) {
            // Same day, no change
        } else {
            const lastDateObj = new Date(lastDate);
            const todayObj = new Date(today);
            const diffDays = Math.floor((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day
                db.prepare('UPDATE users SET streak_days = streak_days + 1, last_contribution_date = ? WHERE id = ?')
                    .run(today, userId);
            } else {
                // Streak broken
                db.prepare('UPDATE users SET streak_days = 1, last_contribution_date = ? WHERE id = ?')
                    .run(today, userId);
            }
        }
    }

    /**
     * Update user level based on points
     */
    static updateLevel(userId) {
        const db = getDb();
        const user = db.prepare('SELECT points FROM users WHERE id = ?').get(userId);
        if (!user) return;

        let newLevel = 'Commuter';
        for (const level of this.LEVELS) {
            if (user.points >= level.minPoints) {
                newLevel = level.name;
            }
        }

        db.prepare('UPDATE users SET level = ? WHERE id = ?').run(newLevel, userId);
        return newLevel;
    }

    /**
     * Check and award badges
     */
    static checkBadges(userId) {
        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) return [];

        const earnedBadges = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?').all(userId);
        const earnedIds = new Set(earnedBadges.map(b => b.badge_id));

        const allBadges = db.prepare('SELECT * FROM badges').all();
        const newBadges = [];

        for (const badge of allBadges) {
            if (earnedIds.has(badge.id)) continue;

            let earned = false;

            switch (badge.requirement_type) {
                case 'contributions':
                    earned = user.total_contributions >= badge.requirement_value;
                    break;
                case 'streak':
                    earned = user.streak_days >= badge.requirement_value;
                    break;
                case 'points':
                    earned = user.points >= badge.requirement_value;
                    break;
                case 'special':
                    // Special badges checked separately
                    if (badge.id === 'badge_08') {
                        earned = user.reliability_score >= 0.9;
                    }
                    break;
            }

            if (earned) {
                db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)')
                    .run(userId, badge.id);
                newBadges.push(badge);
            }
        }

        return newBadges;
    }

    /**
     * Get user's gamification profile
     */
    static getProfile(userId) {
        const db = getDb();
        const user = db.prepare(`
            SELECT id, name, email, points, level, reliability_score, 
                   total_contributions, streak_days, last_contribution_date, created_at
            FROM users WHERE id = ?
        `).get(userId);

        if (!user) return null;

        // Get current level info
        const currentLevel = this.LEVELS.find(l => l.name === user.level) || this.LEVELS[0];
        const currentLevelIndex = this.LEVELS.indexOf(currentLevel);
        const nextLevel = currentLevelIndex < this.LEVELS.length - 1 ? this.LEVELS[currentLevelIndex + 1] : null;

        // Calculate progress to next level
        let levelProgress = 100;
        if (nextLevel) {
            const range = nextLevel.minPoints - currentLevel.minPoints;
            const progress = user.points - currentLevel.minPoints;
            levelProgress = Math.min(100, Math.round((progress / range) * 100));
        }

        // Get badges
        const badges = db.prepare(`
            SELECT b.*, ub.earned_at 
            FROM user_badges ub 
            JOIN badges b ON ub.badge_id = b.id 
            WHERE ub.user_id = ?
            ORDER BY ub.earned_at DESC
        `).all(userId);

        // Get recent point transactions
        const recentTransactions = db.prepare(`
            SELECT * FROM point_transactions 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 20
        `).all(userId);

        // Get contribution stats
        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total_updates,
                SUM(CASE WHEN update_type = 'board' THEN 1 ELSE 0 END) as boarding_count,
                SUM(CASE WHEN update_type = 'deboard' THEN 1 ELSE 0 END) as deboarding_count,
                SUM(CASE WHEN update_type = 'crowd_feedback' THEN 1 ELSE 0 END) as crowd_feedback_count
            FROM user_updates WHERE user_id = ?
        `).get(userId);

        return {
            ...user,
            currentLevel: { ...currentLevel },
            nextLevel,
            levelProgress,
            badges,
            recentTransactions,
            stats: stats || { total_updates: 0, boarding_count: 0, deboarding_count: 0, crowd_feedback_count: 0 }
        };
    }

    /**
     * Get leaderboard
     */
    static getLeaderboard(limit = 20) {
        const db = getDb();
        return db.prepare(`
            SELECT id, name, points, level, reliability_score, total_contributions, streak_days,
                   (SELECT COUNT(*) FROM user_badges WHERE user_id = users.id) as badge_count
            FROM users 
            ORDER BY points DESC 
            LIMIT ?
        `).all(limit);
    }
}

module.exports = GamificationEngine;
