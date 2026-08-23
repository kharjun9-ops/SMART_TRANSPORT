const { getDb } = require('../db/database');

class VerificationEngine {
    /**
     * Maximum allowed distance in km for GPS verification (350 meters)
     */
    static MAX_GEOFENCE_DISTANCE_KM = 0.35; // 350m
    static OPTIMAL_GEOFENCE_DISTANCE_KM = 0.15; // 150m

    /**
     * Verify a user update using multi-dimensional checks:
     * 1. High-precision GPS Geofencing (Stop & Bus Proximity)
     * 2. Trip schedule and route sequence alignment
     * 3. Velocity / Teleportation check
     * 4. Anti-spam rapid submission check
     * 5. User historical reliability weighting
     */
    static verifyUpdate(update) {
        const db = getDb();
        let confidenceScore = 0.50;
        const notes = [];
        const checks = [];

        // Check if demo simulation mode is explicitly enabled
        const isDemo = !!update.is_demo;

        // 1. Anti-Spam Check (Duplicate submission in < 25 seconds)
        const spamCheck = this.checkAntiSpam(update);
        if (spamCheck.isSpam) {
            confidenceScore = 0.1;
            notes.push(spamCheck.note);
            checks.push({ name: 'Anti-Spam Rate Limiter', passed: false, details: spamCheck.note });

            const result = {
                confidenceScore: 0.1,
                status: 'rejected',
                isVerified: false,
                distanceToStopMeters: null,
                distanceToBusMeters: null,
                checks,
                rejectionReason: spamCheck.note
            };
            this.recordVerificationInDb(update.id, result);
            return result;
        }
        checks.push({ name: 'Anti-Spam Rate Limiter', passed: true, details: 'Action within normal rate limits' });

        // 2. GPS Proximity Check (Stop & Bus)
        const gpsCheck = this.checkGPSAndBusProximity(update, isDemo);
        confidenceScore += gpsCheck.adjustment;
        notes.push(gpsCheck.note);
        checks.push({
            name: 'GPS Geofence Validation',
            passed: gpsCheck.verified,
            details: gpsCheck.note,
            distanceStop: gpsCheck.distanceStopMeters,
            distanceBus: gpsCheck.distanceBusMeters
        });

        // 3. Velocity / Anti-Teleportation Check
        const velocityCheck = this.checkVelocityPlausibility(update);
        confidenceScore += velocityCheck.adjustment;
        notes.push(velocityCheck.note);
        checks.push({ name: 'Travel Velocity Plausibility', passed: velocityCheck.passed, details: velocityCheck.note });

        // 4. Route & Trip Sequence Check
        const routeCheck = this.checkRouteConsistency(update);
        confidenceScore += routeCheck.adjustment;
        notes.push(routeCheck.note);
        checks.push({ name: 'Trip & Route Sequence Alignment', passed: routeCheck.passed, details: routeCheck.note });

        // 5. User Reliability History Factor
        const reliabilityScore = this.getUserReliabilityFactor(update.user_id);
        confidenceScore += reliabilityScore.adjustment;
        notes.push(reliabilityScore.note);
        checks.push({ name: 'User Reliability Trust Factor', passed: reliabilityScore.score >= 0.5, details: reliabilityScore.note });

        // Clamp confidence between 0 and 1
        confidenceScore = Math.max(0.05, Math.min(0.99, Math.round(confidenceScore * 100) / 100));

        // Strict Verification Thresholds:
        // Must have valid GPS within radius and confidence >= 0.65 to be VERIFIED
        let status = 'pending';
        let isVerified = false;
        let rejectionReason = null;

        if (confidenceScore >= 0.65 && (gpsCheck.verified || isDemo)) {
            status = 'verified';
            isVerified = true;
        } else if (confidenceScore < 0.40 || (!gpsCheck.verified && !isDemo && gpsCheck.distanceStopMeters > 800)) {
            status = 'rejected';
            isVerified = false;
            rejectionReason = gpsCheck.distanceStopMeters > 350
                ? `You are ${gpsCheck.distanceStopMeters}m away from this stop/bus (maximum allowed is 350m perimeter). Points withheld.`
                : 'Check-in failed integrity and location verification checks.';
        } else {
            status = 'pending';
            isVerified = false;
            rejectionReason = 'Marginal proximity to stop/bus. Check-in placed in queue for crowd cross-verification.';
        }

        const result = {
            confidenceScore,
            status,
            isVerified,
            distanceToStopMeters: gpsCheck.distanceStopMeters,
            distanceToBusMeters: gpsCheck.distanceBusMeters,
            allowedPerimeterMeters: Math.round(this.MAX_GEOFENCE_DISTANCE_KM * 1000),
            checks,
            rejectionReason,
            notes
        };

        this.recordVerificationInDb(update.id, result);
        return result;
    }

