/**
 * TransitIQ API Client
 */
const API = {
    baseUrl: '',

    getToken() {
        return localStorage.getItem('transitiq_token');
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('transitiq_token', token);
        } else {
            localStorage.removeItem('transitiq_token');
        }
    },

    getUser() {
        const userStr = localStorage.getItem('transitiq_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    setUser(user) {
        if (user) {
            localStorage.setItem('transitiq_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('transitiq_user');
        }
    },

    clearAuth() {
        localStorage.removeItem('transitiq_token');
        localStorage.removeItem('transitiq_user');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/api${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Handle FormData (don't set content-type for multipart)
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 12000);

        try {
            const res = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
                    this.clearAuth();
                    if (window.app) window.app.showAuthModal();
                }
                throw new Error(data.error || `Request failed with status ${res.status}`);
            }

            return data;
        } catch (err) {
            clearTimeout(timeoutId);
            console.error(`API Error [${endpoint}]:`, err);
            throw err;
        }
    },

    // Auth
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(data.token);
        this.setUser(data.user);
        return data;
    },

    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        this.setToken(data.token);
        this.setUser(data.user);
        return data;
    },

    async getProfile() {
        return this.request('/auth/profile');
    },

    // Routes
    async getRoutes() {
        return this.request('/routes');
    },

    async searchRoutes(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(`/routes/search?${qs}`);
    },

    async getRoute(id) {
        return this.request(`/routes/${id}`);
    },

    // Stops
    async getStops() {
        return this.request('/trips/stops/all');
    },

    // Trips
    async getActiveTrips() {
        return this.request('/trips/active');
    },

    async getTrip(id) {
        return this.request(`/trips/${id}`);
    },

    async getTripTrack(id) {
        return this.request(`/trips/${id}/track`);
    },

    async getNearbyStops(lat, lng, radius = 2) {
        return this.request(`/trips/stops/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    },

    async getWaitlistForecast(tripId) {
        return this.request(`/trips/${tripId}/waitlist-forecast`);
    },

    async joinWaitlist(stopId, routeId, tripId = null, destinationStopId = null, lat = null, lng = null, isDemo = false) {
        return this.request('/trips/waitlist/join', {
            method: 'POST',
            body: JSON.stringify({ stopId, routeId, tripId, destinationStopId, latitude: lat, longitude: lng, isDemo })
        });
    },

    async leaveWaitlist(stopId, tripId = null) {
        return this.request('/trips/waitlist/leave', {
            method: 'POST',
            body: JSON.stringify({ stopId, tripId })
        });
    },

    async getMyWaitlists() {
        return this.request('/trips/waitlist/my');
    },

    async setDestinationAlarm(tripId, destinationStopId) {
        return this.request(`/trips/${tripId}/destination-alarm`, {
            method: 'POST',
            body: JSON.stringify({ destinationStopId })
        });
    },

    // Updates
    async reportBoarding(tripId, stopId, lat, lng, isDemo = false) {
        return this.request('/updates/board', {
            method: 'POST',
            body: JSON.stringify({ tripId, stopId, latitude: lat, longitude: lng, isDemo })
        });
    },

    async reportDeboarding(tripId, stopId, lat, lng, isDemo = false) {
        return this.request('/updates/deboard', {
            method: 'POST',
            body: JSON.stringify({ tripId, stopId, latitude: lat, longitude: lng, isDemo })
        });
    },

    async reportCrowd(tripId, stopId, crowdLevel, lat, lng, isDemo = false) {
        return this.request('/updates/crowd', {
            method: 'POST',
            body: JSON.stringify({ tripId, stopId, crowdLevel, latitude: lat, longitude: lng, isDemo })
        });
    },

    async getTripUpdates(tripId) {
        return this.request(`/updates/trip/${tripId}`);
    },

    // Gamification
    async getGamificationProfile() {
        return this.request('/gamification/profile');
    },

    async getLeaderboard(limit = 20) {
        return this.request(`/gamification/leaderboard?limit=${limit}`);
    },

    async getBadges() {
        return this.request('/gamification/badges');
    },

    // Complaints
    async getComplaintCategories() {
        return this.request('/complaints/categories/list');
    },

    async submitComplaint(formData) {
        return this.request('/complaints', {
            method: 'POST',
            body: formData
        });
    },

    async getComplaints() {
        return this.request('/complaints');
    },

    // Notifications
    async getNotifications(unreadOnly = false) {
        return this.request(`/notifications?unread=${unreadOnly}`);
    },

    async markNotificationRead(id) {
        return this.request(`/notifications/${id}/read`, { method: 'PUT' });
    },

    async markAllNotificationsRead() {
        return this.request('/notifications/read-all', { method: 'PUT' });
    }
};
