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
        // Hide loading screen after smooth progress animation
        setTimeout(async () => {
            const loadingScreen = document.getElementById('loading-screen');
            const appContainer = document.getElementById('app');

            if (loadingScreen) loadingScreen.style.display = 'none';
            if (appContainer) appContainer.style.display = 'flex';

            // First Page Rule: If not logged in, take user directly to Auth / Login screen!
            if (!API.isAuthenticated()) {
                this.navigate('auth');
            } else {
                // Validate the token is still good (DB may have been reset)
                try {
                    await API.getProfile();
                    // Token is valid — connect real-time WebSocket and go home
                    NotificationUtils.initWebSocket();
                    NotificationUtils.updateBadge();
                    this.navigate('home');
                } catch (e) {
                    // Token is stale or invalid — clear and show login
                    API.clearAuth();
                    this.navigate('auth');
                }
            }
        }, 600);
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
    }
};

// Window load bootstrap
window.addEventListener('DOMContentLoaded', () => {
    window.app = app;
    app.init();
});
