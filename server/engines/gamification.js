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
        board: 10,
        deboard: 5,
        crowd_feedback: 10,
        waitlist_join: 5,
        complaint: 15,
        streak_bonus_multiplier: 2,
        verified_accuracy_bonus: 5
    };

    /**
     * Award points strictly based on verification result
     */
    static awardPoints(userId, action, relatedUpdateId = null, verificationResult = { status: 'verified', isVerified: true }) {
        const db = getDb();
        const basePoints = this.POINT_VALUES[action] || 5;

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) return null;

        const isVerified = verificationResult.status === 'verified' || verificationResult.isVerified === true;
        const isPending = verificationResult.status === 'pending';
        const isRejected = verificationResult.status === 'rejected';

        // ❌ REJECTED: 0 points awarded
        if (isRejected) {
            const transactionId = uuidv4();
            db.prepare(`
                INSERT INTO point_transactions (id, user_id, amount, reason, related_update_id, is_verified, is_permanent)
                VALUES (?, ?, 0, ?, ?, 0, 0)
            `).run(transactionId, userId, `${action} (Rejected: ${verificationResult.rejectionReason || 'Unverified Location'})`, relatedUpdateId);

            return {
                points: 0,
                status: 'rejected',
                message: verificationResult.rejectionReason || 'Verification failed. Points withheld.',
                transactionId
            };
        }

        // ⏳ PENDING: Points placed in Escrow, NOT added to user balance until cross-verified
        if (isPending) {
            const transactionId = uuidv4();
            db.prepare(`
                INSERT INTO point_transactions (id, user_id, amount, reason, related_update_id, is_verified, is_permanent)
                VALUES (?, ?, ?, ?, ?, 0, 0)
            `).run(transactionId, userId, basePoints, `${action} (Pending Cross-Verification)`, relatedUpdateId);

            return {
                points: 0,
                pendingPoints: basePoints,
                status: 'pending',
                message: 'Check-in recorded. Points held in escrow pending crowd cross-verification.',
                transactionId
            };
        }

        // ✅ VERIFIED: Points awarded with potential streak multiplier and accuracy bonus
        let multiplier = 1;
        if (user.streak_days >= 7) {
            multiplier = this.POINT_VALUES.streak_bonus_multiplier;
        }

        const accuracyBonus = isVerified ? this.POINT_VALUES.verified_accuracy_bonus : 0;
        const totalPoints = (basePoints * multiplier) + accuracyBonus;
        const reason = `${action} [GPS Verified ✓]${multiplier > 1 ? ` (${multiplier}x streak bonus)` : ''}${accuracyBonus > 0 ? ` (+${accuracyBonus} accuracy bonus)` : ''}`;

        const transactionId = uuidv4();
        db.prepare(`
            INSERT INTO point_transactions (id, user_id, amount, reason, related_update_id, is_verified, is_permanent)
            VALUES (?, ?, ?, ?, ?, 1, 1)
        `).run(transactionId, userId, totalPoints, reason, relatedUpdateId);

        // Add points directly to user's permanent balance
        db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(totalPoints, userId);

        // Update streak & contributions
        this.updateStreak(userId);
        this.updateLevel(userId);
        this.checkBadges(userId);

        return {
            points: totalPoints,
            basePoints,
            accuracyBonus,
            multiplier,
            status: 'verified',
            reason,
            transactionId,
            message: `+${totalPoints} Points Added to your balance!`
        };
    }

    /**
     * Unlock and credit pending points when an update becomes verified
     */
    static verifyPoints(updateId) {
        const db = getDb();
        const transaction = db.prepare(`
            SELECT * FROM point_transactions WHERE related_update_id = ? AND is_verified = 0
        `).get(updateId);

        if (!transaction || transaction.amount <= 0) return;

        const bonusPoints = this.POINT_VALUES.verified_accuracy_bonus;
        const totalCredited = transaction.amount + bonusPoints;

        db.prepare(`
            UPDATE point_transactions 
            SET is_verified = 1, is_permanent = 1, amount = ?, verified_at = datetime('now')
            WHERE id = ?
        `).run(totalCredited, transaction.id);

        db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(totalCredited, transaction.user_id);
        this.updateLevel(transaction.user_id);
    }

    /**
     * Update user streak days
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
            return;
        }

        const last = new Date(lastDate);
        const current = new Date(today);
        const diffDays = Math.round((current - last) / (1000 * 3600 * 24));

        if (diffDays === 1) {
            db.prepare('UPDATE users SET streak_days = streak_days + 1, last_contribution_date = ? WHERE id = ?')
                .run(today, userId);
        } else if (diffDays > 1) {
            db.prepare('UPDATE users SET streak_days = 1, last_contribution_date = ? WHERE id = ?')
                .run(today, userId);
        }
    }

    /**
     * Update user level based on total points
     */
    static updateLevel(userId) {
        const db = getDb();
        const user = db.prepare('SELECT points, level FROM users WHERE id = ?').get(userId);
        if (!user) return;

        let newLevel = this.LEVELS[0].name;
        for (let i = this.LEVELS.length - 1; i >= 0; i--) {
            if (user.points >= this.LEVELS[i].minPoints) {
                newLevel = this.LEVELS[i].name;
                break;
            }
        }

        if (newLevel !== user.level) {
            db.prepare('UPDATE users SET level = ? WHERE id = ?').run(newLevel, userId);
        }
    }

    /**
     * Check and award new badges
     */
    static checkBadges(userId) {
        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) return [];

        const allBadges = db.prepare('SELECT * FROM badges').all();
        const userBadges = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?').all(userId);
        const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

        const newlyEarned = [];

        for (const badge of allBadges) {
            if (earnedBadgeIds.has(badge.id)) continue;

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
                    if (badge.id === 'badge_08') {
                        earned = (user.reliability_score || 0) >= (badge.requirement_value / 100);
                    }
                    break;
            }

            if (earned) {
                db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(userId, badge.id);
                newlyEarned.push(badge);
            }
        }

        return newlyEarned;
    }

    /**
     * Get gamification profile for a user
     */
    static getProfile(userId) {
        const db = getDb();
        const user = db.prepare('SELECT id, name, email, points, level, streak_days, total_contributions, reliability_score, created_at FROM users WHERE id = ?').get(userId);
        if (!user) return null;

        const badges = db.prepare(`
            SELECT b.*, ub.earned_at
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = ?
            ORDER BY ub.earned_at DESC
        `).all(userId);

        const recentTransactions = db.prepare(`
            SELECT * FROM point_transactions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        `).all(userId);

        return {
            ...user,
            badges,
            recentTransactions
        };
    }

    /**
     * Get leaderboard of top contributors
     */
    static getLeaderboard(limit = 20) {
        const db = getDb();
        return db.prepare(`
            SELECT id, name, level, points, streak_days, total_contributions, reliability_score
            FROM users
            ORDER BY points DESC
            LIMIT ?
        `).all(limit);
    }
}

module.exports = GamificationEngine;
