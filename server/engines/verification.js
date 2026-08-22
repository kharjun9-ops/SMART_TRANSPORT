const { getDb } = require('../db/database');

class VerificationEngine {
    /**
     * Verify a user update using GPS proximity, time context, and pattern analysis
     */
    static verifyUpdate(update) {
        const db = getDb();
        let confidenceScore = 0.5;
        const notes = [];

        // 1. GPS Proximity Check
        const gpsScore = this.checkGPSProximity(update);
        confidenceScore += gpsScore.adjustment;
        notes.push(gpsScore.note);

        // 2. Time Context Validation
        const timeScore = this.checkTimeContext(update);
        confidenceScore += timeScore.adjustment;
        notes.push(timeScore.note);

        // 3. Route Consistency Check
        const routeScore = this.checkRouteConsistency(update);
        confidenceScore += routeScore.adjustment;
        notes.push(routeScore.note);

        // 4. User Reliability Factor
        const reliabilityScore = this.getUserReliabilityFactor(update.user_id);
        confidenceScore += reliabilityScore.adjustment;
        notes.push(reliabilityScore.note);

        // Clamp confidence between 0 and 1
        confidenceScore = Math.max(0, Math.min(1, confidenceScore));

        // Determine verification status
        let status = 'pending';
        if (confidenceScore >= 0.7) {
            status = 'verified';
        } else if (confidenceScore < 0.3) {
            status = 'rejected';
        }

        // Update the record
        db.prepare(`
            UPDATE user_updates 
            SET confidence_score = ?, verification_status = ?, verification_notes = ?,
                gps_verified = ?
            WHERE id = ?
        `).run(confidenceScore, status, notes.join('; '), gpsScore.verified ? 1 : 0, update.id);

        return {
            confidenceScore,
            status,
            notes,
            gpsVerified: gpsScore.verified
        };
    }

    /**
     * Check if user's GPS is near the reported stop
     */
    static checkGPSProximity(update) {
        if (!update.latitude || !update.longitude || !update.stop_id) {
            return { adjustment: 0, note: 'No GPS data provided', verified: false };
        }

        const db = getDb();
        const stop = db.prepare('SELECT latitude, longitude FROM stops WHERE id = ?').get(update.stop_id);
        if (!stop) {
            return { adjustment: -0.1, note: 'Stop not found', verified: false };
        }

        const distance = this.calculateDistance(
            update.latitude, update.longitude,
            stop.latitude, stop.longitude
        );

        if (distance < 0.1) { // Within 100 meters
            return { adjustment: 0.2, note: `GPS verified: ${Math.round(distance * 1000)}m from stop`, verified: true };
        } else if (distance < 0.3) { // Within 300 meters
            return { adjustment: 0.1, note: `GPS near stop: ${Math.round(distance * 1000)}m`, verified: true };
        } else if (distance < 1.0) { // Within 1km
            return { adjustment: 0, note: `GPS somewhat far: ${Math.round(distance * 1000)}m`, verified: false };
        } else {
            return { adjustment: -0.2, note: `GPS too far: ${Math.round(distance * 1000)}m`, verified: false };
        }
    }

    /**
     * Validate time context of the update
     */
    static checkTimeContext(update) {
        const db = getDb();
        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(update.trip_id);
        if (!trip) {
            return { adjustment: -0.1, note: 'Trip not found' };
        }

        // Check if trip is active
        if (trip.status !== 'active') {
            if (trip.status === 'scheduled') {
                return { adjustment: -0.1, note: 'Trip not yet started' };
            }
            return { adjustment: -0.2, note: 'Trip not active' };
        }

        // Check if the update timestamp is reasonable
        const updateTime = new Date(update.timestamp);
        const now = new Date();
        const timeDiff = Math.abs(now - updateTime) / (1000 * 60); // minutes

        if (timeDiff < 5) {
            return { adjustment: 0.1, note: 'Recent update' };
        } else if (timeDiff < 15) {
            return { adjustment: 0.05, note: 'Slightly delayed update' };
        } else {
            return { adjustment: -0.1, note: 'Stale update' };
        }
    }

