/**
 * Lumina Transit - Main Controller & Navigation Router
 * Flow: First Page = Login/Welcome Screen -> Homepage (Bengaluru Location Map) -> Search Destination -> BMTC Transit Options
 */
const app = {
    currentView: 'home',
    currentParams: {},
    activeViewInstance: null,

    views: {
        auth: AuthView,
        home: HomeView,
        trips: TripsView,
        gamification: GamificationView,
        complaints: ComplaintsView,
        profile: ProfileView
    },

    async init() {
        if (window.ThemeUtils) {
            ThemeUtils.init();
        }

        const dismissLoading = () => {
            const loadingScreen = document.getElementById('loading-screen');
            const appContainer = document.getElementById('app');

            if (loadingScreen && loadingScreen.style.display !== 'none') {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    if (appContainer) appContainer.style.display = 'flex';
                }, 200);
            } else if (appContainer) {
                appContainer.style.display = 'flex';
            }
        };

        // First Page Rule: If not logged in, take user directly to Auth / Login screen!
        if (!API.isAuthenticated()) {
            dismissLoading();
            await this.navigate('auth');
        } else {
            // Validate the token quickly with 2.5s timeout (prevents Render cold-start hang)
            try {
                const profilePromise = API.getProfile();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
                await Promise.race([profilePromise, timeoutPromise]);

                dismissLoading();
                NotificationUtils.initWebSocket();
                NotificationUtils.updateBadge();
                await this.navigate('home');
            } catch (e) {
                dismissLoading();
                API.clearAuth();
                await this.navigate('auth');
            }
        }
    },

    async navigate(viewName, params = {}) {
        if (viewName === 'notifications') {
            viewName = 'profile';
        }

        // If user is not authenticated and trying to access inner views, send to auth
        if (!API.isAuthenticated() && viewName !== 'auth') {
            viewName = 'auth';
        }

        const view = this.views[viewName];
        if (!view) {
            console.error(`View ${viewName} not found`);
            return;
        }

        // Cleanup previous view if needed
        if (this.activeViewInstance && typeof this.activeViewInstance.destroy === 'function') {
            this.activeViewInstance.destroy();
        }

        this.currentView = viewName;
        this.currentParams = params;
        this.activeViewInstance = view;

        // Toggle TopAppBar & BottomNav visibility on Auth screen
        const topBar = document.getElementById('app-header');
        const bottomNav = document.getElementById('bottom-nav');
        const authScreen = document.getElementById('auth-screen');
        const mainContent = document.getElementById('main-content');

        if (viewName === 'auth') {
            // Show auth overlay, hide app shell
            if (topBar) topBar.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'none';
            if (authScreen) {
                authScreen.style.display = 'flex';
                authScreen.innerHTML = await view.render(params);
                if (typeof view.init === 'function') {
                    await view.init(params);
                }
            }
            if (mainContent) mainContent.innerHTML = '';
        } else {
            // Hide auth overlay, show app shell
            if (authScreen) {
                authScreen.style.display = 'none';
                authScreen.innerHTML = '';
            }
            if (topBar) topBar.style.display = 'flex';
            if (bottomNav) bottomNav.style.display = 'flex';
            this.updateNavActiveState(viewName);
            this.updateNavLabels();

            // Render HTML into main content
            if (mainContent) {
                mainContent.innerHTML = await view.render(params);
                if (typeof view.init === 'function') {
                    await view.init(params);
                }
            }
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'instant' });
    },

    updateNavLabels() {
        if (!window.I18n) return;
        const homeLabel = document.getElementById('nav-label-home');
        const tripsLabel = document.getElementById('nav-label-trips');
        const ranksLabel = document.getElementById('nav-label-ranks');
        const reportLabel = document.getElementById('nav-label-report');
        const profileLabel = document.getElementById('nav-label-profile');
        const titleHeader = document.getElementById('app-title-header');
        const langToggleLabel = document.getElementById('lang-toggle-label');

        if (homeLabel) homeLabel.textContent = I18n.t('nav.home');
        if (tripsLabel) tripsLabel.textContent = I18n.t('nav.trips');
        if (ranksLabel) ranksLabel.textContent = I18n.t('nav.ranks');
        if (reportLabel) reportLabel.textContent = I18n.t('nav.report');
        if (profileLabel) profileLabel.textContent = I18n.t('nav.profile');
        if (titleHeader) titleHeader.textContent = I18n.t('app.name');
        if (langToggleLabel) langToggleLabel.textContent = I18n.getLangShort();
    },

    setLanguage(lang) {
        if (typeof window.switchLang === 'function') {
            window.switchLang(lang);
        } else if (window.I18n) {
            I18n.currentLang = lang;
            localStorage.setItem('lumina_lang', lang);
            this.updateNavLabels();
            this.navigate(this.currentView, this.currentParams);
        }
    },

    cycleLanguage() {
        if (window.I18n) {
            const order = ['en', 'kn', 'hi'];
            const idx = order.indexOf(I18n.currentLang || 'en');
            const next = order[(idx + 1) % order.length];
            this.setLanguage(next);
        }
    },

    async refreshCurrentView() {
        if (this.activeViewInstance && typeof this.activeViewInstance.init === 'function') {
            await this.activeViewInstance.init(this.currentParams);
        }
    },

    viewTrip(tripId) {
        this.navigate('trips', { tripId });
    },

    updateNavActiveState(viewName) {
        document.querySelectorAll('#bottom-nav .nav-item').forEach(item => {
            const tabView = item.getAttribute('data-view');
            const icon = item.querySelector('.material-symbols-outlined');

            if (tabView === viewName) {
                item.className = 'nav-item flex flex-col items-center justify-center text-primary bg-primary-container/20 rounded-xl px-4 py-1 active:scale-90 transition-all w-16';
                if (icon) icon.style.fontVariationSettings = "'FILL' 1";
            } else {
                item.className = 'nav-item flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90 transition-transform px-4 py-1 w-16';
                if (icon) icon.style.fontVariationSettings = "'FILL' 0";
            }
        });
    },

    showModal(htmlContent) {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        if (overlay && content) {
            content.innerHTML = htmlContent;
            overlay.style.display = 'flex';
        }
    },

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.style.display = 'none';
    },

    showAuthModal() {
        this.navigate('auth');
    },

    closeAuthModal() {
        if (API.isAuthenticated()) {
            this.navigate('home');
        }
    },

    onAuthSuccess() {
        NotificationUtils.initWebSocket();
        NotificationUtils.updateBadge();
        this.navigate('home');
    },

    updateSidebarUser() {
        NotificationUtils.updateBadge();
    },

    logout() {
        API.clearAuth();
        NotificationUtils.showToast('Signed Out', 'You have been signed out of Lumina Transit Bengaluru.', 'info');
        this.navigate('auth');
    },

    showEmergencyModal() {
        const lat = window.HomeView?.userLocation?.lat || 12.9245;
        const lng = window.HomeView?.userLocation?.lng || 77.5180;
        const gpsString = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

        this.showModal(`
            <div class="glass-panel rounded-2xl p-5 max-w-md mx-auto shadow-2xl border-2 border-error/60 bg-surface-container-high space-y-4 animate-in">
                <!-- Header -->
                <div class="flex items-center justify-between border-b border-white/10 pb-3">
                    <div class="flex items-center gap-2.5">
                        <div class="w-10 h-10 rounded-xl bg-error/20 border border-error/40 text-error flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse">
                            <span class="material-symbols-outlined text-2xl font-bold">emergency</span>
                        </div>
                        <div>
                            <span class="text-[10px] uppercase font-extrabold tracking-wider text-error">EMERGENCY SOS RESPONSE</span>
                            <h3 class="font-bold text-base text-on-surface">Emergency Helplines</h3>
                        </div>
                    </div>
                    <button onclick="app.closeModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-on-surface text-xs cursor-pointer active:scale-90 transition-all">
                        <span class="material-symbols-outlined text-base">close</span>
                    </button>
                </div>

                <p class="text-xs text-on-surface-variant leading-relaxed">
                    Tap any emergency service below to <strong>directly dial from your phone app</strong>. Available 24/7.
                </p>

                <!-- Quick Direct Emergency Dial Buttons -->
                <div class="grid grid-cols-2 gap-2 pt-1">
                    <a href="tel:108" onclick="window.location.href='tel:108'" class="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg active:scale-95 transition-all text-center border border-white/20 cursor-pointer">
                        <span class="text-base">🚑</span>
                        <span>AMBULANCE 108</span>
                    </a>
                    <a href="tel:112" onclick="window.location.href='tel:112'" class="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg active:scale-95 transition-all text-center border border-white/20 cursor-pointer">
                        <span class="text-base">👮</span>
                        <span>POLICE 112</span>
                    </a>
                </div>

                <!-- Emergency Phone Call Cards -->
                <div class="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    <!-- 108 Ambulance -->
                    <a href="tel:108" onclick="window.location.href='tel:108'" class="flex items-center justify-between p-3 rounded-xl bg-error/15 hover:bg-error/25 border border-error/30 transition-all active:scale-[0.98] group cursor-pointer text-left">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-error text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                                🚑
                            </div>
                            <div>
                                <h4 class="font-bold text-xs text-on-surface group-hover:text-error transition-colors">Medical Ambulance</h4>
                                <p class="text-[10px] text-on-surface-variant">Free 24/7 Emergency Medical Response</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 bg-error text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-md shrink-0">
                            <span class="material-symbols-outlined text-sm">call</span>
                            <span>108</span>
                        </div>
                    </a>

                    <!-- 112 / 100 Police -->
                    <a href="tel:112" onclick="window.location.href='tel:112'" class="flex items-center justify-between p-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 transition-all active:scale-[0.98] group cursor-pointer text-left">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                                👮
                            </div>
                            <div>
                                <h4 class="font-bold text-xs text-on-surface group-hover:text-blue-400 transition-colors">Police Emergency Response</h4>
                                <p class="text-[10px] text-on-surface-variant">National Emergency & Safety (112 / 100)</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 bg-blue-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-md shrink-0">
                            <span class="material-symbols-outlined text-sm">call</span>
                            <span>112</span>
                        </div>
                    </a>

                    <!-- 101 Fire Fighters -->
                    <a href="tel:101" onclick="window.location.href='tel:101'" class="flex items-center justify-between p-3 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 transition-all active:scale-[0.98] group cursor-pointer text-left">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                                🚒
                            </div>
                            <div>
                                <h4 class="font-bold text-xs text-on-surface group-hover:text-orange-400 transition-colors">Fire Brigade Fighters</h4>
                                <p class="text-[10px] text-on-surface-variant">Fire & Rescue Emergency Services</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 bg-orange-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-md shrink-0">
                            <span class="material-symbols-outlined text-sm">call</span>
                            <span>101</span>
                        </div>
                    </a>

                    <!-- 1800-425-1663 BMTC Transit Security & Helpline -->
                    <a href="tel:18004251663" onclick="window.location.href='tel:18004251663'" class="flex items-center justify-between p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all active:scale-[0.98] group cursor-pointer text-left">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                                🚌
                            </div>
                            <div>
                                <h4 class="font-bold text-xs text-on-surface group-hover:text-emerald-400 transition-colors">BMTC Transit Security</h4>
                                <p class="text-[10px] text-on-surface-variant">BMTC Bus Control Room & Helpline</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 bg-emerald-600 text-white text-xs font-extrabold px-2.5 py-1.5 rounded-lg shadow-md shrink-0">
                            <span class="material-symbols-outlined text-sm">call</span>
                            <span>1800-425-1663</span>
                        </div>
                    </a>

                    <!-- 1091 Women Safety Helpline -->
                    <a href="tel:1091" onclick="window.location.href='tel:1091'" class="flex items-center justify-between p-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition-all active:scale-[0.98] group cursor-pointer text-left">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                                👩
                            </div>
                            <div>
                                <h4 class="font-bold text-xs text-on-surface group-hover:text-purple-400 transition-colors">Women Safety Helpline</h4>
                                <p class="text-[10px] text-on-surface-variant">Transit Women Safety Response (1091 / 181)</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 bg-purple-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-md shrink-0">
                            <span class="material-symbols-outlined text-sm">call</span>
                            <span>1091</span>
                        </div>
                    </a>
                </div>

                <!-- Share My Live GPS Coordinates Button -->
                <div class="pt-2 border-t border-white/10 flex items-center gap-2">
                    <button 
                        onclick="app.shareEmergencyGPS('${gpsString}', '${mapsLink}')" 
                        class="w-full py-2.5 rounded-xl bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/40 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                        <span class="material-symbols-outlined text-base">my_location</span>
                        <span>Copy & Share My Live GPS Location</span>
                    </button>
                </div>
            </div>
        `);
    },

    shareEmergencyGPS(coords, link) {
        const text = `🚨 EMERGENCY ALERT: I need assistance! My live GPS location in Bengaluru is: ${coords}. Google Maps link: ${link}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.NotificationUtils) {
                    NotificationUtils.showToast('GPS Coordinates Copied!', 'Send via SMS or WhatsApp to emergency services', 'success', 3000);
                }
            }).catch(() => {});
        }
        if (navigator.share) {
            navigator.share({
                title: '🚨 Emergency GPS Alert',
                text: text,
                url: link
            }).catch(() => {});
        }
    }
};

// Window load bootstrap
window.addEventListener('DOMContentLoaded', () => {
    window.app = app;
    app.init();
});
