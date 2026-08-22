/**
 * Lumina Transit - Passenger Profile & Notifications View
 * High-Contrast Glassmorphism HUD System
 */
const ProfileView = {
    notifications: [],

    async render() {
        return `
            <div class="view-fade-in pt-[80px] px-container-margin pb-[100px] max-w-xl mx-auto space-y-4" id="profile-container">
                <div class="glass-panel rounded-transit p-8 text-center text-on-surface-variant">
                    <span class="material-symbols-outlined animate-spin text-3xl text-primary mb-2">sync</span>
                    <p class="text-sm">Loading passenger profile...</p>
                </div>
            </div>
        `;
    },

    async init() {
        await this.loadProfile();
    },

    async loadProfile() {
        const container = document.getElementById('profile-container');
        if (!container) return;

        if (!API.isAuthenticated()) {
            container.innerHTML = `
                <div class="glass-panel rounded-2xl p-8 text-center shadow-2xl">
                    <div class="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mx-auto mb-3 text-outline">
                        <span class="material-symbols-outlined text-3xl">account_circle</span>
                    </div>
                    <h3 class="font-headline-md text-lg font-bold text-on-surface">Guest Commuter</h3>
                    <p class="text-xs text-on-surface-variant mt-1.5 mb-5 max-w-xs mx-auto">
                        Sign in to access personalized journey telemetry, real-time proactive alerts, and badge achievements.
                    </p>
                    <button class="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-lg hover:bg-primary-fixed active:scale-95 transition-all" onclick="window.app.showAuthModal()">
                        Sign In / Create Account
                    </button>
                </div>
            `;
            return;
        }

        try {
            const [profileRes, notificationsRes] = await Promise.all([
                API.getProfile(),
                API.getNotifications()
            ]);

            const user = profileRes.user;
            this.notifications = notificationsRes.notifications || [];

            container.innerHTML = `
                <!-- Passenger Identity Card -->
                <div class="glass-panel rounded-2xl p-5 shadow-2xl relative overflow-hidden border border-white/10">
                    <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none"></div>
                    <div class="flex items-center gap-4 relative z-10">
                        <div class="w-16 h-16 rounded-full border-2 border-primary overflow-hidden flex items-center justify-center bg-primary-container/20 text-primary shadow-[0_0_15px_rgba(173,198,255,0.4)]">
                            <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">person</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-headline-md text-base font-bold text-on-surface truncate">${user.name}</h3>
                            <p class="text-xs text-on-surface-variant truncate">${user.email}</p>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="bg-primary/20 text-primary border border-primary/30 text-[10px] px-2.5 py-0.5 rounded-full font-semibold">
                                    🚶 ${user.level || 'Level 4: Contributor'}
                                </span>
                                <span class="text-xs font-bold text-tertiary">
                                    ${(user.points || 0).toLocaleString()} pts
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Live System Alerts & Notifications -->
                <div class="glass-panel rounded-2xl p-4 shadow-lg">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-headline-md text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-primary text-base">notifications</span>
                            Notifications & Proactive Alerts
                        </h4>
                        <button class="text-xs text-primary font-semibold hover:underline" onclick="ProfileView.markAllRead()">
                            Mark All Read
                        </button>
                    </div>

                    <div class="space-y-2">
                        ${this.renderNotificationsList()}
                    </div>
                </div>

                <!-- Account & Sign Out -->
                <div class="glass-panel rounded-2xl p-4 shadow-lg space-y-3">
                    <h4 class="font-headline-md text-xs font-bold text-on-surface">Account Settings</h4>
                    <p class="text-[11px] text-on-surface-variant">Lumina Transit operates privacy-preserving, verified GPS passenger feedback.</p>
                    <button 
                        class="w-full py-3 rounded-xl bg-error/20 border border-error/30 text-error hover:bg-error/30 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                        onclick="window.app.logout()"
                    >
                        <span class="material-symbols-outlined text-base">logout</span> Sign Out
                    </button>
                </div>
            `;
        } catch (e) {
            container.innerHTML = `
                <div class="glass-panel rounded-2xl p-6 text-center">
                    <span class="material-symbols-outlined text-3xl text-error mb-2">error</span>
                    <p class="text-xs text-on-surface-variant">${e.message}</p>
                </div>
            `;
        }
    },

    renderNotificationsList() {
        if (!this.notifications || this.notifications.length === 0) {
            return `<div class="text-on-surface-variant text-xs text-center py-4">No notifications at the moment.</div>`;
        }

        return this.notifications.map(n => {
            const isUnread = !n.is_read;
            return `
                <div 
                    class="p-3 rounded-xl ${isUnread ? 'bg-primary-container/15 border border-primary/30 shadow-md' : 'bg-surface-container border border-white/5'} flex items-start gap-3 cursor-pointer hover:bg-surface-container-high transition-all"
                    onclick="ProfileView.markRead('${n.id}')"
                >
                    <div class="w-8 h-8 rounded-full ${isUnread ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-outline'} flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span class="material-symbols-outlined text-base">${n.type === 'delay' ? 'schedule' : (n.type === 'destination_approaching' ? 'location_on' : 'stars')}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <h5 class="text-xs font-bold ${isUnread ? 'text-primary' : 'text-on-surface'}">${n.title}</h5>
                            <span class="text-[10px] text-on-surface-variant">${new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p class="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">${n.message}</p>
                    </div>
                </div>
            `;
        }).join('');
    },

    async markRead(id) {
        try {
            await API.markNotificationRead(id);
            await this.loadProfile();
            NotificationUtils.updateBadge();
        } catch (e) {}
    },

    async markAllRead() {
        try {
            await API.markAllNotificationsRead();
            await this.loadProfile();
            NotificationUtils.updateBadge();
            NotificationUtils.showToast('Updated', 'All notifications marked as read', 'info');
        } catch (e) {}
    }
};
