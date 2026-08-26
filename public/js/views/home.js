/**
 * Lumina Transit - Home View (Bengaluru BMTC Transit Network)
 * Google Maps Style Flow:
 * 1. Clean map showing Bengaluru current location
 * 2. User searches/taps destination without autofill
 * 3. Shows available BMTC buses with arrival ETAs, fares & crowd levels
 * 4. Fully internationalized: English, Kannada (ಕನ್ನಡ), Hindi (हिन्दी)
 */
const HomeView = {
    routes: [],
    activeTrips: [],
    stops: [],
    userLocation: { lat: 12.8452, lng: 77.6602, name: 'Electronic City Toll Gate / Phase 1' },
    destination: null,
    searchQuery: '',
    matchedTransitOptions: [],
    livePollInterval: null,

    popularDestinations: [
        { key: 'dest.kengeri_ttmc', name: 'Kengeri TTMC', query: 'Kengeri', routeNum: '378', stopName: 'Kengeri TTMC / Bus Terminal' },
        { key: 'dest.rr_nagar_gate', name: 'RR Nagar Gate', query: 'Rajarajeshwari', routeNum: '378', stopName: 'Rajarajeshwari Nagar Gate' },
        { key: 'dest.uttarahalli', name: 'Uttarahalli', query: 'Uttarahalli', routeNum: '378', stopName: 'Uttarahalli / Channasandra' },
        { key: 'dest.konanakunte_cross', name: 'Konanakunte Cross', query: 'Konanakunte', routeNum: '378', stopName: 'Konanakunte Cross' },
        { key: 'dest.silk_institute', name: 'Silk Institute', query: 'Silk Institute', routeNum: '378', stopName: 'Silk Institute (Kanakapura Rd)' },
        { key: 'dest.gottigere', name: 'Gottigere', query: 'Gottigere', routeNum: '378', stopName: 'Gottigere (Bannerghatta Rd)' },
        { key: 'dest.hosa_road', name: 'Hosa Road', query: 'Hosa Road', routeNum: '378', stopName: 'Hosa Road Junction' },
        { key: 'dest.electronic_city', name: 'Electronic City', query: 'Electronic City', routeNum: '378', stopName: 'Electronic City Wipro Gate' }
    ],

    async render() {
        return `
            <div class="view-fade-in pt-[72px] px-container-margin pb-[100px] max-w-xl mx-auto space-y-4">
                
                <!-- Destination Search Bar (Google Maps Style) -->
                <div class="glass-panel rounded-2xl p-4 shadow-xl border border-white/15 relative overflow-hidden">
                    <div class="flex items-center gap-3">
                        <div class="flex flex-col items-center gap-1.5 py-1">
                            <div class="w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_#4edea3]"></div>
                            <div class="w-0.5 h-6 bg-outline-variant/60"></div>
                            <div class="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_#adc6ff]"></div>
                        </div>
                        <div class="flex-1 space-y-2">
                            <!-- Origin -->
                            <div class="flex items-center justify-between bg-surface-container/60 rounded-xl px-3 py-2 border border-white/5">
                                <span class="text-xs text-on-surface font-medium truncate flex items-center gap-1.5" id="origin-label">
                                    <span class="material-symbols-outlined text-secondary text-sm" style="font-variation-settings: 'FILL' 1;">my_location</span>
                                    ${I18n.translateStop(this.userLocation.name)}
                                </span>
                                <button onclick="HomeView.detectGPSLocation()" class="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer">
                                    GPS
                                </button>
                            </div>
                            <!-- Destination Input -->
                            <div class="relative">
                                <input 
                                    id="destination-input"
                                    class="w-full px-3.5 py-2.5 bg-surface-container-high rounded-xl text-xs text-on-surface placeholder:text-outline border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                                    placeholder="${I18n.t('home.search_placeholder') || 'Type destination stop name...'}"
                                    type="text"
                                    value="${this.destination ? (I18n.translateStop(this.destination.name) || this.destination.name) : this.searchQuery}"
                                    onkeydown="if(event.key==='Enter') HomeView.handleSearchSubmit(this.value)"
                                    oninput="HomeView.handleSearchInput(this.value)"
                                    autocomplete="off"
                                >
                                <button id="dest-clear-btn" onclick="HomeView.clearDestination()" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 cursor-pointer ${(this.destination || this.searchQuery) ? '' : 'hidden'}" title="Clear">
                                    <span class="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Clean Location Map (Google Maps Interface) -->
                <section class="relative">
                    <div class="relative w-full h-[240px] rounded-transit overflow-hidden border border-white/10 shadow-2xl bg-surface-container-low">
                        <div id="home-map" class="w-full h-full"></div>
                        
                        <!-- HUD Status Badge -->
                        <div class="absolute bottom-3 left-3 glass-panel px-3 py-1 rounded-full flex items-center gap-2 shadow-lg pointer-events-none z-[400]">
                            <div class="w-2 h-2 rounded-full ${this.destination ? 'bg-primary' : 'bg-secondary'}"></div>
                            <span class="font-label-sm text-[11px] text-on-surface font-medium" id="map-status-label">
                                ${this.destination ? I18n.t('home.route_calculated') : I18n.t('home.map_label')}
                            </span>
                        </div>

                        <!-- Google Maps Layer Switcher -->
                        <button 
                            onclick="HomeView.toggleMapType()"
                            class="absolute top-3 right-3 glass-panel text-on-surface hover:text-primary px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1 text-[11px] font-bold z-[400] active:scale-95 transition-all cursor-pointer"
                            title="Toggle Google Maps Satellite / Default"
                            id="map-type-btn"
                        >
                            <span class="material-symbols-outlined text-sm text-primary">layers</span>
                            <span id="map-type-label">${I18n.t('home.satellite')}</span>
                        </button>

                        <!-- Recenter GPS Button -->
                        <button 
                            onclick="HomeView.detectGPSLocation()"
                            class="absolute bottom-3 right-3 bg-primary text-on-primary p-2.5 rounded-full shadow-[0_2px_12px_rgba(26,115,232,0.4)] hover:bg-primary-fixed active:scale-90 transition-all z-[400] flex items-center justify-center cursor-pointer"
                            title="Recenter GPS"
                        >
                            <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">my_location</span>
                        </button>
                    </div>
                </section>

                <!-- Results & Options Container -->
                <div id="transit-results-section" class="space-y-3">
                    ${this.renderDestinationOrSuggestions()}
                </div>
            </div>
        `;
    },

    getMatchingStops(query) {
        if (!query) return [];
        const q = query.toLowerCase().trim();

        return this.stops
            .filter(s => {
                const enMatch = s.name.toLowerCase().includes(q);
                const translated = I18n.translateStop(s.name);
                const transMatch = translated.toLowerCase().includes(q);
                return enMatch || transMatch;
            })
            .sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();

                // 1. Starts with query first
                const aStarts = aName.startsWith(q) ? 0 : 1;
                const bStarts = bName.startsWith(q) ? 0 : 1;
                if (aStarts !== bStarts) return aStarts - bStarts;

                // 2. Major hubs next
                const aMajor = a.is_major ? 0 : 1;
                const bMajor = b.is_major ? 0 : 1;
                if (aMajor !== bMajor) return aMajor - bMajor;

                // 3. Sequence along route
                return (a.sequence_order || 0) - (b.sequence_order || 0);
            });
    },

    highlightMatch(text, query) {
        if (!query) return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<span class="text-primary underline font-extrabold">$1</span>');
    },

    renderDestinationOrSuggestions() {
        // State 1: When user has explicitly chosen a destination stop
        if (this.destination) {
            const destDisplayName = I18n.translateStop(this.destination.name);

            if (this.matchedTransitOptions.length === 0) {
                return `
                    <div class="glass-panel rounded-2xl p-6 text-center shadow-lg">
                        <span class="material-symbols-outlined text-3xl text-outline mb-1">directions_bus</span>
                        <h4 class="font-bold text-sm text-on-surface">${I18n.t('home.no_buses') || 'No Direct Buses Found'}</h4>
                        <p class="text-xs text-on-surface-variant mt-1">${I18n.t('home.try_nearby') || 'Try selecting another stop along Route 378.'}</p>
                        <button class="mt-3 px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold cursor-pointer" onclick="HomeView.clearDestination()">${I18n.t('home.choose_other') || 'Choose Other Stop'}</button>
                    </div>
                `;
            }

            return `
                <div class="space-y-2.5">
                    <div class="flex items-center justify-between px-1">
                        <div>
                            <h3 class="font-headline-md text-sm font-bold text-on-surface">${I18n.t('home.available_buses_to', { dest: destDisplayName }) || `Available Buses to ${destDisplayName}`}</h3>
                            <p class="text-[11px] text-on-surface-variant">${I18n.t('home.buses_active', { count: this.matchedTransitOptions.length }) || `${this.matchedTransitOptions.length} Route 378 buses active`}</p>
                        </div>
                        <button onclick="HomeView.clearDestination()" class="text-xs text-primary font-semibold hover:underline cursor-pointer">
                            ${I18n.t('home.change_stop') || 'Change Stop'}
                        </button>
                    </div>

                    <div class="space-y-2.5">
                        ${this.matchedTransitOptions.map((opt, idx) => {
                            const crowdLevel = opt.trip?.crowd_level || 'low';
                            let crowdBadge = '';
                            if (crowdLevel === 'low') {
                                crowdBadge = `<span class="bg-secondary/20 text-secondary border border-secondary/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold">${I18n.t('crowd.plenty_seats') || 'Plenty of Seats'}</span>`;
                            } else if (crowdLevel === 'medium') {
                                crowdBadge = `<span class="bg-tertiary/20 text-tertiary border border-tertiary/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold">${I18n.t('crowd.standing_room') || 'Standing Room'}</span>`;
                            } else {
                                crowdBadge = `<span class="bg-error/20 text-error border border-error/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold">${I18n.t('crowd.very_crowded') || 'Very Crowded'}</span>`;
                            }

                            const durationMins = opt.route?.avg_duration_minutes || 30;
                            const fare = opt.route?.fare_lkr || 25;
                            const nextStopForecast = opt.trip?.next_stop_forecast;
                            const nextEta = opt.trip?.next_stop_eta || (nextStopForecast ? { eta_minutes: nextStopForecast.wait_time_minutes, display_text: nextStopForecast.display_text } : null);
                            const arrivingText = nextEta ? (nextEta.eta_minutes !== undefined ? I18n.t('home.arriving_in', { mins: nextEta.eta_minutes }) : nextEta.display_text) : I18n.t('home.arriving_in', { mins: 3 });
                            const isAtStop = opt.trip?.state === 'at_stop' || opt.trip?.current_speed_kmh === 0;

                            return `
                                <div class="glass-panel rounded-2xl p-4 shadow-xl border ${idx === 0 ? 'border-primary/40' : 'border-white/10'} hover:bg-surface-container-high transition-all">
                                    <div class="flex items-start justify-between mb-2">
                                        <div class="flex items-center gap-3">
                                            <div class="w-12 h-12 rounded-xl bg-primary text-on-primary font-bold font-status-number text-base flex items-center justify-center shadow-[0_0_12px_rgba(173,198,255,0.5)]">
                                                ${opt.route?.route_number || '378'}
                                            </div>
                                            <div>
                                                <div class="flex items-center gap-2">
                                                    <h4 class="font-bold text-sm text-on-surface">${opt.route?.name ? opt.route.name.split(' - ').map(s => I18n.translateStop(s)).join(' - ') : 'Electronic City - Kengeri TTMC'}</h4>
                                                    ${isAtStop ? `
                                                        <span class="bg-tertiary/20 text-tertiary border border-tertiary/30 text-[9.5px] px-1.5 py-0.2 rounded-full font-bold">${I18n.t('trips.at_stop') || 'AT STOP'}</span>
                                                    ` : `
                                                        <span class="bg-primary/20 text-primary border border-primary/30 text-[9.5px] px-1.5 py-0.2 rounded-full font-bold">${opt.trip?.current_speed_kmh || 30} km/h</span>
                                                    `}
                                                </div>
                                                <div class="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1.5 font-medium">
                                                    <span class="text-primary font-bold flex items-center gap-1">
                                                        <span class="w-1.5 h-1.5 rounded-full ${isAtStop ? 'bg-tertiary' : 'bg-primary'}"></span>
                                                        ${arrivingText}
                                                    </span>
                                                    <span>•</span>
                                                    <span>${I18n.t('home.min_trip_clean', { mins: durationMins }) || `${durationMins} min trip`}</span>
                                                    <span>•</span>
                                                    <span>₹${fare}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex items-center justify-between pt-2 border-t border-white/10">
                                        ${crowdBadge}
                                        <button 
                                            class="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 hover:bg-primary-fixed active:scale-95 transition-all shadow-md cursor-pointer"
                                            onclick="HomeView.startJourney('${opt.trip?.id || ''}')"
                                        >
                                            <span>${I18n.t('home.track_join') || 'Track Bus & Join'}</span>
                                            <span class="material-symbols-outlined text-sm">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // State 2: When user is actively typing a search query -> Sort and show matching stops
        if (this.searchQuery) {
            const matches = this.getMatchingStops(this.searchQuery);

            if (matches.length === 0) {
                return `
                    <div class="glass-panel rounded-2xl p-5 text-center shadow-md space-y-2">
                        <span class="material-symbols-outlined text-2xl text-outline">search_off</span>
                        <p class="text-xs text-on-surface font-semibold">${I18n.t('home.no_matching_stops', { query: this.searchQuery }) || `No stops matching "${this.searchQuery}"`}</p>
                        <p class="text-[11px] text-on-surface-variant">${I18n.t('home.try_searching_hint') || 'Try searching for stops along Route 378 like "Kengeri", "Hosa Road", "Uttarahalli", "PES", or "Silk Institute".'}</p>
                    </div>
                `;
            }

            return `
                <div class="space-y-2">
                    <div class="flex justify-between items-center px-1">
                        <h3 class="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider">
                            ${I18n.t('home.matching_stops', { count: matches.length }) || `Matching Route Stops (${matches.length})`}
                        </h3>
                        <span class="text-[10px] text-on-surface-variant">${I18n.t('home.tap_to_choose') || 'Tap to choose'}</span>
                    </div>

                    <div class="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                        ${matches.map(s => {
                            const translatedName = I18n.translateStop(s.name);
                            return `
                                <button 
                                    class="w-full glass-panel rounded-xl p-3 text-left hover:bg-surface-container-high active:scale-[0.99] transition-all flex items-center justify-between group shadow-sm cursor-pointer border border-white/5"
                                    onclick="HomeView.selectDestination('${s.name.replace(/'/g, "\\'")}', '${s.name.replace(/'/g, "\\'")}')"
                                >
                                    <div class="flex items-center gap-2.5 min-w-0 pr-2">
                                        <div class="w-8 h-8 rounded-lg ${s.is_major ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-container-highest text-on-surface-variant'} flex items-center justify-center flex-shrink-0">
                                            <span class="material-symbols-outlined text-base">${s.is_major ? 'hub' : 'place'}</span>
                                        </div>
                                        <div class="truncate">
                                            <div class="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate">
                                                ${this.highlightMatch(translatedName, this.searchQuery)}
                                            </div>
                                            <div class="text-[10px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                                                <span class="text-primary font-semibold">${I18n.t('home.route_direct') || 'Route 378 Direct'}</span>
                                                ${s.is_major ? `<span>•</span><span class="text-secondary font-semibold">${I18n.t('home.major_hub') || 'Major Hub'}</span>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-sm flex-shrink-0">arrow_forward</span>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // State 3: Empty Search (Initial Home State) -> Show Popular destinations and Full corridor stops
        return `
            <div class="space-y-4 pt-1">
                <div>
                    <h3 class="font-headline-md text-xs font-bold text-on-surface mb-2.5 px-1 flex items-center justify-between">
                        <span>${I18n.t('home.popular_destinations') || 'Popular Destinations'}</span>
                        <span class="text-[11px] text-on-surface-variant font-normal">${I18n.t('home.tap_to_find') || 'Tap to view buses'}</span>
                    </h3>
                    <div class="grid grid-cols-2 gap-2">
                        ${this.popularDestinations.map(p => {
                            const translatedDestName = I18n.t(p.key) || I18n.translateStop(p.name);
                            return `
                                <button 
                                    class="glass-panel rounded-2xl p-3 text-left hover:bg-surface-container-high active:scale-[0.98] transition-all flex items-center justify-between group shadow-md cursor-pointer"
                                    onclick="HomeView.selectDestination('${p.name}', '${p.query}')"
                                >
                                    <div class="min-w-0 pr-2">
                                        <div class="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate">${translatedDestName}</div>
                                        <div class="text-[10px] text-on-surface-variant mt-0.5 font-medium">${I18n.t('home.route_direct') || 'Route 378 Direct'}</div>
                                    </div>
                                    <div class="w-7 h-7 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
                                        <span class="material-symbols-outlined text-sm">directions_bus</span>
                                    </div>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- All Route 378 Stops List -->
                ${this.stops && this.stops.length > 0 ? `
                    <div class="space-y-2 pt-1">
                        <div class="flex justify-between items-center px-1">
                            <h3 class="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider">
                                ${I18n.t('home.all_corridor_stops', { count: this.stops.length }) || `All Route 378 Corridor Stops (${this.stops.length})`}
                            </h3>
                            <span class="text-[10px] text-on-surface-variant">${I18n.t('home.tap_any_stop') || 'Tap any stop'}</span>
                        </div>
                        <div class="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                            ${this.stops.map((s, idx) => {
                                const translatedStopName = I18n.translateStop(s.name);
                                return `
                                    <button 
                                        class="w-full glass-panel rounded-xl px-3 py-2 text-left hover:bg-surface-container-high active:scale-[0.99] transition-all flex items-center justify-between group shadow-sm cursor-pointer border border-white/5"
                                        onclick="HomeView.selectDestination('${s.name.replace(/'/g, "\\'")}', '${s.name.replace(/'/g, "\\'")}')"
                                    >
                                        <div class="flex items-center gap-2.5 min-w-0 pr-2">
                                            <span class="text-[10px] font-bold text-on-surface-variant w-4 text-center">${idx + 1}</span>
                                            <span class="font-medium text-xs text-on-surface group-hover:text-primary transition-colors truncate">${translatedStopName}</span>
                                            ${s.is_major ? `<span class="bg-primary/20 text-primary text-[9px] font-bold px-1.5 py-0.2 rounded-full">${I18n.t('home.hub') || 'HUB'}</span>` : ''}
                                        </div>
                                        <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-xs flex-shrink-0">arrow_forward</span>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    async init() {
        this.destination = null;
        this.searchQuery = '';
        this.matchedTransitOptions = [];

        await this.fetchInitialData();

        // Initialize Clean Map with Bengaluru User Location Pin
        MapUtils.initMap('home-map', [this.userLocation.lat, this.userLocation.lng], 13, { hideZoom: true });
        MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng);

        // Draw Route 378 and render active live buses
        if (this.stops && this.stops.length > 1) {
            MapUtils.drawRoute('route_blr_378', this.stops, '#1a73e8');
            MapUtils.renderStops(this.stops);
        }
        if (this.activeTrips && this.activeTrips.length > 0) {
            MapUtils.renderBuses(this.activeTrips);
        }

        // Live polling every 2.5s for real-time bus motion & synced ETAs
        if (this.livePollInterval) clearInterval(this.livePollInterval);
        this.livePollInterval = setInterval(async () => {
            if (window.app && window.app.currentView === 'home') {
                await this.pollLiveActiveTrips();
            }
        }, 2500);

        setTimeout(() => {
            if (MapUtils.map) MapUtils.map.invalidateSize();
        }, 150);
    },

    destroy() {
        if (this.livePollInterval) {
            clearInterval(this.livePollInterval);
            this.livePollInterval = null;
        }
    },

    async pollLiveActiveTrips() {
        try {
            const tripsRes = await API.getActiveTrips();
            if (!tripsRes || !tripsRes.trips) return;
            this.activeTrips = tripsRes.trips;

            // Render/update live moving bus markers on map
            MapUtils.renderBuses(this.activeTrips);

            // If destination is chosen, update transit options
            if (this.destination) {
                const route378 = this.routes.find(r => r.route_number === '378') || this.routes[0];
                this.matchedTransitOptions = this.activeTrips.map(trip => ({
                    route: route378,
                    trip: trip
                }));

                const resultsEl = document.getElementById('transit-results-section');
                if (resultsEl) {
                    resultsEl.innerHTML = this.renderDestinationOrSuggestions();
                }
            }
        } catch (e) {}
    },

    toggleMapType() {
        const nextType = MapUtils.currentMapType === 'satellite' ? 'roadmap' : 'satellite';
        MapUtils.applyTileLayer(nextType);

        const btnLabel = document.getElementById('map-type-label');
        if (btnLabel) {
            btnLabel.textContent = nextType === 'satellite' ? 
                (I18n.t('home.roadmap') || 'Map') : 
                (I18n.t('home.satellite') || 'Satellite');
        }

        if (window.NotificationUtils && typeof window.NotificationUtils.showToast === 'function') {
            NotificationUtils.showToast(
                nextType === 'satellite' ? '🛰️ Google Satellite View' : '🗺️ Google Maps Roadmap',
                'info',
                1200
            );
        }
    },

    async fetchInitialData() {
        try {
            const [routesRes, tripsRes, stopsRes] = await Promise.all([
                API.getRoutes(),
                API.getActiveTrips(),
                API.getStops()
            ]);

            this.routes = routesRes.routes || [];
            this.activeTrips = tripsRes.trips || [];
            this.stops = stopsRes.stops || [];

            // Set user default location to Electronic City Toll Gate / Phase 1
            const originStop = this.stops.find(s => s.id === 'stop_blr_01' || s.name.includes('Electronic City'));
            if (originStop) {
                this.userLocation = {
                    lat: originStop.latitude,
                    lng: originStop.longitude,
                    name: originStop.name
                };
            }
        } catch (e) {
            console.error('Failed to load data', e);
        }
    },

    handleSearchInput(value) {
        this.searchQuery = value || '';
        this.destination = null; // NEVER autofill; allow user to freely type!

        // Update clear button visibility
        const clearBtn = document.getElementById('dest-clear-btn');
        if (clearBtn) {
            if (this.searchQuery.trim()) {
                clearBtn.classList.remove('hidden');
            } else {
                clearBtn.classList.add('hidden');
            }
        }

        const resultsEl = document.getElementById('transit-results-section');
        if (resultsEl) {
            resultsEl.innerHTML = this.renderDestinationOrSuggestions();
        }
    },

    handleSearchSubmit(value) {
        const query = (value || '').trim().toLowerCase();
        if (!query) return;

        const matches = this.getMatchingStops(query);
        if (matches.length > 0) {
            this.selectDestination(matches[0].name, matches[0].name);
        }
    },

    async selectDestination(destName, query) {
        this.searchQuery = '';
        const destInput = document.getElementById('destination-input');
        if (destInput) destInput.value = I18n.translateStop(destName) || destName;

        const clearBtn = document.getElementById('dest-clear-btn');
        if (clearBtn) clearBtn.classList.remove('hidden');

        // Find destination coordinates along Route 378
        const foundStop = this.stops.find(s => s.name.toLowerCase() === destName.toLowerCase()) ||
                          this.stops.find(s => s.name.toLowerCase().includes(destName.toLowerCase())) ||
                          this.stops.find(s => s.name.toLowerCase().includes((query || '').toLowerCase()));

        let destLat = 12.9081;
        let destLng = 77.4835;

        if (foundStop) {
            destLat = foundStop.latitude;
            destLng = foundStop.longitude;
        }

        this.destination = {
            name: destName,
            lat: destLat,
            lng: destLng
        };

        // Match Route 378
        const route378 = this.routes.find(r => r.route_number === '378') || this.routes[0];
        this.matchedTransitOptions = this.activeTrips.map(trip => ({
            route: route378,
            trip: trip
        }));

        if (this.matchedTransitOptions.length === 0 && route378) {
            this.matchedTransitOptions = [{ route: route378, trip: this.activeTrips[0] || null }];
        }

        // Update Map: Draw Route Line and Destination Pin
        MapUtils.clearRoutesAndBuses();
        MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng);
        MapUtils.addDestinationMarker(this.destination.lat, this.destination.lng, I18n.translateStop(destName) || destName);

        // Draw Route Line
        if (this.stops && this.stops.length > 0) {
            MapUtils.drawRoute('route_blr_378', this.stops, '#1a73e8');
            MapUtils.renderStops(this.stops);
        }

        MapUtils.renderBuses(this.activeTrips);

        const resultsEl = document.getElementById('transit-results-section');
        if (resultsEl) {
            resultsEl.innerHTML = this.renderDestinationOrSuggestions();
        }

        const mapLabel = document.getElementById('map-status-label');
        if (mapLabel) mapLabel.textContent = `${I18n.t('home.route_calculated') || 'Route to'} ${I18n.translateStop(destName) || destName}`;
    },

    clearDestination() {
        this.destination = null;
        this.searchQuery = '';
        this.matchedTransitOptions = [];

        const destInput = document.getElementById('destination-input');
        if (destInput) destInput.value = '';

        const clearBtn = document.getElementById('dest-clear-btn');
        if (clearBtn) clearBtn.classList.add('hidden');

        // Reset map to full route & all moving buses
        MapUtils.clearRoutesAndBuses();
        MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng);

        if (this.stops && this.stops.length > 1) {
            MapUtils.drawRoute('route_blr_378', this.stops, '#1a73e8');
            MapUtils.renderStops(this.stops);
        }

        if (this.activeTrips && this.activeTrips.length > 0) {
            MapUtils.renderBuses(this.activeTrips);
        }

        const resultsEl = document.getElementById('transit-results-section');
        if (resultsEl) {
            resultsEl.innerHTML = this.renderDestinationOrSuggestions();
        }

        const mapLabel = document.getElementById('map-status-label');
        if (mapLabel) mapLabel.textContent = I18n.t('home.map_label') || 'Bengaluru Location';
    },

    startJourney(tripId) {
        if (tripId) {
            window.app.navigate('trips', { tripId });
        } else if (this.activeTrips.length > 0) {
            window.app.navigate('trips', { tripId: this.activeTrips[0].id });
        } else {
            window.app.navigate('trips');
        }
    },

    detectGPSLocation() {
        if (!navigator.geolocation) {
            NotificationUtils.showToast('GPS Status', 'Using default Electronic City junction', 'info');
            return;
        }

        NotificationUtils.showToast('Locating', 'Fetching real-time GPS location...', 'info', 1500);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.userLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    name: 'My GPS Location'
                };
                MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng);
                const label = document.getElementById('origin-label');
                if (label) label.innerHTML = `<span class="material-symbols-outlined text-secondary text-sm" style="font-variation-settings: 'FILL' 1;">my_location</span> ${I18n.translateStop(this.userLocation.name)}`;
                NotificationUtils.showToast('GPS Active', 'Location updated', 'success');
                if (this.destination) {
                    this.selectDestination(this.destination.name, this.destination.name);
                }
            },
            () => {
                this.userLocation = {
                    lat: 12.8452,
                    lng: 77.6602,
                    name: 'Electronic City Toll Gate / Phase 1'
                };
                MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng);
                NotificationUtils.showToast('Location Pin', 'Centered on Electronic City Hub', 'info');
            }
        );
    }
};
