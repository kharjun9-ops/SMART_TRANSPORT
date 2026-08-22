/**
 * Lumina Transit - Auth View (Bengaluru Transit Network)
 * Dedicated Login & Welcome Screen
 */
const AuthView = {
    mode: 'login',

    render() {
        return `
            <div class="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 max-w-sm mx-auto">
                <div class="glass-panel rounded-3xl p-6 w-full relative overflow-hidden shadow-2xl border border-white/15 my-auto">
                    
                    <!-- Decorative Glow -->
                    <div class="absolute -top-12 -right-12 w-36 h-36 bg-primary/20 blur-3xl rounded-full pointer-events-none"></div>

                    <!-- Branding -->
                    <div class="text-center mb-6">
                        <div class="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-3 text-primary shadow-[0_0_20px_rgba(173,198,255,0.4)]">
                            <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                        </div>
                        <h2 class="font-headline-md text-2xl font-bold text-primary tracking-tight">Lumina <span class="text-secondary">Transit</span></h2>
                        <p class="text-xs text-on-surface-variant mt-1 font-medium">Bengaluru Smart Transit & Crowd Intelligence</p>
                    </div>

                    <!-- Tabs -->
                    <div class="flex bg-surface-container-high rounded-xl p-1 mb-5">
                        <button 
                            class="flex-1 py-2 rounded-lg text-xs font-bold transition-all ${this.mode === 'login' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}"
                            onclick="AuthView.setMode('login')"
                        >
                            Sign In
                        </button>
                        <button 
                            class="flex-1 py-2 rounded-lg text-xs font-bold transition-all ${this.mode === 'register' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}"
                            onclick="AuthView.setMode('register')"
                        >
                            Register
                        </button>
                    </div>

                    ${this.mode === 'login' ? this.renderLoginForm() : this.renderRegisterForm()}

                    <div class="relative flex py-4 items-center">
                        <div class="flex-grow border-t border-white/10"></div>
                        <span class="flex-shrink mx-3 text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Quick Access</span>
                        <div class="flex-grow border-t border-white/10"></div>
                    </div>

                    <button 
                        type="button"
                        class="w-full py-3 rounded-xl border border-primary/40 bg-primary/10 text-primary text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/20 active:scale-95 transition-all shadow-md"
                        onclick="AuthView.quickDemoLogin()"
                    >
                        <span class="material-symbols-outlined text-base text-tertiary">bolt</span> 
                        <span>Quick Demo Login (Karthik R.)</span>
                    </button>
                </div>
            </div>
        `;
    },

    renderLoginForm() {
        return `
            <form id="login-form" onsubmit="AuthView.handleLogin(event)" class="space-y-3.5">
                <div>
                    <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Email Address</label>
                    <input 
                        type="email" 
                        id="login-email" 
                        class="w-full p-3 glass-panel rounded-xl text-xs text-on-surface placeholder:text-outline border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                        placeholder="commuter@bmtc.in" 
                        required 
                        value="karthik@demo.in"
                    >
                </div>
                <div>
                    <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Password</label>
                    <input 
                        type="password" 
                        id="login-password" 
                        class="w-full p-3 glass-panel rounded-xl text-xs text-on-surface placeholder:text-outline border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                        placeholder="••••••••" 
                        required 
                        value="password123"
                    >
                </div>
                <button 
                    type="submit" 
                    id="login-submit-btn"
                    class="w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-fixed active:scale-95 transition-all mt-2"
                >
                    <span class="material-symbols-outlined text-base">login</span> 
                    <span>Sign In to Bengaluru Transit</span>
                </button>
            </form>
        `;
    },

    renderRegisterForm() {
        return `
            <form id="register-form" onsubmit="AuthView.handleRegister(event)" class="space-y-3">
                <div>
                    <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Full Name</label>
                    <input 
                        type="text" 
                        id="reg-name" 
                        class="w-full p-3 glass-panel rounded-xl text-xs text-on-surface placeholder:text-outline border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                        placeholder="e.g. Karthik Rao" 
                        required
                    >
                </div>
                <div>
                    <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Email Address</label>
                    <input 
                        type="email" 
                        id="reg-email" 
                        class="w-full p-3 glass-panel rounded-xl text-xs text-on-surface placeholder:text-outline border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                        placeholder="karthik@bmtc.in" 
                        required
                    >
                </div>
                <div>
                    <label class="block text-[11px] font-semibold text-on-surface-variant mb-1">Password</label>
                    <input 
                        type="password" 
                        id="reg-password" 
                        class="w-full p-3 glass-panel rounded-xl text-xs text-on-surface placeholder:text-outline border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                        placeholder="At least 6 characters" 
                        minlength="6" 
                        required
                    >
                </div>
                <button 
                    type="submit" 
                    id="reg-submit-btn"
                    class="w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-fixed active:scale-95 transition-all mt-2"
                >
                    <span class="material-symbols-outlined text-base">person_add</span> 
                    <span>Create Commuter Account</span>
                </button>
            </form>
        `;
    },

    setMode(mode) {
        this.mode = mode;
        const authScreen = document.getElementById('auth-screen');
        const mainContent = document.getElementById('main-content');
        if (authScreen && authScreen.style.display !== 'none') {
            authScreen.innerHTML = this.render();
        } else if (mainContent && window.app && window.app.currentView === 'auth') {
            mainContent.innerHTML = this.render();
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-submit-btn');

        try {
            btn.disabled = true;
            btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-sm">sync</span> Signing in...`;

            await API.login(email, password);
            NotificationUtils.showToast('Welcome back!', 'Signed into Lumina Transit Bengaluru', 'success');

            if (window.app) {
                window.app.onAuthSuccess();
            }
        } catch (err) {
            NotificationUtils.showToast('Sign In Failed', err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<span class="material-symbols-outlined text-base">login</span> <span>Sign In to Bengaluru Transit</span>`;
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const btn = document.getElementById('reg-submit-btn');

        try {
            btn.disabled = true;
            btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-sm">sync</span> Registering...`;

            await API.register({ name, email, password });
            NotificationUtils.showToast('Account Created!', 'Welcome! Earn 50 starter points.', 'success');

            if (window.app) {
                window.app.onAuthSuccess();
            }
        } catch (err) {
            NotificationUtils.showToast('Registration Error', err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<span class="material-symbols-outlined text-base">person_add</span> <span>Create Commuter Account</span>`;
        }
    },

    async quickDemoLogin() {
        try {
            try {
                await API.login('karthik@demo.in', 'password123');
            } catch (err) {
                await API.register({
                    name: 'Karthik Rao',
                    email: 'karthik@demo.in',
                    password: 'password123',
                    phone: '+91 98450 12345'
                });
            }

            NotificationUtils.showToast('Demo Access', 'Signed in as Karthik R. (Bengaluru Contributor)', 'success');
            if (window.app) {
                window.app.onAuthSuccess();
            }
        } catch (e) {
            NotificationUtils.showToast('Demo Login Error', e.message, 'error');
        }
    }
};