    /**
     * Check if user is spamming identical updates in rapid succession
     */
    static checkAntiSpam(update) {
        if (!update.user_id || !update.trip_id) return { isSpam: false };

        const db = getDb();
        const recentUpdates = db.prepare(`
            SELECT timestamp FROM user_updates 
            WHERE user_id = ? AND trip_id = ? AND update_type = ? AND id != ?
            ORDER BY timestamp DESC LIMIT 1
        `).all(update.user_id, update.trip_id, update.update_type, update.id || '');

        if (recentUpdates && recentUpdates.length > 0) {
            const lastTime = new Date(recentUpdates[0].timestamp).getTime();
            const now = new Date(update.timestamp || Date.now()).getTime();
            const diffSeconds = (now - lastTime) / 1000;

            if (diffSeconds < 25) {
                return { isSpam: true, note: `Cooldown active: please wait ${Math.ceil(25 - diffSeconds)}s before submitting another update.` };
            }
        }

        return { isSpam: false };
    }

    /**
     * Check GPS proximity against both Stop coordinates and Bus live telemetry
     */
    static checkGPSAndBusProximity(update, isDemo = false) {
        if (isDemo) {
            return {
                adjustment: 0.35,
                note: 'Demo Simulated Location (High-Accuracy Verified for testing)',
                verified: true,
                distanceStopMeters: 38,
                distanceBusMeters: 62
            };
        }

        if (!update.latitude || !update.longitude) {
            return {
                adjustment: -0.40,
                note: 'No device GPS coordinates provided. Physical check-in required.',
                verified: false,
                distanceStopMeters: null,
                distanceBusMeters: null
            };
        }

        const db = getDb();
        let distanceStopKm = 999;
        let distanceBusKm = 999;

        // 1. Check Stop Proximity
        if (update.stop_id) {
            const stop = db.prepare('SELECT latitude, longitude, name FROM stops WHERE id = ?').get(update.stop_id);
            if (stop) {
                distanceStopKm = this.calculateDistance(update.latitude, update.longitude, stop.latitude, stop.longitude);
            }
        }

        // 2. Check Bus Proximity
        if (update.trip_id) {
            const trip = db.prepare(`
                SELECT b.current_latitude, b.current_longitude, b.bus_number 
                FROM trips t JOIN buses b ON t.bus_id = b.id 
                WHERE t.id = ?
            `).get(update.trip_id);

            if (trip && trip.current_latitude && trip.current_longitude) {
                distanceBusKm = this.calculateDistance(update.latitude, update.longitude, trip.current_latitude, trip.current_longitude);
            }
        }

        const minDistanceKm = Math.min(distanceStopKm, distanceBusKm);
        const distanceStopMeters = Math.round(distanceStopKm * 1000);
        const distanceBusMeters = Math.round(distanceBusKm * 1000);

        if (minDistanceKm <= this.OPTIMAL_GEOFENCE_DISTANCE_KM) { // Within 150m
            return {
                adjustment: 0.35,
                note: `GPS Verified: ${Math.min(distanceStopMeters, distanceBusMeters)}m from target perimeter (Excellent match)`,
                verified: true,
                distanceStopMeters,
                distanceBusMeters
            };
        } else if (minDistanceKm <= this.MAX_GEOFENCE_DISTANCE_KM) { // Within 350m
            return {
                adjustment: 0.15,
                note: `GPS Acceptable: ${Math.min(distanceStopMeters, distanceBusMeters)}m from target perimeter (Within 350m)`,
                verified: true,
                distanceStopMeters,
                distanceBusMeters
            };
        } else if (minDistanceKm <= 0.8) { // 350m - 800m
            return {
                adjustment: -0.15,
                note: `GPS Marginal: ${Math.min(distanceStopMeters, distanceBusMeters)}m away (Outside 350m geofence perimeter)`,
                verified: false,
                distanceStopMeters,
                distanceBusMeters
            };
        } else { // > 800m
            return {
                adjustment: -0.45,
                note: `GPS Out of Range: ${Math.min(distanceStopMeters, distanceBusMeters)}m away from stop/bus (Verification Failed)`,
                verified: false,
                distanceStopMeters,
                distanceBusMeters
            };
        }
    }