    /**
     * Check if the update is consistent with the route and trip progress
     */
    static checkRouteConsistency(update) {
        const db = getDb();

        if (!update.stop_id) {
            return { adjustment: 0, note: 'No stop specified' };
        }

        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(update.trip_id);
        if (!trip) return { adjustment: 0, note: 'Trip not found' };

        // Check if stop is on the route
        const routeStop = db.prepare(`
            SELECT * FROM route_stops WHERE route_id = ? AND stop_id = ?
        `).get(trip.route_id, update.stop_id);

        if (!routeStop) {
            return { adjustment: -0.3, note: 'Stop not on this route' };
        }

        // Check if stop is consistent with trip progress
        if (routeStop.sequence_order >= trip.current_stop_index) {
            return { adjustment: 0.1, note: 'Stop consistent with trip progress' };
        } else {
            return { adjustment: -0.1, note: 'Stop already passed' };
        }
    }

    /**
     * Get user's reliability factor based on history
     */
    static getUserReliabilityFactor(userId) {
        const db = getDb();
        const user = db.prepare('SELECT reliability_score, total_contributions FROM users WHERE id = ?').get(userId);

        if (!user) return { adjustment: 0, note: 'User not found' };

        if (user.total_contributions < 5) {
            return { adjustment: 0, note: 'New user (insufficient history)' };
        }

        if (user.reliability_score >= 0.8) {
            return { adjustment: 0.15, note: 'Highly reliable user' };
        } else if (user.reliability_score >= 0.6) {
            return { adjustment: 0.05, note: 'Moderately reliable user' };
        } else if (user.reliability_score >= 0.4) {
            return { adjustment: 0, note: 'Average reliability' };
        } else {
            return { adjustment: -0.1, note: 'Low reliability user' };
        }
    }

    /**
     * Cross-verify with subsequent updates from other users
     */
    static crossVerifyWithSubsequent(updateId) {
        const db = getDb();
        const update = db.prepare('SELECT * FROM user_updates WHERE id = ?').get(updateId);
        if (!update) return;

        // Find subsequent updates for the same trip within 10 minutes
        const subsequentUpdates = db.prepare(`
            SELECT * FROM user_updates 
            WHERE trip_id = ? AND id != ? AND user_id != ?
            AND timestamp > ? AND timestamp < datetime(?, '+10 minutes')
            AND verification_status != 'rejected'
        `).all(update.trip_id, updateId, update.user_id, update.timestamp, update.timestamp);

        if (subsequentUpdates.length === 0) return;

        let agreementCount = 0;
        let totalComparable = 0;

        for (const subsequent of subsequentUpdates) {
            if (update.crowd_level && subsequent.crowd_level) {
                totalComparable++;
                if (update.crowd_level === subsequent.crowd_level) {
                    agreementCount++;
                } else {
                    // Check if they're adjacent levels (partial agreement)
                    const levels = ['low', 'medium', 'high'];
                    const diff = Math.abs(levels.indexOf(update.crowd_level) - levels.indexOf(subsequent.crowd_level));
                    if (diff === 1) agreementCount += 0.5;
                }
            }
        }

        if (totalComparable > 0) {
            const agreementRate = agreementCount / totalComparable;
            const adjustment = (agreementRate - 0.5) * 0.3;

            const newConfidence = Math.max(0, Math.min(1, update.confidence_score + adjustment));
            const newStatus = newConfidence >= 0.7 ? 'verified' : (newConfidence < 0.3 ? 'rejected' : 'pending');

            db.prepare(`
                UPDATE user_updates 
                SET confidence_score = ?, verification_status = ?
                WHERE id = ?
            `).run(newConfidence, newStatus, updateId);
        }
    }

    /**
     * Update user reliability score based on their verification history
     */
    static updateUserReliability(userId) {
        const db = getDb();

        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                AVG(confidence_score) as avg_confidence
            FROM user_updates 
            WHERE user_id = ? AND verification_status != 'pending'
        `).get(userId);

        if (!stats || stats.total === 0) return;

        // Weighted reliability score
        const verifiedRate = stats.verified / stats.total;
        const reliabilityScore = (verifiedRate * 0.6) + (stats.avg_confidence * 0.4);

        db.prepare('UPDATE users SET reliability_score = ?, total_contributions = ? WHERE id = ?')
            .run(Math.round(reliabilityScore * 100) / 100, stats.total, userId);
    }

    /**
     * Calculate distance between two GPS coordinates (Haversine formula)
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    static toRad(deg) {
        return deg * (Math.PI / 180);
    }
}

module.exports = VerificationEngine;
