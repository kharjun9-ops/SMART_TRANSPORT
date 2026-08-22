/**
 * TransitIQ Notifications and Real-time WebSocket Client
 */
const NotificationUtils = {
    ws: null,
    reconnectInterval: 4000,

    initWebSocket() {
        const token = API.getToken();
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws${token ? `?token=${token}` : ''}`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('📡 Real-time connection established');
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (e) {
                    console.error('Failed to parse WS message', e);
                }
            };

            this.ws.onclose = () => {
                setTimeout(() => this.initWebSocket(), this.reconnectInterval);
            };

            this.ws.onerror = (err) => {
                console.error('WS Error:', err);
                this.ws.close();
            };
        } catch (e) {
            console.error('Failed to initialize WebSocket', e);
        }
    },

    handleMessage(msg) {
        if (msg.event === 'notification') {
            const n = msg.data;
            this.showToast(n.title, n.message, n.type || 'info');
            this.updateBadge();
            // If active view has live refresher
            if (window.app && window.app.currentView === 'notifications') {
                window.app.refreshCurrentView();
            }
        }
    },

    showToast(title, message, type = 'info', duration = 4500) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info',
            bus_approaching: 'directions_bus',
            delay: 'schedule',
            destination_approaching: 'location_on',
            badge_earned: 'emoji_events',
            points_earned: 'stars'
        };

        const icon = icons[type] || 'notifications';

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="material-symbols-outlined" style="color: #adc6ff; font-size: 22px;">${icon}</span>
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 0.88rem; color: #dce2f7;">${title}</div>
                <div class="toast-message" style="color: #c2c6d6; margin-top: 2px; font-size: 0.8rem;">${message}</div>
            </div>
            <button onclick="this.parentElement.remove()" style="color: #8c909f; padding: 4px; background: none; border: none; cursor: pointer;">
                <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
            </button>
        `;

        container.appendChild(toast);

        // Haptic feedback if supported on mobile
        if ('vibrate' in navigator) {
            navigator.vibrate([40, 60, 40]);
        }

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    async updateBadge() {
        if (!API.isAuthenticated()) {
            const badge = document.getElementById('notification-badge');
            if (badge) badge.style.display = 'none';
            return;
        }

        try {
            const res = await API.getNotifications(true);
            const badge = document.getElementById('notification-badge');
            if (badge) {
                if (res.unreadCount > 0) {
                    badge.textContent = res.unreadCount > 9 ? '9+' : res.unreadCount;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (e) {}
    }
};