    /**
     * Check if user physically teleported between consecutive updates
     */
    static checkVelocityPlausibility(update) {
        if (!update.user_id || !update.latitude || !update.longitude) {
            return { adjustment: 0, passed: true, note: 'Standard velocity profile' };
        }

        const db = getDb();
        const prevUpdate = db.prepare(`
            SELECT latitude, longitude, timestamp FROM user_updates 
            WHERE user_id = ? AND latitude IS NOT NULL AND id != ?
            ORDER BY timestamp DESC LIMIT 1
        `).all(update.user_id, update.id || '');

        if (prevUpdate && prevUpdate.length > 0 && prevUpdate[0].latitude) {
            const p = prevUpdate[0];
            const distKm = this.calculateDistance(update.latitude, update.longitude, p.latitude, p.longitude);
            const timeHours = Math.abs(new Date(update.timestamp || Date.now()) - new Date(p.timestamp)) / (1000 * 3600);

            if (timeHours > 0.001) {
                const speedKmh = distKm / timeHours;
                if (speedKmh > 130) {
                    return {
                        adjustment: -0.40,
                        passed: false,
                        note: `Unrealistic travel velocity detected (${Math.round(speedKmh)} km/h between locations)`
                    };
                }
            }
        }

        return { adjustment: 0.05, passed: true, note: 'Travel velocity within physical limits' };
    }

    /**
     * Check if the update is consistent with the route and trip progress
     */
    static checkRouteConsistency(update) {
        const db = getDb();

        if (!update.stop_id || !update.trip_id) {
            return { adjustment: 0, passed: true, note: 'Stop reference neutral' };
        }

        const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(update.trip_id);
        if (!trip) return { adjustment: -0.1, passed: false, note: 'Trip not found' };

        const routeStop = db.prepare(`
            SELECT * FROM route_stops WHERE route_id = ? AND stop_id = ?
        `).get(trip.route_id, update.stop_id);

        if (!routeStop) {
            return { adjustment: -0.35, passed: false, note: 'Reported stop is not on this active route' };
        }

        const stopDiff = routeStop.sequence_order - trip.current_stop_index;
        if (stopDiff >= -1 && stopDiff <= 3) {
            return { adjustment: 0.10, passed: true, note: 'Stop sequence aligns with real-time bus progress' };
        } else if (stopDiff < -2) {
            return { adjustment: -0.20, passed: false, note: 'Stop was already passed long ago by bus' };
        } else {
            return { adjustment: -0.15, passed: false, note: 'Stop is too far ahead in future sequence' };
        }
    }

