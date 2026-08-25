/**
 * Lumina Transit - Gamification Dashboard & Commuter Ranks View
 * Pixel-matched with Stitch commuter_ranks export
 */
const GamificationView = {
    profileData: null,
    leaderboardData: [],
    badgesData: [],

    async render() {
        return `
            <div class="view-fade-in pt-[80px] px-container-margin pb-[100px] max-w-xl mx-auto space-y-stack-lg" id="ranks-container">
                <div class="glass-panel rounded-transit p-8 text-center text-on-surface-variant">
                    <span class="material-symbols-outlined animate-spin text-3xl text-primary mb-2">sync</span>
                    <p class="text-sm">${I18n.t('ranks.loading')}</p>
                </div>
            </div>
        `;
    },

    async init() {
        await this.loadData();
    },

    async loadData() {
        const container = document.getElementById('ranks-container');
        if (!container) return;

        try {
            if (API.isAuthenticated()) {
                const [profileRes, leaderboardRes, badgesRes] = await Promise.all([
                    API.getGamificationProfile(),
                    API.getLeaderboard(10),
                    API.getBadges()
                ]);

                this.profileData = profileRes.profile;
                this.leaderboardData = leaderboardRes.leaderboard || [];
                this.badgesData = badgesRes.badges || [];
                this.renderAuthenticatedUI();
            } else {
                const [leaderboardRes, badgesRes] = await Promise.all([
                    API.getLeaderboard(10),
                    API.getBadges()
                ]);
                this.leaderboardData = leaderboardRes.leaderboard || [];
                this.badgesData = badgesRes.badges || [];
                this.renderGuestUI();
            }
        } catch (e) {
            container.innerHTML = `
                <div class="glass-panel rounded-transit p-8 text-center">
                    <span class="material-symbols-outlined text-4xl text-primary mb-2">military_tech</span>
                    <h3 class="font-headline-md text-on-surface font-bold">${I18n.t('ranks.title')}</h3>
                    <p class="text-xs text-on-surface-variant mt-1 mb-4">${I18n.t('ranks.sign_in_prompt')}</p>
                    <button class="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-lg" onclick="window.app.showAuthModal()">${I18n.t('ranks.sign_in_now')}</button>
                </div>
            `;
        }
    },

    renderAuthenticatedUI() {
        const container = document.getElementById('ranks-container');
        if (!container || !this.profileData) return;

        const p = this.profileData;
        const streakDays = Math.max(1, p.streak_days || 1);
        const earnedBadgeIds = new Set((p.badges || []).map(b => b.id));

        // Format points
        const pointsFormatted = (p.points || 0).toLocaleString();
        const progressPct = Math.min(100, Math.max(15, p.levelProgress || 65));
        const ptsRemaining = p.nextLevel ? Math.max(0, p.nextLevel.minPoints - p.points) : 0;

        container.innerHTML = `
            <!-- Hero: Profile Summary & Points (Stitch commuter_ranks) -->
            <section class="glass-panel rounded-[24px] p-stack-md relative overflow-hidden shadow-2xl border border-white/10">
                <!-- Decorative Glow -->
                <div class="absolute -top-10 -right-10 w-36 h-36 bg-primary/20 blur-3xl rounded-full pointer-events-none"></div>

                <div class="flex items-center gap-stack-md mb-stack-lg relative z-10">
                    <div class="w-16 h-16 rounded-full border-2 border-primary overflow-hidden shrink-0 shadow-[0_0_15px_rgba(173,198,255,0.4)] flex items-center justify-center bg-surface-container-high">
                        <span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1;">person</span>
                    </div>
                    <div>
                        <h2 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">${p.name}</h2>
                        <div class="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-primary-container/20 border border-primary/30">
                            <span class="material-symbols-outlined text-primary text-[14px]" style="font-variation-settings: 'FILL' 1;">military_tech</span>
                            <span class="font-label-sm text-xs text-primary font-medium">${I18n.translateDynamic(p.currentLevel?.name || 'Level 4: Contributor')}</span>
                        </div>
                    </div>
                </div>

                <div class="relative z-10">
                    <div class="flex justify-between items-end mb-stack-sm">
                        <div>
                            <p class="font-label-bold text-xs text-on-surface-variant uppercase tracking-wider font-semibold">${I18n.t('ranks.total_points')}</p>
                            <p class="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">
                                ${pointsFormatted} <span class="font-body-md text-sm text-primary/70 font-normal">${I18n.t('ranks.pts')}</span>
                            </p>
                        </div>
                        <span class="font-label-sm text-xs text-on-surface-variant">${ptsRemaining > 0 ? I18n.t('ranks.to_next_tier', { pts: ptsRemaining }) : I18n.t('ranks.top_tier')}</span>
                    </div>

                    <!-- Animated Progress Bar -->
                    <div class="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden relative shadow-inner">
                        <div class="h-full bg-primary rounded-full animate-progress relative shadow-[0_0_12px_#adc6ff]" style="width: ${progressPct}%;">
                            <div class="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/40 rounded-r-full"></div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Streak Tracker (Stitch commuter_ranks) -->
            <section class="glass-panel rounded-xl p-stack-md border-l-4 border-l-tertiary flex items-center justify-between shadow-lg">
                <div class="flex items-center gap-stack-md">
                    <div class="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary shadow-[0_0_15px_rgba(255,185,95,0.3)]">
                        <span class="material-symbols-outlined text-2xl icon-fill animate-subtle-pulse" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
                    </div>
                    <div>
                        <h3 class="font-headline-md text-base font-bold text-on-surface">${I18n.t('ranks.day_streak', { days: streakDays })}</h3>
                        <p class="font-label-sm text-xs text-on-surface-variant">${I18n.t('ranks.keep_reporting')}</p>
                    </div>
                </div>
                <div class="flex gap-1 items-end">
                    <div class="w-2 h-5 rounded-full bg-tertiary opacity-40"></div>
                    <div class="w-2 h-7 rounded-full bg-tertiary opacity-60"></div>
                    <div class="w-2 h-9 rounded-full bg-tertiary opacity-80"></div>
                    <div class="w-2 h-11 rounded-full bg-tertiary shadow-[0_0_8px_#ffb95f]"></div>
                    <div class="w-2 h-6 rounded-full bg-surface-container-highest"></div>
                </div>
            </section>

            <!-- Bento Grid: Badges & Leaderboard (Stitch commuter_ranks) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                <!-- Your Badges -->
                <section class="glass-panel rounded-[24px] p-stack-md shadow-lg">
                    <div class="flex justify-between items-center mb-stack-md">
                        <h3 class="font-headline-md text-base font-bold text-on-surface">${I18n.t('ranks.your_badges')}</h3>
                        <span class="font-label-sm text-xs text-primary font-medium">${earnedBadgeIds.size} / ${this.badgesData.length || 6}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-stack-sm">
                        <!-- Badge 1: Early Bird -->
                        <div class="flex flex-col items-center gap-2">
                            <div class="w-14 h-14 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center relative shadow-[inset_0_0_10px_rgba(173,198,255,0.2)]">
                                <span class="material-symbols-outlined text-primary text-[28px]">wb_twilight</span>
                            </div>
                            <span class="font-label-sm text-[11px] text-on-surface text-center leading-tight font-medium">${I18n.t('ranks.early_bird')}</span>
                        </div>

                        <!-- Badge 2: Crowd Watcher -->
                        <div class="flex flex-col items-center gap-2">
                            <div class="w-14 h-14 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center relative shadow-[inset_0_0_10px_rgba(78,222,163,0.2)]">
                                <span class="material-symbols-outlined text-secondary text-[28px]">group</span>
                            </div>
                            <span class="font-label-sm text-[11px] text-on-surface text-center leading-tight font-medium">${I18n.t('ranks.crowd_watcher')}</span>
                        </div>

                        <!-- Badge 3: Verified Hero (Locked) -->
                        <div class="flex flex-col items-center gap-2 opacity-50 grayscale">
                            <div class="w-14 h-14 rounded-full bg-surface-container-lowest border border-outline-variant border-dashed flex items-center justify-center">
                                <span class="material-symbols-outlined text-outline text-[28px]">lock</span>
                            </div>
                            <span class="font-label-sm text-[11px] text-on-surface text-center leading-tight">${I18n.t('ranks.verified_hero')}</span>
                        </div>
                    </div>
                </section>

                <!-- Weekly Local Rank -->
                <section class="glass-panel rounded-[24px] p-stack-md shadow-lg">
                    <div class="flex justify-between items-center mb-stack-md">
                        <h3 class="font-headline-md text-base font-bold text-on-surface">${I18n.t('ranks.local_rank')}</h3>
                        <div class="flex items-center gap-1 text-on-surface-variant text-xs">
                            <span class="material-symbols-outlined text-[14px]">schedule</span>
                            <span>${I18n.t('ranks.ends_in')}</span>
                        </div>
                    </div>
                    <ul class="space-y-stack-sm">
                        ${this.renderLeaderboardList(p)}
                    </ul>
                </section>
            </div>

            <!-- Contribution History (Stitch commuter_ranks) -->
            <section class="mb-stack-lg">
                <h3 class="font-headline-md text-base font-bold text-on-surface mb-stack-md px-1">${I18n.t('ranks.recent_contributions')}</h3>
                <div class="space-y-2.5">
                    <!-- Item 1 -->
                    <div class="glass-panel p-stack-sm rounded-xl flex items-center justify-between glass-panel-interactive cursor-pointer shadow-md">
                        <div class="flex items-center gap-stack-md">
                            <div class="w-10 h-10 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary">
                                <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                            </div>
                            <div>
                                <p class="font-body-md text-sm text-on-surface font-medium">${I18n.t('ranks.reported_delay')}</p>
                                <p class="font-label-sm text-[11px] text-on-surface-variant">${I18n.t('ranks.hours_ago')}</p>
                            </div>
                        </div>
                        <div class="font-label-bold text-xs text-secondary bg-secondary-container/20 border border-secondary/30 px-3 py-1 rounded-full font-bold">
                            +15 ${I18n.t('ranks.pts')}
                        </div>
                    </div>

                    <!-- Item 2 -->
                    <div class="glass-panel p-stack-sm rounded-xl flex items-center justify-between glass-panel-interactive cursor-pointer shadow-md">
                        <div class="flex items-center gap-stack-md">
                            <div class="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                                <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">group</span>
                            </div>
                            <div>
                                <p class="font-body-md text-sm text-on-surface font-medium">${I18n.t('ranks.updated_crowd')}</p>
                                <p class="font-label-sm text-[11px] text-on-surface-variant">${I18n.t('ranks.yesterday')}</p>
                            </div>
                        </div>
                        <div class="font-label-bold text-xs text-primary bg-primary-container/20 border border-primary/30 px-3 py-1 rounded-full font-bold">
                            +10 ${I18n.t('ranks.pts')}
                        </div>
                    </div>

                    <!-- Item 3 -->
                    <div class="glass-panel p-stack-sm rounded-xl flex items-center justify-between glass-panel-interactive cursor-pointer shadow-md">
                        <div class="flex items-center gap-stack-md">
                            <div class="w-10 h-10 rounded-full bg-tertiary/15 border border-tertiary/30 flex items-center justify-center text-tertiary">
                                <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                            </div>
                            <div>
                                <p class="font-body-md text-sm text-on-surface font-medium">${I18n.t('ranks.verified_stop')}</p>
                                <p class="font-label-sm text-[11px] text-on-surface-variant">${I18n.t('ranks.days_ago')}</p>
                            </div>
                        </div>
                        <div class="font-label-bold text-xs text-tertiary bg-tertiary-container/20 border border-tertiary/30 px-3 py-1 rounded-full font-bold">
                            +5 ${I18n.t('ranks.pts')}
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    renderGuestUI() {
        const container = document.getElementById('ranks-container');
        if (!container) return;

        container.innerHTML = `
            <div class="glass-panel rounded-2xl p-8 text-center shadow-2xl">
                <div class="w-16 h-16 rounded-full bg-tertiary-container/20 border border-tertiary/30 flex items-center justify-center mx-auto mb-3 text-tertiary">
                    <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">stars</span>
                </div>
                <h3 class="font-headline-md text-lg font-bold text-on-surface">${I18n.t('ranks.join_network')}</h3>
                <p class="text-xs text-on-surface-variant mt-1.5 mb-5 max-w-sm mx-auto">
                    ${I18n.t('ranks.join_desc')}
                </p>
                <button class="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg hover:bg-primary-fixed active:scale-95 transition-all" onclick="window.app.showAuthModal()">
                    ${I18n.t('ranks.sign_in_register')}
                </button>
            </div>

            <!-- Public Leaderboard -->
            <section class="glass-panel rounded-[24px] p-stack-md shadow-lg">
                <div class="flex justify-between items-center mb-stack-md">
                    <h3 class="font-headline-md text-base font-bold text-on-surface">${I18n.t('ranks.top_contributors')}</h3>
                    <span class="text-xs text-on-surface-variant">${I18n.t('ranks.live_standings')}</span>
                </div>
                <ul class="space-y-stack-sm">
                    ${this.renderLeaderboardList(null)}
                </ul>
            </section>
        `;
    },

    renderLeaderboardList(currentUser) {
        const top3 = [
            { name: 'Sarah M.', points: 1420, isUser: false },
            { name: currentUser ? `${currentUser.name} (You)` : 'Alex P.', points: currentUser ? currentUser.points || 1250 : 1250, isUser: true },
            { name: 'David K.', points: 980, isUser: false }
        ];

        return top3.map((item, idx) => {
            if (item.isUser) {
                return `
                    <li class="flex items-center gap-3 p-2.5 rounded-xl bg-primary-container/15 border border-primary/30 relative overflow-hidden">
                        <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                        <span class="font-label-bold text-sm text-primary w-4 text-center font-bold">${idx + 1}</span>
                        <div class="w-8 h-8 rounded-full border border-primary overflow-hidden flex items-center justify-center bg-primary-container/30 text-primary">
                            <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">person</span>
                        </div>
                        <span class="font-body-md text-xs text-primary font-semibold flex-1 truncate">${item.name}</span>
                        <span class="font-label-bold text-xs text-primary font-bold">${item.points.toLocaleString()} ${I18n.t('ranks.pts')}</span>
                    </li>
                `;
            } else {
                return `
                    <li class="flex items-center gap-3 p-2 rounded-lg">
                        <span class="font-label-bold text-xs text-outline w-4 text-center">${idx + 1}</span>
                        <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-outline">
                            <span class="material-symbols-outlined text-sm">person</span>
                        </div>
                        <span class="font-body-md text-xs text-on-surface flex-1 truncate">${item.name}</span>
                        <span class="font-label-bold text-xs text-on-surface-variant font-medium">${item.points.toLocaleString()} ${I18n.t('ranks.pts')}</span>
                    </li>
                `;
            }
        }).join('');
    }
};
