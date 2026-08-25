/**
 * Lumina Transit - Passenger Profile & Notifications View
 * High-Contrast Glassmorphism HUD System with Language & Theme Settings
 */
const ProfileView = {
    user: null,
    notifications: [],

    async render() {
        return `
            <div class="view-fade-in pt-[80px] px-container-margin pb-[100px] max-w-xl mx-auto space-y-4" id="profile-container">
                <div class="glass-panel rounded-transit p-8 text-center text-on-surface-variant">
                    <span class="material-symbols-outlined animate-spin text-3xl text-primary mb-2">sync</span>
                    <p class="text-sm">${I18n.t('profile.loading')}</p>
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
            this.user = null;
            this.notifications = [];
            this.renderGuestUI(container);
            return;
        }

        try {
            const [profileRes, notificationsRes] = await Promise.all([
                API.getProfile(),
                API.getNotifications()
            ]);

            this.user = profileRes.user;
            this.notifications = notificationsRes.notifications || [];
            this.renderProfileContent();
        } catch (e) {
            if (this.user) {
                this.renderProfileContent();
            } else {
                container.innerHTML = `
                    <div class="glass-panel rounded-2xl p-6 text-center">
                        <span class="material-symbols-outlined text-3xl text-error mb-2">error</span>
                        <p class="text-xs text-on-surface-variant">${e.message}</p>
                    </div>
                `;
            }
        }
    },

    renderGuestUI(container) {
        container.innerHTML = `
            <div class="glass-panel rounded-2xl p-8 text-center shadow-2xl">
                <div class="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mx-auto mb-3 text-outline">
                    <span class="material-symbols-outlined text-3xl">account_circle</span>
                </div>
                <h3 class="font-headline-md text-lg font-bold text-on-surface">${I18n.t('profile.guest')}</h3>
                <p class="text-xs text-on-surface-variant mt-1.5 mb-5 max-w-xs mx-auto">
                    ${I18n.t('profile.guest_desc')}
                </p>
                <button class="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-lg hover:bg-primary-fixed active:scale-95 transition-all" onclick="window.app.showAuthModal()">
                    ${I18n.t('profile.sign_in_create')}
                </button>
            </div>
        `;
    },

    setLanguage(lang) {
        console.log('[ProfileView] setLanguage called with:', lang);
        
        // Force set the language directly (bulletproof)
        if (window.I18n) {
            I18n.currentLang = lang;
            localStorage.setItem('lumina_lang', lang);
            if (typeof I18n.setLang === 'function') {
                I18n.setLang(lang);
            }
        }
        
        console.log('[ProfileView] I18n.currentLang is now:', window.I18n ? I18n.currentLang : 'NO I18n');
        
        // Update nav labels
        if (window.app && typeof window.app.updateNavLabels === 'function') {
            window.app.updateNavLabels();
        }
        
        // Show toast in the SELECTED language
        const toasts = {
            en: { title: 'Language changed', msg: 'English selected' },
            kn: { title: 'ಭಾಷೆ ಬದಲಾಯಿಸಲಾಗಿದೆ', msg: 'ಕನ್ನಡ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ' },
            hi: { title: 'भाषा बदल दी गई', msg: 'हिन्दी चयनित' }
        };
        const t = toasts[lang] || toasts.en;
        if (window.NotificationUtils) {
            NotificationUtils.showToast(t.title, t.msg, 'success', 2500);
        }
        
        // Re-render the profile content
        this.renderProfileContent();
    },

    renderProfileContent() {
        const container = document.getElementById('profile-container');
        if (!container) return;

        if (!API.isAuthenticated()) {
            this.renderGuestUI(container);
            return;
        }

        const user = this.user || { name: 'Karthik Rao', email: 'karthik@demo.in', points: 1250, level: 'Level 4: Contributor' };
        const currentLang = I18n.getLang();

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
                                🚶 ${I18n.translateDynamic(user.level || 'Level 4: Contributor')}
                            </span>
                            <span class="text-xs font-bold text-tertiary">
                                ${(user.points || 0).toLocaleString()} ${I18n.t('ranks.pts')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Language Selection Settings (Instant Response) -->
            <div class="glass-panel rounded-2xl p-4 shadow-lg space-y-3">
                <div class="flex items-center justify-between">
                    <h4 class="font-headline-md text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-primary text-base">translate</span>
                        ${I18n.t('profile.language')} / ಭಾಷೆ / भाषा
                    </h4>
                    <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-primary/20 text-primary border border-primary/30">
                        ${I18n.getLangName()}
                    </span>
                </div>
                <p class="text-[11px] text-on-surface-variant">${I18n.t('profile.language_desc')}</p>
                
                <div class="grid grid-cols-3 gap-2 pt-1">
                    <!-- English Option -->
                    <button 
                        type="button"
                        onclick="window.switchLang('en')"
                        class="p-3 rounded-xl border ${currentLang === 'en' ? 'border-primary bg-primary/20 text-primary shadow-[0_0_12px_rgba(173,198,255,0.3)] font-bold ring-2 ring-primary/40' : 'border-white/10 bg-surface-container/60 text-on-surface-variant hover:bg-surface-container-high'} flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer active:scale-95"
                    >
                        <span class="text-xl">🇬🇧</span>
                        <div>
                            <div class="text-xs font-bold text-on-surface">English</div>
                            <div class="text-[10px] ${currentLang === 'en' ? 'text-primary font-bold' : 'text-on-surface-variant'}">${currentLang === 'en' ? '✓ Active' : 'Default'}</div>
                        </div>
                    </button>

                    <!-- Kannada Option -->
                    <button 
                        type="button"
                        onclick="window.switchLang('kn')"
                        class="p-3 rounded-xl border ${currentLang === 'kn' ? 'border-primary bg-primary/20 text-primary shadow-[0_0_12px_rgba(173,198,255,0.3)] font-bold ring-2 ring-primary/40' : 'border-white/10 bg-surface-container/60 text-on-surface-variant hover:bg-surface-container-high'} flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer active:scale-95"
                    >
                        <span class="text-xl">🇮🇳</span>
                        <div>
                            <div class="text-xs font-bold text-on-surface font-['Noto_Sans_Kannada']">ಕನ್ನಡ</div>
                            <div class="text-[10px] ${currentLang === 'kn' ? 'text-primary font-bold' : 'text-on-surface-variant'}">${currentLang === 'kn' ? '✓ ಸಕ್ರಿಯ' : 'Kannada'}</div>
                        </div>
                    </button>

                    <!-- Hindi Option -->
                    <button 
                        type="button"
                        onclick="window.switchLang('hi')"
                        class="p-3 rounded-xl border ${currentLang === 'hi' ? 'border-primary bg-primary/20 text-primary shadow-[0_0_12px_rgba(173,198,255,0.3)] font-bold ring-2 ring-primary/40' : 'border-white/10 bg-surface-container/60 text-on-surface-variant hover:bg-surface-container-high'} flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer active:scale-95"
                    >
                        <span class="text-xl">🇮🇳</span>
                        <div>
                            <div class="text-xs font-bold text-on-surface font-['Noto_Sans_Devanagari']">हिन्दी</div>
                            <div class="text-[10px] ${currentLang === 'hi' ? 'text-primary font-bold' : 'text-on-surface-variant'}">${currentLang === 'hi' ? '✓ सक्रिय' : 'Hindi'}</div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Live System Alerts & Notifications -->
            <div class="glass-panel rounded-2xl p-4 shadow-lg">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-headline-md text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-primary text-base">notifications</span>
                        ${I18n.t('profile.notifications')}
                    </h4>
                    <button class="text-xs text-primary font-semibold hover:underline" onclick="ProfileView.markAllRead()">
                        ${I18n.t('profile.mark_all_read')}
                    </button>
                </div>

                <div class="space-y-2">
                    ${this.renderNotificationsList()}
                </div>
            </div>

            <!-- Display & Theme Settings -->
            <div class="glass-panel rounded-2xl p-4 shadow-lg space-y-3">
                <div class="flex items-center justify-between">
                    <h4 class="font-headline-md text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-primary text-base">palette</span>
                        ${I18n.t('profile.theme')}
                    </h4>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary-container/30 text-primary theme-current-badge">
                        ${(window.ThemeUtils && ThemeUtils.isLight()) ? I18n.t('profile.theme_light_label') : I18n.t('profile.theme_dark_label')}
                    </span>
                </div>
                
                <div class="grid grid-cols-2 gap-2.5 pt-1">
                    <!-- Google Maps Light Mode Option -->
                    <button 
                        type="button"
                        onclick="ThemeUtils.setTheme('light'); ProfileView.renderProfileContent();" 
                        class="p-3 rounded-xl border ${(window.ThemeUtils && ThemeUtils.isLight()) ? 'border-primary bg-primary-container/30 text-primary shadow-sm font-bold ring-2 ring-primary/40' : 'border-white/10 bg-surface-container/60 text-on-surface-variant hover:bg-surface-container-high'} flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer active:scale-95"
                    >
                        <div class="w-8 h-8 rounded-full ${(window.ThemeUtils && ThemeUtils.isLight()) ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'} flex items-center justify-center">
                            <span class="material-symbols-outlined text-lg">light_mode</span>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-on-surface">${I18n.t('profile.light_mode')}</div>
                            <div class="text-[10px] text-on-surface-variant">${I18n.t('profile.light_desc')}</div>
                        </div>
                    </button>

                    <!-- Lumina Dark HUD Option -->
                    <button 
                        type="button"
                        onclick="ThemeUtils.setTheme('dark'); ProfileView.renderProfileContent();" 
                        class="p-3 rounded-xl border ${(window.ThemeUtils && !ThemeUtils.isLight()) ? 'border-primary bg-primary-container/30 text-primary shadow-sm font-bold ring-2 ring-primary/40' : 'border-white/10 bg-surface-container/60 text-on-surface-variant hover:bg-surface-container-high'} flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer active:scale-95"
                    >
                        <div class="w-8 h-8 rounded-full ${(window.ThemeUtils && !ThemeUtils.isLight()) ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'} flex items-center justify-center">
                            <span class="material-symbols-outlined text-lg">dark_mode</span>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-on-surface">${I18n.t('profile.dark_mode')}</div>
                            <div class="text-[10px] text-on-surface-variant">${I18n.t('profile.dark_desc')}</div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Account & Sign Out -->
            <div class="glass-panel rounded-2xl p-4 shadow-lg space-y-3">
                <h4 class="font-headline-md text-xs font-bold text-on-surface">${I18n.t('profile.account_settings')}</h4>
                <p class="text-[11px] text-on-surface-variant">${I18n.t('profile.privacy_note')}</p>
                <button 
                    class="w-full py-3 rounded-xl bg-error/20 border border-error/30 text-error hover:bg-error/30 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                    onclick="window.app.logout()"
                >
                    <span class="material-symbols-outlined text-base">logout</span> ${I18n.t('profile.sign_out')}
                </button>
            </div>
        `;
    },

    renderNotificationsList() {
        if (!this.notifications || this.notifications.length === 0) {
            return `<div class="text-on-surface-variant text-xs text-center py-4">${I18n.t('profile.no_notifications')}</div>`;
        }

        return this.notifications.map(n => {
            const isUnread = !n.is_read;
            const translatedTitle = I18n.translateDynamic(n.title);
            const translatedMessage = I18n.translateDynamic(n.message);
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
                            <h5 class="text-xs font-bold ${isUnread ? 'text-primary' : 'text-on-surface'}">${translatedTitle}</h5>
                            <span class="text-[10px] text-on-surface-variant">${new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p class="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">${translatedMessage}</p>
                    </div>
                </div>
            `;
        }).join('');
    },

    async markRead(id) {
        try {
            await API.markNotificationRead(id);
            const n = this.notifications.find(item => item.id === id);
            if (n) n.is_read = 1;
            this.renderProfileContent();
            NotificationUtils.updateBadge();
        } catch (e) {}
    },

    async markAllRead() {
        try {
            await API.markAllNotificationsRead();
            this.notifications.forEach(n => n.is_read = 1);
            this.renderProfileContent();
            NotificationUtils.updateBadge();
            NotificationUtils.showToast('Updated', I18n.t('toast.all_read'), 'info');
        } catch (e) {}
    }
};