    /**
     * Get user's reliability factor based on verified history
     */
    static getUserReliabilityFactor(userId) {
        const db = getDb();
        const user = db.prepare('SELECT reliability_score, total_contributions FROM users WHERE id = ?').get(userId);

        if (!user) return { adjustment: 0, score: 0.5, note: 'New commuter profile' };

        if (user.total_contributions < 3) {
            return { adjustment: 0, score: user.reliability_score || 0.5, note: 'New commuter (standard baseline trust)' };
        }

        if (user.reliability_score >= 0.85) {
            return { adjustment: 0.15, score: user.reliability_score, note: `Trusted Commuter (${Math.round(user.reliability_score * 100)}% Verified History)` };
        } else if (user.reliability_score >= 0.60) {
            return { adjustment: 0.05, score: user.reliability_score, note: `Good standing (${Math.round(user.reliability_score * 100)}% Verified History)` };
        } else if (user.reliability_score >= 0.40) {
            return { adjustment: -0.05, score: user.reliability_score, note: 'Moderate standing' };
        } else {
            return { adjustment: -0.20, score: user.reliability_score, note: 'Low historical trust rating' };
        }
    }

    /**
     * Cross-verify with subsequent updates from other commuters
     */
    static crossVerifyWithSubsequent(updateId) {
        const db = getDb();
        const update = db.prepare('SELECT * FROM user_updates WHERE id = ?').get(updateId);
        if (!update || update.verification_status === 'verified') return;

        const subsequentUpdates = db.prepare(`
            SELECT * FROM user_updates 
            WHERE trip_id = ? AND id != ? AND user_id != ?
            AND timestamp > ? AND timestamp < datetime(?, '+10 minutes')
            AND verification_status != 'rejected'
        `).all(update.trip_id, updateId, update.user_id, update.timestamp, update.timestamp);

        if (!subsequentUpdates || subsequentUpdates.length === 0) return;

        let agreementCount = 0;
        let totalComparable = 0;

        for (const subsequent of subsequentUpdates) {
            if (update.crowd_level && subsequent.crowd_level) {
                totalComparable++;
                if (update.crowd_level === subsequent.crowd_level) {
                    agreementCount++;
                } else {
                    const levels = ['low', 'medium', 'high'];
                    const diff = Math.abs(levels.indexOf(update.crowd_level) - levels.indexOf(subsequent.crowd_level));
                    if (diff === 1) agreementCount += 0.5;
                }
            }
        }

        if (totalComparable > 0) {
            const agreementRate = agreementCount / totalComparable;
            if (agreementRate >= 0.6) {
                const newConfidence = Math.min(0.95, update.confidence_score + 0.25);
                db.prepare(`
                    UPDATE user_updates 
                    SET confidence_score = ?, verification_status = 'verified'
                    WHERE id = ?
                `).run(newConfidence, updateId);

                // Unlock pending points
                const GamificationEngine = require('./gamification');
                GamificationEngine.verifyPoints(updateId);
            }
        }
    }

    /**
     * Update user reliability score in database
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

        const verifiedRate = stats.verified / stats.total;
        const reliabilityScore = (verifiedRate * 0.7) + ((stats.avg_confidence || 0.5) * 0.3);

        db.prepare('UPDATE users SET reliability_score = ?, total_contributions = ? WHERE id = ?')
            .run(Math.round(reliabilityScore * 100) / 100, stats.total, userId);
    }

    /**
     * Record verification results in the DB
     */
    static recordVerificationInDb(updateId, result) {
        if (!updateId) return;
        try {
            const db = getDb();
            db.prepare(`
                UPDATE user_updates 
                SET confidence_score = ?, verification_status = ?, verification_notes = ?,
                    gps_verified = ?
                WHERE id = ?
            `).run(result.confidenceScore, result.status, result.notes.join('; '), result.isVerified ? 1 : 0, updateId);
        } catch (e) {}
    }

    /**
     * Calculate Haversine distance in km
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
