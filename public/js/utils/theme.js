/**
 * Lumina Transit - Theme Management System
 * Supports Google Maps Style Light Mode & Lumina Dark HUD
 */
var ThemeUtils = window.ThemeUtils = {
    STORAGE_KEY: 'lumina_theme',

    init() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY) || 'light';
        this.setTheme(savedTheme, false);
    },

    getTheme() {
        return document.documentElement.classList.contains('light') ? 'light' : 'dark';
    },

    isLight() {
        return this.getTheme() === 'light';
    },

    setTheme(theme, showToast = true) {
        const isLight = theme === 'light';
        const html = document.documentElement;

        if (isLight) {
            html.classList.remove('dark');
            html.classList.add('light');
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
        } else {
            html.classList.remove('light');
            html.classList.add('dark');
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0c1322');
        }

        localStorage.setItem(this.STORAGE_KEY, theme);
        this.updateIcons(isLight);

        // Update active Leaflet maps if MapUtils is loaded
        if (window.MapUtils && typeof window.MapUtils.updateTheme === 'function') {
            window.MapUtils.updateTheme(isLight);
        }

        if (showToast && window.NotificationUtils && typeof window.NotificationUtils.showToast === 'function') {
            NotificationUtils.showToast(
                isLight ? 'Google Maps Light Mode Active ☀️' : 'Lumina HUD Dark Mode Active 🌙',
                'info'
            );
        }
    },

    toggleTheme() {
        const nextTheme = this.isLight() ? 'dark' : 'light';
        this.setTheme(nextTheme, true);
    },

    updateIcons(isLight) {
        const icons = document.querySelectorAll('.theme-toggle-icon');
        icons.forEach(icon => {
            icon.textContent = isLight ? 'dark_mode' : 'light_mode';
            icon.setAttribute('title', isLight ? 'Switch to Dark HUD Mode' : 'Switch to Google Maps Light Mode');
        });

        const badges = document.querySelectorAll('.theme-current-badge');
        badges.forEach(b => {
            b.textContent = isLight ? 'Google Maps Light' : 'Lumina Dark HUD';
        });
    }
};

// Immediate pre-render initialization to prevent theme flash
(function() {
    try {
        const theme = localStorage.getItem('lumina_theme') || 'light';
        if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        } else {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
        }
    } catch (e) {}
})();
