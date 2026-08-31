/**
 * Lumina Transit - Home View (Bengaluru BMTC Transit Network)
 * Google Maps Style Flow:
 * 1. Clean map showing Bengaluru current location
 * 2. User searches/taps destination without autofill
 * 3. Shows available BMTC buses with arrival ETAs, fares & crowd levels
 * 4. Google Maps Turn-by-Turn GPS Walking Walkthrough to Nearest Bus Stop
 * 5. Smart Multi-Bus Comparison & Recommendation (Best bus to board out of the 4 active buses)
 * 6. True Full-Screen Map Expansion
 * 7. Fully internationalized: English, Kannada (ಕನ್ನಡ), Hindi (हिन्दी)
 */
const HomeView = {
    routes: [],
    activeTrips: [],
    stops: [],
    userLocation: { lat: 12.9245, lng: 77.5180, name: 'RR Nagar / Uttarahalli Corridor' },
    destination: null,
    searchQuery: '',
    matchedTransitOptions: [],
    livePollInterval: null,
    isMapEnlarged: false,
    nearestStopInfo: null,
    walkingSteps: [],
    isWalkingGuidanceOpen: false,

    // Live Walking Navigation State
    isNavigatingWalk: false,
    navCurrentStepIndex: 0,
    navWatchId: null,
    navSimulatedIdx: 0,
    isVoiceMuted: false,
    autoWalkTimer: null,
    hasArrivedAtStop: false,
    lastSpokenStepIndex: -1,

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
                
                <!-- Quick Emergency SOS Response Bar -->
                <div class="glass-panel rounded-2xl p-2.5 px-3.5 bg-gradient-to-r from-error/20 via-surface-container-high to-surface-container border border-error/30 flex items-center justify-between shadow-md">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-error text-lg font-bold animate-pulse">emergency</span>
                        <span class="text-xs font-bold text-on-surface">Emergency Response Needed?</span>
                    </div>
                    <button 
                        onclick="app.showEmergencyModal()"
                        class="px-3 py-1 bg-error hover:bg-red-600 text-white rounded-xl text-[11px] font-extrabold flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer border border-white/20"
                    >
                        <span>Call SOS Helplines</span>
                        <span class="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                </div>

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

                <!-- Clean Location Map (Google Maps Interface with Interactive Zoom & Enlarge Controls) -->
                <section class="relative" id="home-map-section">
                    <!-- Map restoration anchor placeholder -->
                    <div id="home-map-placeholder" class="hidden"></div>
                    
                    <!-- Live Google Maps Navigation Top HUD Banner -->
                    ${this.isNavigatingWalk ? this.renderLiveNavigationTopHUD() : ''}

                    <div id="home-map-container" class="relative w-full ${this.isMapEnlarged ? 'map-fullscreen' : 'h-[240px]'} rounded-transit overflow-hidden border border-white/10 shadow-2xl bg-surface-container-low transition-all duration-300">
                        <div id="home-map" class="w-full h-full"></div>
                        
                        <!-- Top Left: Enlarge Map / Close (X) Button -->
                        <div class="absolute top-3 left-3 z-[400] flex items-center gap-2">
                            <!-- Enlarge Button -->
                            <button 
                                id="map-expand-btn"
                                onclick="HomeView.toggleMapEnlarge(true)"
                                class="glass-panel text-on-surface hover:text-primary px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all cursor-pointer ${this.isMapEnlarged ? 'hidden' : ''}"
                                title="${I18n.t('home.enlarge_map') || 'Enlarge Map to Fullscreen'}"
                            >
                                <span class="material-symbols-outlined text-sm text-primary">open_in_full</span>
                                <span class="text-[11px] font-semibold">${I18n.t('home.enlarge_map') || 'Enlarge'}</span>
                            </button>

                            <!-- Close (X) Button when Enlarged -->
                            <button 
                                id="map-close-btn"
                                onclick="HomeView.toggleMapEnlarge(false)"
                                class="bg-surface-container-highest/95 hover:bg-error text-on-surface hover:text-white px-3 py-1.5 rounded-xl shadow-2xl flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all border border-white/20 cursor-pointer ${this.isMapEnlarged ? '' : 'hidden'}"
                                title="${I18n.t('home.close_map') || 'Close Fullscreen'}"
                            >
                                <span class="material-symbols-outlined text-base">close</span>
                                <span class="text-[11px]">${I18n.t('home.close_map') || 'Normal Size'}</span>
                            </button>
                        </div>

                        <!-- Top Right Controls: Satellite Layer Switcher & Zoom (+ / -) -->
                        <div class="absolute top-3 right-3 z-[400] flex flex-col items-end gap-2">
                            <!-- Google Maps Layer Switcher -->
                            <button 
                                onclick="HomeView.toggleMapType()"
                                class="glass-panel text-on-surface hover:text-primary px-2.5 py-1.5 rounded-xl shadow-md flex items-center gap-1 text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
                                title="Toggle Google Maps Satellite / Default"
                                id="map-type-btn"
                            >
                                <span class="material-symbols-outlined text-sm text-primary">layers</span>
                                <span id="map-type-label">${I18n.t('home.satellite')}</span>
                            </button>

                            <!-- Floating Zoom In / Zoom Out Controls -->
                            <div class="glass-panel rounded-xl shadow-xl border border-white/10 flex flex-col overflow-hidden bg-surface-container/90 backdrop-blur-md">
                                <button 
                                    onclick="HomeView.zoomIn()" 
                                    class="p-2 hover:bg-primary/20 text-on-surface hover:text-primary active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                                    title="Zoom In (+)"
                                    aria-label="Zoom In"
                                >
                                    <span class="material-symbols-outlined text-lg font-bold">add</span>
                                </button>
                                <div class="w-full h-px bg-white/10"></div>
                                <button 
                                    onclick="HomeView.zoomOut()" 
                                    class="p-2 hover:bg-primary/20 text-on-surface hover:text-primary active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                                    title="Zoom Out (-)"
                                    aria-label="Zoom Out"
                                >
                                    <span class="material-symbols-outlined text-lg font-bold">remove</span>
                                </button>
                            </div>
                        </div>

                        <!-- HUD Status Badge -->
                        ${!this.isNavigatingWalk ? `
                            <div class="absolute bottom-3 left-3 glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg pointer-events-none z-[400] max-w-[70%] truncate">
                                <div class="w-2 h-2 rounded-full ${this.destination ? 'bg-primary' : 'bg-secondary'} shrink-0"></div>
                                <span class="font-label-sm text-[11px] text-on-surface font-medium truncate" id="map-status-label">
                                    ${this.nearestStopInfo ? `🚶 ${this.nearestStopInfo.distanceText} to ${I18n.translateStop(this.nearestStopInfo.stop.name)}` : I18n.t('home.map_label')}
                                </span>
                            </div>
                        ` : ''}

                        <!-- Recenter GPS Button -->
                        <button 
                            onclick="HomeView.recenterMap()"
                            class="absolute bottom-3 right-3 bg-primary text-on-primary p-2.5 rounded-full shadow-[0_2px_12px_rgba(26,115,232,0.4)] hover:bg-primary-fixed active:scale-90 transition-all z-[400] flex items-center justify-center cursor-pointer"
                            title="Recenter GPS Location"
                        >
                            <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">my_location</span>
                        </button>
                    </div>

                    <!-- Live Google Maps Navigation Bottom Control HUD -->
                    ${this.isNavigatingWalk ? this.renderLiveNavigationBottomHUD() : ''}
                </section>

                <!-- Results & Options Container -->
                <div id="transit-results-section" class="space-y-3">
                    ${this.renderDestinationOrSuggestions()}
                </div>
            </div>
        `;
    },

    /* =========================================================================
       GOOGLE MAPS LIVE WALKING NAVIGATION HUD
       ========================================================================= */

    renderLiveNavigationTopHUD() {
        const steps = this.walkingSteps || [];
        const currentIdx = Math.min(this.navCurrentStepIndex, Math.max(0, steps.length - 1));
        const currentStep = steps[currentIdx] || null;
        const nextStep = steps[currentIdx + 1] || null;

        let iconName = 'directions_walk';
        let stepDist = currentStep ? Math.round(currentStep.distance) : 0;
        let mainText = 'Head towards bus stop';
        let subText = nextStep ? `Then ${this.formatManeuverText(nextStep)}` : 'Follow blue road line to bus stop';

        if (currentStep && currentStep.maneuver) {
            const mType = currentStep.maneuver.type;
            const mod = (currentStep.maneuver.modifier || '').replace('_', ' ');

            if (mType === 'arrive' || currentIdx === steps.length - 1) {
                iconName = 'pin_drop';
                mainText = `Arrive at ${this.nearestStopInfo?.stop ? I18n.translateStop(this.nearestStopInfo.stop.name) : 'Bus Stop'}`;
                subText = 'Board your scheduled BMTC Bus 378';
            } else if (mType === 'depart') {
                iconName = 'straight';
                mainText = `Head ${mod || 'forward'} on ${currentStep.name ? currentStep.name : 'road'}`;
            } else if (mod.includes('left')) {
                iconName = 'turn_left';
                mainText = `Turn ${mod} onto ${currentStep.name ? currentStep.name : 'road'}`;
            } else if (mod.includes('right')) {
                iconName = 'turn_right';
                mainText = `Turn ${mod} onto ${currentStep.name ? currentStep.name : 'road'}`;
            } else {
                iconName = 'navigation';
                mainText = `Continue on ${currentStep.name ? currentStep.name : 'road'}`;
            }
        }

        return `
            <div class="mb-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-3.5 shadow-2xl border border-emerald-400/40 relative overflow-hidden animate-fadeIn">
                <!-- Glowing Top Navigation Bar -->
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-white shadow-inner shrink-0">
                            <span class="material-symbols-outlined text-2xl font-bold">${iconName}</span>
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2">
                                <span class="bg-black/25 text-emerald-200 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    ${stepDist > 0 ? `In ${stepDist} m` : 'Now'}
                                </span>
                                <span class="text-[10px] text-white/80 font-medium">Step ${currentIdx + 1} of ${steps.length || 1}</span>
                            </div>
                            <h3 class="font-bold text-sm text-white leading-tight mt-0.5 truncate">${mainText}</h3>
                            <p class="text-[11px] text-emerald-100/90 truncate mt-0.5">${subText}</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                        <button 
                            onclick="HomeView.toggleVoiceMute()" 
                            class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs cursor-pointer active:scale-90 transition-all"
                            title="${this.isVoiceMuted ? 'Unmute Voice Guidance' : 'Mute Voice Guidance'}"
                        >
                            <span class="material-symbols-outlined text-base">${this.isVoiceMuted ? 'volume_off' : 'volume_up'}</span>
                        </button>
                        <button 
                            onclick="HomeView.stopWalkthrough()" 
                            class="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white text-xs cursor-pointer active:scale-90 transition-all"
                            title="Exit Walk Navigation"
                        >
                            <span class="material-symbols-outlined text-base">close</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderLiveNavigationBottomHUD() {
        const dist = this.nearestStopInfo?.distanceText || '1.8 km';
        const mins = this.nearestStopInfo?.walkingMins || 3;
        const stopName = this.nearestStopInfo?.stop ? I18n.translateStop(this.nearestStopInfo.stop.name) : 'Bus Stop';

        // Calculate dynamic ETA time
        const now = new Date();
        now.setMinutes(now.getMinutes() + mins);
        const etaTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="mt-2 glass-panel rounded-2xl p-3 border border-emerald-500/40 bg-surface-container-high/95 shadow-2xl space-y-2.5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="text-left">
                            <span class="text-[10px] text-on-surface-variant uppercase font-bold">Remaining Walk</span>
                            <div class="text-base font-extrabold text-emerald-400 font-status-number">${dist}</div>
                        </div>
                        <div class="w-px h-7 bg-white/10"></div>
                        <div class="text-left">
                            <span class="text-[10px] text-on-surface-variant uppercase font-bold">Duration</span>
                            <div class="text-sm font-bold text-on-surface font-status-number">~${mins} mins</div>
                        </div>
                        <div class="w-px h-7 bg-white/10"></div>
                        <div class="text-left">
                            <span class="text-[10px] text-on-surface-variant uppercase font-bold">Stop ETA</span>
                            <div class="text-sm font-bold text-secondary font-status-number">${etaTime}</div>
                        </div>
                    </div>

                    <div class="text-right">
                        <span class="text-[9.5px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold">
                            Destination: ${stopName}
                        </span>
                    </div>
                </div>

                <!-- Simulation & Interactive Walk Controls -->
                <div class="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button 
                        onclick="HomeView.simulateWalkStep()"
                        class="flex-1 py-1.5 px-2.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        title="Simulate walking step-by-step along road"
                    >
                        <span class="material-symbols-outlined text-sm">nordic_walking</span>
                        <span>Walk Step</span>
                    </button>

                    <button 
                        onclick="HomeView.toggleAutoWalk()"
                        class="flex-1 py-1.5 px-2.5 rounded-xl ${this.autoWalkTimer ? 'bg-secondary text-on-secondary shadow-md' : 'bg-surface-container hover:bg-surface-container-highest text-on-surface border border-white/10'} text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        title="Toggle automatic road walk simulation"
                    >
                        <span class="material-symbols-outlined text-sm">${this.autoWalkTimer ? 'pause' : 'play_arrow'}</span>
                        <span>${this.autoWalkTimer ? 'Pause Walk' : 'Auto Walk'}</span>
                    </button>

                    <button 
                        onclick="HomeView.stopWalkthrough()" 
                        class="py-1.5 px-3 rounded-xl bg-error/20 hover:bg-error/30 text-error border border-error/30 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        title="Exit Walk Navigation"
                    >
                        <span class="material-symbols-outlined text-sm">cancel</span>
                        <span>Exit</span>
                    </button>
                </div>
            </div>
        `;
    },

    formatManeuverText(step) {
        if (!step || !step.maneuver) return '';
        const mType = step.maneuver.type;
        const mod = (step.maneuver.modifier || '').replace('_', ' ');
        if (mType === 'arrive') return `arrive at bus stop (${Math.round(step.distance)}m)`;
        if (mod) return `turn ${mod} onto ${step.name || 'road'} (${Math.round(step.distance)}m)`;
        return `continue onto ${step.name || 'road'} (${Math.round(step.distance)}m)`;
    },

    /* =========================================================================
       ACCURATE REAL-TIME MULTI-BUS COMPARISON & RECOMMENDATION ENGINE
       ========================================================================= */

    calculateBestBus(waitingStop, destinationStop) {
        if (!waitingStop || !this.activeTrips || this.activeTrips.length === 0) {
            return [];
        }

        const waitStopName = waitingStop.name.toLowerCase();
        const waitStopIdx = this.stops.findIndex(s => s.name.toLowerCase() === waitStopName || s.id === waitingStop.id);

        let destStopIdx = -1;
        if (destinationStop) {
            const destStopName = destinationStop.name.toLowerCase();
            destStopIdx = this.stops.findIndex(s => s.name.toLowerCase() === destStopName || s.id === destinationStop.id);
        }

        // Determine travel direction
        let targetDirection = 'outbound';
        if (destStopIdx !== -1 && waitStopIdx !== -1) {
            targetDirection = destStopIdx < waitStopIdx ? 'inbound' : 'outbound';
        }

        const scoredBuses = this.activeTrips.map((trip) => {
            let score = 100;
            let reasons = [];
            let isRightDirection = (trip.direction === targetDirection);

            // Find where this bus currently is in master stops list
            let busStopIdx = -1;
            if (trip.current_stop_name) {
                busStopIdx = this.stops.findIndex(s => s.name.toLowerCase() === trip.current_stop_name.toLowerCase());
            }
            if (busStopIdx === -1 && trip.next_stop_name) {
                const nextIdx = this.stops.findIndex(s => s.name.toLowerCase() === trip.next_stop_name.toLowerCase());
                if (nextIdx !== -1) {
                    busStopIdx = trip.direction === 'outbound' ? Math.max(0, nextIdx - 1) : Math.min(this.stops.length - 1, nextIdx + 1);
                }
            }
            if (busStopIdx === -1) {
                busStopIdx = trip.direction === 'outbound' ? (trip.current_stop_index || 0) : (this.stops.length - 1 - (trip.current_stop_index || 0));
            }

            let waitTimeMins = 3;

            if (isRightDirection) {
                score += 50;
                let stopsAway = 0;
                if (trip.direction === 'outbound') {
                    stopsAway = waitStopIdx - busStopIdx;
                } else {
                    stopsAway = busStopIdx - waitStopIdx;
                }

                if (stopsAway === 0) {
                    waitTimeMins = Math.max(1, Math.round((trip.dwell_seconds || 15) / 60) + 1);
                    score += 60;
                    reasons.push(`Arriving at ${I18n.translateStop(waitingStop.name)} in ~${waitTimeMins} mins`);
                } else if (stopsAway > 0) {
                    waitTimeMins = Math.max(2, Math.round(stopsAway * 2.8));
                    score += Math.max(0, 60 - (waitTimeMins * 3));
                    reasons.push(`Approaching (${stopsAway} stop${stopsAway > 1 ? 's' : ''} away) • ETA ~${waitTimeMins} mins`);
                } else {
                    waitTimeMins = 18 + Math.abs(stopsAway) * 2;
                    score -= 30;
                    reasons.push(`Next cycle bus • ETA ~${waitTimeMins} mins`);
                }
            } else {
                score -= 60;
                waitTimeMins = 25;
                reasons.push(`Opposite Direction (${trip.direction === 'outbound' ? 'To Kengeri' : 'To Electronic City'})`);
            }

            // Crowd & Seating comfort
            const cap = trip.capacity || 55;
            const currentPass = trip.current_passenger_count || 16;
            const freeSeats = Math.max(0, cap - currentPass);
            const occupancy = currentPass / cap;

            if (occupancy <= 0.35) {
                score += 40;
                reasons.push(`Plenty of Seats Available (${freeSeats} open seats)`);
            } else if (occupancy <= 0.70) {
                score += 15;
                reasons.push(`Moderate Seating (${currentPass}/${cap} passengers)`);
            } else {
                score -= 20;
                reasons.push(`Very Crowded (${currentPass}/${cap} passengers)`);
            }

            if ((trip.delay_minutes || 0) <= 0) {
                score += 10;
                reasons.push('On Schedule');
            } else {
                score -= (trip.delay_minutes * 4);
                reasons.push(`Delay +${trip.delay_minutes}m`);
            }

            return {
                trip,
                score,
                waitTimeMins,
                freeSeats,
                occupancyPct: Math.round(occupancy * 100),
                isRightDirection,
                reasons,
                badge: '',
                badgeColor: ''
            };
        });

        // Sort descending
        scoredBuses.sort((a, b) => b.score - a.score);

        if (scoredBuses.length > 0) {
            scoredBuses[0].isBest = true;
            scoredBuses[0].badge = '🏆 BEST CHOICE';
            scoredBuses[0].badgeColor = 'bg-emerald-500 text-white';

            for (let i = 1; i < scoredBuses.length; i++) {
                const item = scoredBuses[i];
                if (!item.isRightDirection) {
                    item.badge = '🔄 OPPOSITE DIRECTION';
                    item.badgeColor = 'bg-slate-700 text-slate-300';
                } else if (item.waitTimeMins <= scoredBuses[0].waitTimeMins) {
                    item.badge = '⚡ FASTEST ARRIVAL';
                    item.badgeColor = 'bg-blue-500 text-white';
                } else if (item.occupancyPct < scoredBuses[0].occupancyPct) {
                    item.badge = '💺 LOW CROWD ALTERNATIVE';
                    item.badgeColor = 'bg-cyan-500 text-white';
                } else {
                    item.badge = `⏳ NEXT BUS (~${item.waitTimeMins}m)`;
                    item.badgeColor = 'bg-slate-700 text-slate-300';
                }
            }
        }

        return scoredBuses;
    },

    renderBestBusHeroBanner(scoredBuses) {
        if (!scoredBuses || scoredBuses.length === 0) return '';
        const best = scoredBuses[0];
        const waitStopName = this.nearestStopInfo?.stop ? I18n.translateStop(this.nearestStopInfo.stop.name) : 'Your Waiting Stop';
        const destDisplayName = this.destination ? I18n.translateStop(this.destination.name) : 'Destination';

        return `
            <div class="glass-panel rounded-2xl p-4 border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-500/15 via-surface-container-high to-surface-container shadow-2xl relative overflow-hidden space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-xl">⭐</span>
                        <div>
                            <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">SMART BMTC TRANSIT AI</span>
                            <h4 class="font-bold text-sm text-on-surface">Recommended Bus: <span class="text-primary font-status-number">${best.trip.bus_number || 'KA-57-F-3782'}</span></h4>
                        </div>
                    </div>
                    <span class="bg-emerald-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md animate-pulse">#1 BEST CHOICE</span>
                </div>
                
                <div class="bg-surface-container-lowest/80 rounded-xl p-3 border border-white/5 space-y-1.5 text-xs">
                    <div class="text-[11.5px] text-on-surface font-semibold flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-secondary text-sm">schedule</span>
                        <span>Arrives at <strong class="text-secondary">${waitStopName}</strong> in <strong class="text-emerald-400 font-status-number">~${best.waitTimeMins} mins</strong></span>
                    </div>
                    <div class="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-primary text-sm">airline_seat_recline_normal</span>
                        <span><strong>${best.freeSeats} Free Seats</strong> available (${best.trip.current_passenger_count}/${best.trip.capacity || 55} passengers)</span>
                    </div>
                    <div class="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-tertiary text-sm">trending_flat</span>
                        <span>Direct route to <strong class="text-on-surface">${destDisplayName}</strong> • Shortest total trip time</span>
                    </div>
                </div>

                <button 
                    onclick="HomeView.startJourney('${best.trip.id}')"
                    class="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all shadow-lg cursor-pointer"
                >
                    <span>Board Recommended Bus (${best.trip.bus_number})</span>
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
            </div>
        `;
    },

    /* =========================================================================
       DESTINATIONS & TRANSIT CARDS RENDERER
       ========================================================================= */

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

            // Calculate intelligent recommendation across all 4 buses
            const scoredBuses = this.calculateBestBus(this.nearestStopInfo?.stop, this.destination);

            const nearestStopCard = this.nearestStopInfo && this.nearestStopInfo.stop ? `
                <div class="glass-panel rounded-2xl p-4 shadow-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-surface-container to-surface-container space-y-3 relative overflow-hidden">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-[0_0_10px_rgba(26,115,232,0.4)] shrink-0">
                                <span class="material-symbols-outlined text-xl font-bold">directions_walk</span>
                            </div>
                            <div>
                                <span class="text-[10px] text-primary font-extrabold uppercase tracking-wider">${I18n.t('home.nearest_bus_stop') || 'Nearest Boarding Bus Stop'}</span>
                                <h4 class="font-bold text-sm text-on-surface flex items-center gap-1.5">
                                    <span>${I18n.translateStop(this.nearestStopInfo.stop.name)}</span>
                                    ${this.nearestStopInfo.stop.is_major ? `<span class="bg-primary/20 text-primary text-[9px] font-bold px-1.5 py-0.2 rounded-full">HUB</span>` : ''}
                                </h4>
                            </div>
                        </div>
                        ${this.nearestStopInfo.isAtStop ? `
                            <span class="bg-secondary/20 text-secondary border border-secondary/30 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shrink-0">
                                <span class="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                                <span>AT STOP</span>
                            </span>
                        ` : `
                            <div class="text-right shrink-0">
                                <div class="text-xs font-bold text-secondary font-status-number">${this.nearestStopInfo.distanceText}</div>
                                <div class="text-[10px] text-on-surface-variant font-medium">~${this.nearestStopInfo.walkingMins} mins walk</div>
                            </div>
                        `}
                    </div>

                    <!-- Walking Road Summary & Guidance Actions (Cleaned up, no extra Map button) -->
                    <div class="bg-surface-container-high/90 rounded-xl p-2.5 border border-white/5 flex flex-col gap-2 text-xs">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2 min-w-0 pr-1">
                                <span class="material-symbols-outlined text-primary text-base shrink-0">navigation</span>
                                <span class="text-[11.5px] text-on-surface leading-tight truncate">
                                    ${this.nearestStopInfo.isAtStop ? 
                                        (I18n.t('home.already_at_nearest') || 'You are at this bus stop • Ready to board!') : 
                                        `Walk <strong class="text-primary">${this.nearestStopInfo.distanceText}</strong> (~<strong class="text-secondary">${this.nearestStopInfo.walkingMins} mins</strong>) via road to <strong class="text-on-surface">${I18n.translateStop(this.nearestStopInfo.stop.name)}</strong>`
                                    }
                                </span>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                                <!-- Google Maps Walking Walkthrough Button -->
                                <button 
                                    onclick="${this.isNavigatingWalk ? 'HomeView.stopWalkthrough()' : 'HomeView.startWalkthrough()'}"
                                    class="px-3 py-1.5 rounded-lg ${this.isNavigatingWalk ? 'bg-error text-white font-extrabold' : 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold'} text-[11px] border border-white/20 transition-all flex items-center gap-1 cursor-pointer shadow-md active:scale-95" 
                                    title="Start Google Maps Live Walking Navigation to this bus stop"
                                >
                                    <span class="material-symbols-outlined text-xs">${this.isNavigatingWalk ? 'stop' : 'explore'}</span>
                                    <span>${this.isNavigatingWalk ? 'Stop Walk' : '🚶 Walkthrough'}</span>
                                </button>

                                <button 
                                    onclick="HomeView.toggleWalkingGuidance()" 
                                    class="px-2.5 py-1.5 rounded-lg ${this.isWalkingGuidanceOpen ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-highest text-on-surface'} text-[11px] font-bold border border-white/10 transition-all flex items-center gap-1 cursor-pointer" 
                                    title="Show Turn-by-Turn Road Guidance"
                                >
                                    <span class="material-symbols-outlined text-xs">${this.isWalkingGuidanceOpen ? 'expand_less' : 'turn_right'}</span>
                                    <span>${this.isWalkingGuidanceOpen ? 'Hide' : 'Steps'}</span>
                                </button>
                            </div>
                        </div>

                        <!-- Expandable Turn-by-Turn Road Walking Directions -->
                        ${this.isWalkingGuidanceOpen ? this.renderWalkingGuidanceSteps() : ''}
                    </div>
                </div>
            ` : '';

            // AI Smart Multi-Bus Recommendation Hero Banner
            const recommendationBanner = this.renderBestBusHeroBanner(scoredBuses);

            return `
                <div class="space-y-3">
                    ${nearestStopCard}
                    ${recommendationBanner}

                    <div class="flex items-center justify-between px-1 pt-1">
                        <div>
                            <h3 class="font-headline-md text-sm font-bold text-on-surface">${I18n.t('home.available_buses_to', { dest: destDisplayName }) || `Available Buses to ${destDisplayName}`}</h3>
                            <p class="text-[11px] text-on-surface-variant">Live comparison across all active Route 378 buses (Updating live)</p>
                        </div>
                        <button onclick="HomeView.clearDestination()" class="text-xs text-primary font-semibold hover:underline cursor-pointer">
                            ${I18n.t('home.change_stop') || 'Change Stop'}
                        </button>
                    </div>

                    <div class="space-y-2.5">
                        ${scoredBuses.map((scored) => {
                            const opt = { route: this.routes[0] || { route_number: '378', fare_lkr: 25 }, trip: scored.trip };
                            const crowdLevel = opt.trip?.crowd_level || 'low';
                            let crowdBadge = '';
                            if (crowdLevel === 'low') {
                                crowdBadge = `<span class="bg-secondary/20 text-secondary border border-secondary/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold">${I18n.t('crowd.plenty_seats') || 'Plenty of Seats'} (${scored.freeSeats} free)</span>`;
                            } else if (crowdLevel === 'medium') {
                                crowdBadge = `<span class="bg-tertiary/20 text-tertiary border border-tertiary/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold">${I18n.t('crowd.standing_room') || 'Standing Room'} (${opt.trip?.current_passenger_count || 32} pax)</span>`;
                            } else {
                                crowdBadge = `<span class="bg-error/20 text-error border border-error/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold">${I18n.t('crowd.very_crowded') || 'Very Crowded'}</span>`;
                            }

                            const fare = opt.route?.fare_lkr || 25;
                            const isAtStop = opt.trip?.state === 'at_stop' || opt.trip?.current_speed_kmh === 0;
                            const dwellSec = opt.trip?.dwell_seconds != null ? opt.trip.dwell_seconds : 15;
                            const departedStopName = opt.trip?.current_stop_name || 'Electronic City';
                            const nextStopName = opt.trip?.next_stop_name || 'Hosa Road';

                            return `
                                <div class="glass-panel rounded-2xl p-4 shadow-xl border ${scored.isBest ? 'border-2 border-emerald-500/70 bg-gradient-to-r from-emerald-500/10 via-surface-container to-surface-container' : 'border-white/10'} hover:bg-surface-container-high transition-all">
                                    <div class="flex items-start justify-between mb-2">
                                        <div class="flex items-center gap-3">
                                            <div class="w-12 h-12 rounded-xl ${scored.isBest ? 'bg-emerald-500 text-white font-extrabold shadow-[0_0_14px_rgba(16,185,129,0.5)]' : 'bg-primary text-on-primary font-bold font-status-number'} text-base flex items-center justify-center">
                                                ${opt.route?.route_number || '378'}
                                            </div>
                                            <div>
                                                <div class="flex items-center gap-2 flex-wrap">
                                                    <h4 class="font-bold text-sm text-on-surface">Bus ${opt.trip?.bus_number || '378'}</h4>
                                                    ${scored.badge ? `
                                                        <span class="${scored.badgeColor} text-[9.5px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                                                            ${scored.badge}
                                                        </span>
                                                    ` : ''}
                                                    ${isAtStop ? `
                                                        <span class="bg-primary/20 text-primary border border-primary/30 text-[9.5px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                                                            <span>AT STOP (${dwellSec}s)</span>
                                                        </span>
                                                    ` : `
                                                        <span class="bg-secondary/20 text-secondary border border-secondary/30 text-[9.5px] px-1.5 py-0.2 rounded-full font-bold">${opt.trip?.current_speed_kmh || 26} km/h</span>
                                                    `}
                                                </div>
                                                <div class="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-2 font-medium">
                                                    <span>Wait at Stop: <strong class="text-secondary font-bold font-status-number">~${scored.waitTimeMins} mins</strong></span>
                                                    <span>•</span>
                                                    <span>₹${fare}</span>
                                                </div>
                                                <!-- Left From / Dwell Info -->
                                                <div class="mt-1 text-[10px] ${isAtStop ? 'text-primary' : 'text-gray-400'} font-semibold flex items-center gap-1">
                                                    <span class="material-symbols-outlined text-[13px]">${isAtStop ? 'hail' : 'departure_board'}</span>
                                                    <span>${isAtStop ? `Stopped at ${I18n.translateStop(departedStopName)} • Departs in ${dwellSec}s` : `Left: ${I18n.translateStop(departedStopName)} → Next: ${I18n.translateStop(nextStopName)}`}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex items-center justify-between pt-2 border-t border-white/10">
                                        ${crowdBadge}
                                        <button 
                                            class="px-4 py-2 rounded-xl ${scored.isBest ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold shadow-md' : 'bg-primary text-on-primary font-bold'} text-xs flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                                            onclick="HomeView.startJourney('${opt.trip?.id || ''}')"
                                        >
                                            <span>${scored.isBest ? 'Board Best Bus' : (I18n.t('home.track_join') || 'Track & Join')}</span>
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
                                    onclick="HomeView.selectDestination('${s.name.replace(/'/g, "\\'")}', '${this.searchQuery.replace(/'/g, "\\'")}')"
                                >
                                    <div class="flex items-center gap-2.5 min-w-0 pr-2">
                                        <div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors shrink-0">
                                            <span class="material-symbols-outlined text-sm">pin_drop</span>
                                        </div>
                                        <div class="min-w-0">
                                            <div class="font-semibold text-xs text-on-surface group-hover:text-primary transition-colors truncate">
                                                ${this.highlightMatch(translatedName, this.searchQuery)}
                                            </div>
                                            <div class="text-[10px] text-on-surface-variant truncate">
                                                ${s.zone || 'BMTC Route 378 Corridor'}
                                            </div>
                                        </div>
                                    </div>
                                    ${s.is_major ? `
                                        <span class="bg-primary/20 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                            ${I18n.t('home.hub') || 'HUB'}
                                        </span>
                                    ` : ''}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // State 3: Default Initial View -> Popular Route Destinations & Corridor Stops
        return `
            <div class="space-y-3">
                <div class="flex justify-between items-center px-1">
                    <h3 class="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider">
                        ${I18n.t('home.quick_destinations') || 'Popular Route 378 Destinations'}
                    </h3>
                    <span class="text-[10px] text-on-surface-variant">${I18n.t('home.tap_to_choose') || 'Tap to choose'}</span>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    ${this.popularDestinations.map(d => {
                        const displayName = I18n.t(d.key) || d.name;
                        return `
                            <button 
                                class="glass-panel rounded-2xl p-3 text-left hover:bg-surface-container-high active:scale-95 transition-all flex flex-col justify-between group shadow-sm border border-white/5 cursor-pointer"
                                onclick="HomeView.selectDestination('${d.stopName.replace(/'/g, "\\'")}', '${d.query.replace(/'/g, "\\'")}')"
                            >
                                <div class="flex items-center justify-between mb-2">
                                    <div class="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                                        <span class="material-symbols-outlined text-sm">location_on</span>
                                    </div>
                                    <span class="text-[10px] font-bold font-status-number text-secondary">Route ${d.routeNum}</span>
                                </div>
                                <div>
                                    <h4 class="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate">${displayName}</h4>
                                    <p class="text-[10px] text-on-surface-variant truncate">${I18n.t('home.route_direct') || 'Direct BMTC'}</p>
                                </div>
                            </button>
                        `;
                    }).join('')}
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

    /* =========================================================================
       INITIALIZATION & DATA LIFECYCLE
       ========================================================================= */

    async init() {
        this.destination = null;
        this.searchQuery = '';
        this.matchedTransitOptions = [];
        this.isNavigatingWalk = false;
        this.navSimulatedIdx = 0;
        this.hasArrivedAtStop = false;

        await this.fetchInitialData();

        // Calculate initial nearest stop from user location (defaults to RR Nagar / Uttarahalli corridor)
        const initialNearest = this.findNearestStop(this.userLocation.lat, this.userLocation.lng);
        this.nearestStopInfo = initialNearest;

        // Initialize Clean Map focused strictly on User Current Location Pin
        MapUtils.initMap('home-map', [this.userLocation.lat, this.userLocation.lng], 15, { hideZoom: true });
        MapUtils.clearRoutesAndBuses();
        MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng, true);

        // If nearest stop available, prepare initial walking road path to the stop
        if (initialNearest && initialNearest.stop) {
            const stopLat = initialNearest.stop.latitude || initialNearest.stop.lat;
            const stopLng = initialNearest.stop.longitude || initialNearest.stop.lng;
            MapUtils.drawWalkingPath(
                [this.userLocation.lat, this.userLocation.lng],
                [stopLat, stopLng],
                initialNearest.stop.name,
                initialNearest.distanceText,
                `${initialNearest.walkingMins} min`,
                (calc) => {
                    if (this.nearestStopInfo) {
                        this.nearestStopInfo.distanceMeters = calc.distanceMeters;
                        this.nearestStopInfo.distanceText = calc.distanceText;
                        this.nearestStopInfo.walkingMins = calc.walkingMins;
                        this.nearestStopInfo.isAtStop = calc.distanceMeters <= 50;
                        this.walkingSteps = calc.steps || [];
                    }
                }
            );
        }

        // Check for live device GPS to refine user location
        if (window.GPSUtils) {
            GPSUtils.getCurrentPosition().then(pos => {
                if (pos && pos.latitude && pos.longitude) {
                    this.userLocation.lat = pos.latitude;
                    this.userLocation.lng = pos.longitude;
                    MapUtils.setUserLocation(pos.latitude, pos.longitude, true);
                }
            }).catch(() => {});
        }

        // Live polling every 2s for real-time bus updates & continuous recommendation recalculation
        if (this.livePollInterval) clearInterval(this.livePollInterval);
        this.livePollInterval = setInterval(async () => {
            if (window.app && window.app.currentView === 'home') {
                await this.pollLiveActiveTrips();
            }
        }, 2000);

        setTimeout(() => {
            if (MapUtils.map) MapUtils.map.invalidateSize();
        }, 150);
    },

    destroy() {
        if (this.isMapEnlarged) {
            this.toggleMapEnlarge(false);
        }
        if (this.livePollInterval) {
            clearInterval(this.livePollInterval);
            this.livePollInterval = null;
        }
        if (this.isNavigatingWalk) {
            this.stopWalkthrough(true);
        }
    },

    async pollLiveActiveTrips() {
        try {
            const tripsRes = await API.getActiveTrips();
            if (!tripsRes || !tripsRes.trips) return;
            this.activeTrips = tripsRes.trips;

            if (this.destination) {
                MapUtils.renderBuses(this.activeTrips);

                const route378 = this.routes.find(r => r.route_number === '378') || this.routes[0];
                this.matchedTransitOptions = this.activeTrips.map(trip => ({
                    route: route378,
                    trip: trip
                }));

                // Keep updating the best bus recommendation live as buses move!
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
        } catch (e) {
            console.error('Failed to load data', e);
        }
    },

    handleSearchInput(value) {
        this.searchQuery = value || '';
        this.destination = null;

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

        // Find destination stop
        const foundStop = this.stops.find(s => s.name.toLowerCase() === destName.toLowerCase()) ||
                          this.stops.find(s => s.name.toLowerCase().includes(destName.toLowerCase())) ||
                          this.stops.find(s => s.name.toLowerCase().includes((query || '').toLowerCase()));

        let destLat = 12.8452;
        let destLng = 77.6602;

        if (foundStop) {
            destLat = foundStop.latitude;
            destLng = foundStop.longitude;
        }

        this.destination = {
            name: destName,
            lat: destLat,
            lng: destLng
        };

        // Calculate nearest bus stop to board from user GPS location
        const nearestInfo = this.findNearestStop(this.userLocation.lat, this.userLocation.lng);
        this.nearestStopInfo = nearestInfo;

        const route378 = this.routes.find(r => r.route_number === '378') || this.routes[0];
        this.matchedTransitOptions = this.activeTrips.map(trip => ({
            route: route378,
            trip: trip
        }));

        if (this.matchedTransitOptions.length === 0 && route378) {
            this.matchedTransitOptions = [{ route: route378, trip: this.activeTrips[0] || null }];
        }

        // Clean map: clear old route lines & markers
        MapUtils.clearRoutesAndBuses();
        MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng, false);

        // Draw Walking Path ONLY from user location to the nearest bus stop to board
        if (nearestInfo && nearestInfo.stop) {
            const stopLat = nearestInfo.stop.latitude || nearestInfo.stop.lat;
            const stopLng = nearestInfo.stop.longitude || nearestInfo.stop.lng;
            MapUtils.drawWalkingPath(
                [this.userLocation.lat, this.userLocation.lng],
                [stopLat, stopLng],
                nearestInfo.stop.name,
                nearestInfo.distanceText,
                `${nearestInfo.walkingMins} min`,
                (calc) => {
                    if (this.nearestStopInfo) {
                        this.nearestStopInfo.distanceMeters = calc.distanceMeters;
                        this.nearestStopInfo.distanceText = calc.distanceText;
                        this.nearestStopInfo.walkingMins = calc.walkingMins;
                        this.nearestStopInfo.isAtStop = calc.distanceMeters <= 50;
                        this.walkingSteps = calc.steps || [];

                        const resultsEl = document.getElementById('transit-results-section');
                        if (resultsEl) {
                            resultsEl.innerHTML = this.renderDestinationOrSuggestions();
                        }
                    }
                }
            );

            // Frame map view to focus ONLY on the walking route from user to nearest stop
            MapUtils.fitBounds([
                [this.userLocation.lat, this.userLocation.lng],
                [stopLat, stopLng]
            ], { padding: [50, 50] });
        }

        // Render buses on map
        MapUtils.renderBuses(this.activeTrips);

        const resultsEl = document.getElementById('transit-results-section');
        if (resultsEl) {
            resultsEl.innerHTML = this.renderDestinationOrSuggestions();
        }

        const mapLabel = document.getElementById('map-status-label');
        if (mapLabel) {
            mapLabel.textContent = nearestInfo && nearestInfo.stop ? 
                `🚶 ${nearestInfo.distanceText} to ${I18n.translateStop(nearestInfo.stop.name)}` : 
                `🚶 Walking Route to Bus Stop`;
        }
    },

    clearDestination() {
        this.destination = null;
        this.searchQuery = '';
        this.matchedTransitOptions = [];
        this.nearestStopInfo = this.findNearestStop(this.userLocation.lat, this.userLocation.lng);
        this.walkingSteps = [];
        this.isWalkingGuidanceOpen = false;
        this.stopWalkthrough();

        const destInput = document.getElementById('destination-input');
        if (destInput) destInput.value = '';

        const clearBtn = document.getElementById('dest-clear-btn');
        if (clearBtn) clearBtn.classList.add('hidden');

        // Reset map cleanly
        MapUtils.clearRoutesAndBuses();
        MapUtils.clearWalkingPath();
        MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng, true);

        const resultsEl = document.getElementById('transit-results-section');
        if (resultsEl) {
            resultsEl.innerHTML = this.renderDestinationOrSuggestions();
        }

        const mapLabel = document.getElementById('map-status-label');
        if (mapLabel) mapLabel.textContent = I18n.t('home.map_label') || 'Bengaluru Location';
    },

    zoomIn() {
        MapUtils.zoomIn();
    },

    zoomOut() {
        MapUtils.zoomOut();
    },

    recenterMap() {
        if (this.userLocation && MapUtils.map) {
            MapUtils.map.flyTo([this.userLocation.lat, this.userLocation.lng], 17, { duration: 0.6 });
        }
    },

    toggleMapEnlarge(expand = null) {
        this.isMapEnlarged = expand !== null ? expand : !this.isMapEnlarged;
        const container = document.getElementById('home-map-container');
        const placeholder = document.getElementById('home-map-placeholder');
        const expandBtn = document.getElementById('map-expand-btn');
        const closeBtn = document.getElementById('map-close-btn');

        if (container) {
            if (this.isMapEnlarged) {
                // Append directly to document.body to escape parent container bounds and guarantee true full screen display
                document.body.appendChild(container);
                container.classList.add('map-fullscreen');
                container.classList.remove('h-[240px]', 'rounded-transit');
                if (expandBtn) expandBtn.classList.add('hidden');
                if (closeBtn) closeBtn.classList.remove('hidden');
            } else {
                // Restore map container back inside home-map-section
                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.insertBefore(container, placeholder.nextSibling);
                }
                container.classList.remove('map-fullscreen');
                container.classList.add('h-[240px]', 'rounded-transit');
                if (expandBtn) expandBtn.classList.remove('hidden');
                if (closeBtn) closeBtn.classList.add('hidden');
            }
        }

        setTimeout(() => {
            if (MapUtils.map) {
                MapUtils.map.invalidateSize();
            }
        }, 150);
    },

    calculateDistanceMeters(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    },

    findNearestStop(userLat, userLng) {
        if (!this.stops || this.stops.length === 0) return null;
        let closestStop = null;
        let minDistance = Infinity;

        for (const stop of this.stops) {
            const lat = stop.latitude || stop.lat;
            const lng = stop.longitude || stop.lng;
            if (lat && lng) {
                const dist = this.calculateDistanceMeters(userLat, userLng, lat, lng);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestStop = stop;
                }
            }
        }

        if (!closestStop) return null;

        const distanceMeters = minDistance;
        const distanceText = distanceMeters < 1000 ? `${distanceMeters} m` : `${(distanceMeters / 1000).toFixed(1)} km`;
        const walkingMins = Math.max(1, Math.round(distanceMeters / 80));
        const isAtStop = distanceMeters <= 50;

        return {
            stop: closestStop,
            distanceMeters,
            distanceText,
            walkingMins,
            isAtStop
        };
    },

    toggleWalkingGuidance() {
        this.isWalkingGuidanceOpen = !this.isWalkingGuidanceOpen;
        const resultsEl = document.getElementById('transit-results-section');
        if (resultsEl) {
            resultsEl.innerHTML = this.renderDestinationOrSuggestions();
        }
    },

    focusStepLocation(lat, lng, stepIdx, instruction = '') {
        if (lat && lng && MapUtils.map) {
            MapUtils.focusTurn(lat, lng, 18);
            const mapContainer = document.getElementById('home-map-container');
            if (mapContainer && !this.isMapEnlarged) {
                mapContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            if (window.NotificationUtils && typeof window.NotificationUtils.showToast === 'function') {
                NotificationUtils.showToast(`🧭 Step ${stepIdx}`, instruction || 'Focused junction on map', 'info', 1600);
            }
        }
    },

    renderWalkingGuidanceSteps() {
        if (!this.walkingSteps || this.walkingSteps.length === 0) {
            return `
                <div class="p-3 text-center text-xs text-on-surface-variant bg-surface-container/60 rounded-xl">
                    Follow the solid blue route line on the map to reach the boarding stop.
                </div>
            `;
        }

        const stopName = this.nearestStopInfo?.stop?.name || 'Bus Stop';

        return `
            <div class="space-y-1.5 pt-2 border-t border-white/10 max-h-[240px] overflow-y-auto pr-1">
                <div class="flex items-center justify-between pb-1 px-1">
                    <span class="text-[10px] uppercase tracking-wider font-extrabold text-primary flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">navigation</span>
                        Turn-by-Turn Guidance to ${I18n.translateStop(stopName)} (${this.walkingSteps.length} Steps)
                    </span>
                    <span class="text-[10px] text-on-surface-variant font-medium">Tap step to view arrow on map</span>
                </div>

                ${this.walkingSteps.map((step, idx) => {
                    const isLast = idx === this.walkingSteps.length - 1;
                    const mod = step.maneuver.modifier ? step.maneuver.modifier.replace('_', ' ') : '';
                    const mType = step.maneuver.type;
                    const stepDist = Math.round(step.distance);
                    
                    let iconName = 'straight';
                    let arrowSymbol = '↑';
                    let iconColor = 'text-primary';
                    let instruction = '';
                    let instructionPlain = '';

                    if (isLast || mType === 'arrive') {
                        iconName = 'pin_drop';
                        arrowSymbol = '🏁';
                        iconColor = 'text-error';
                        instruction = `Arrive at <strong>${I18n.translateStop(stopName)}</strong> (Ready to board BMTC 378)`;
                        instructionPlain = `Arrive at ${I18n.translateStop(stopName)}`;
                    } else if (mType === 'depart') {
                        iconName = 'directions_walk';
                        arrowSymbol = '↑';
                        iconColor = 'text-secondary';
                        instruction = `Head ${mod || 'forward'} on ${step.name ? `<strong>${step.name}</strong>` : 'road'}`;
                        instructionPlain = `Head on ${step.name || 'road'}`;
                    } else if (mod.includes('left')) {
                        iconName = 'turn_left';
                        arrowSymbol = '↰';
                        iconColor = 'text-primary';
                        instruction = `Turn ${mod} ${step.name ? `onto <strong>${step.name}</strong>` : ''}`;
                        instructionPlain = `Turn left onto ${step.name || 'road'}`;
                    } else if (mod.includes('right')) {
                        iconName = 'turn_right';
                        arrowSymbol = '↱';
                        iconColor = 'text-primary';
                        instruction = `Turn ${mod} ${step.name ? `onto <strong>${step.name}</strong>` : ''}`;
                        instructionPlain = `Turn right onto ${step.name || 'road'}`;
                    } else {
                        iconName = 'navigation';
                        arrowSymbol = '↑';
                        iconColor = 'text-primary';
                        instruction = `Continue on ${step.name ? `<strong>${step.name}</strong>` : 'road'}`;
                        instructionPlain = `Continue on ${step.name || 'road'}`;
                    }

                    const turnLat = step.maneuver.location ? step.maneuver.location[1] : null;
                    const turnLng = step.maneuver.location ? step.maneuver.location[0] : null;

                    return `
                        <div 
                            class="bg-surface-container/80 hover:bg-surface-container-highest rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs border border-white/5 cursor-pointer active:scale-[0.99] transition-all group"
                            onclick="HomeView.focusStepLocation(${turnLat}, ${turnLng}, ${idx + 1}, '${arrowSymbol}', '${instructionPlain.replace(/'/g, "\\'")}')"
                        >
                            <div class="flex items-center gap-2.5 min-w-0 pr-1">
                                <div class="w-6 h-6 rounded-full bg-white/10 group-hover:bg-primary/20 flex items-center justify-center shrink-0 ${iconColor}">
                                    <span class="material-symbols-outlined text-sm">${iconName}</span>
                                </div>
                                <div class="min-w-0">
                                    <div class="text-[11.5px] text-on-surface leading-tight truncate">
                                        <span class="text-on-surface-variant font-bold mr-1">${idx + 1}.</span>
                                        ${instruction}
                                    </div>
                                </div>
                            </div>
                            <div class="text-right shrink-0">
                                <span class="text-[10px] font-bold text-secondary font-status-number">${stepDist > 0 ? `${stepDist} m` : 'Platform'}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /* =========================================================================
       LIVE WALKTHROUGH CONTROLLER WITH GPS & SIMULATION
       ========================================================================= */

    startWalkthrough() {
        if (!this.nearestStopInfo || !this.nearestStopInfo.stop) {
            if (window.NotificationUtils) {
                NotificationUtils.showToast('Nearest Stop', 'Locating nearest boarding stop...', 'info');
            }
            return;
        }

        this.isNavigatingWalk = true;
        this.navCurrentStepIndex = 0;
        this.navSimulatedIdx = 0;
        this.hasArrivedAtStop = false;
        this.lastSpokenStepIndex = -1;

        // Zoom into user location and walking path to nearest stop
        if (MapUtils.map && this.userLocation) {
            MapUtils.map.flyTo([this.userLocation.lat, this.userLocation.lng], 17, { duration: 0.8 });
        }

        // Set live walking user marker with single 🚶 icon
        MapUtils.setWalkingUserLocation(this.userLocation.lat, this.userLocation.lng);

        // Announce voice instructions
        this.announceCurrentStep();

        // Start GPS watch
        if (navigator.geolocation) {
            this.navWatchId = navigator.geolocation.watchPosition(
                (pos) => {
                    this.onGPSWalkUpdate(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                    console.warn('GPS Watch notice:', err);
                },
                { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
            );
        }

        // Re-render whole view to show top/bottom navigation HUD
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            this.render().then(html => {
                appContainer.innerHTML = html;
                if (MapUtils.map) {
                    MapUtils.map.invalidateSize();
                }
            });
        }

        const mapSection = document.getElementById('home-map-section');
        if (mapSection) {
            mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (window.NotificationUtils) {
            NotificationUtils.showToast('🚶 Live Walk Navigation Active', `Follow road steps to ${I18n.translateStop(this.nearestStopInfo.stop.name)}`, 'success', 2500);
        }
    },

    stopWalkthrough(silent = false) {
        if (!this.isNavigatingWalk) return;

        this.isNavigatingWalk = false;
        this.stopAutoWalk();

        if (this.navWatchId !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(this.navWatchId);
            this.navWatchId = null;
        }

        // Clean up step marker if any
        if (MapUtils.activeStepMarker && MapUtils.map) {
            try { MapUtils.map.removeLayer(MapUtils.activeStepMarker); } catch(e) {}
            MapUtils.activeStepMarker = null;
        }

        // Restore standard user pin
        MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng, false);

        if (!silent) {
            this.speakVoice('Walking navigation ended.');
            if (window.NotificationUtils) {
                NotificationUtils.showToast('Navigation Ended', 'Returned to standard view', 'info', 1800);
            }
        }

        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            this.render().then(html => {
                appContainer.innerHTML = html;
                if (MapUtils.map) {
                    MapUtils.map.invalidateSize();
                }
            });
        }
    },

    onGPSWalkUpdate(lat, lng) {
        if (!this.isNavigatingWalk) return;

        this.userLocation.lat = lat;
        this.userLocation.lng = lng;

        // Move the walker icon on the map
        MapUtils.setWalkingUserLocation(lat, lng);
        if (MapUtils.map) {
            MapUtils.map.panTo([lat, lng], { animate: true, duration: 0.5 });
        }

        // Check proximity to destination bus stop
        if (this.nearestStopInfo && this.nearestStopInfo.stop) {
            const stopLat = this.nearestStopInfo.stop.latitude || this.nearestStopInfo.stop.lat;
            const stopLng = this.nearestStopInfo.stop.longitude || this.nearestStopInfo.stop.lng;
            const remainingDist = this.calculateDistanceMeters(lat, lng, stopLat, stopLng);

            this.nearestStopInfo.distanceMeters = remainingDist;
            this.nearestStopInfo.distanceText = remainingDist < 1000 ? `${remainingDist} m` : `${(remainingDist / 1000).toFixed(1)} km`;
            this.nearestStopInfo.walkingMins = Math.max(1, Math.round(remainingDist / 80));

            // Check if arrived (< 35m)
            if (remainingDist <= 35) {
                this.handleArrivalAtStop();
                return;
            }

            // Find closest turn step
            if (this.walkingSteps && this.walkingSteps.length > 0) {
                let closestIdx = 0;
                let minStepDist = Infinity;
                this.walkingSteps.forEach((s, idx) => {
                    if (s.maneuver && s.maneuver.location) {
                        const d = this.calculateDistanceMeters(lat, lng, s.maneuver.location[1], s.maneuver.location[0]);
                        if (d < minStepDist) {
                            minStepDist = d;
                            closestIdx = idx;
                        }
                    }
                });

                if (closestIdx !== this.navCurrentStepIndex) {
                    this.navCurrentStepIndex = closestIdx;
                    this.announceCurrentStep();
                }
            }

            // Re-render HUD components
            const topHud = document.querySelector('#home-map-section > div:first-child');
            if (topHud && topHud.classList.contains('bg-gradient-to-r')) {
                topHud.outerHTML = this.renderLiveNavigationTopHUD();
            }
        }
    },

    announceCurrentStep() {
        if (!this.walkingSteps || this.walkingSteps.length === 0) return;
        const currentIdx = Math.min(this.navCurrentStepIndex, this.walkingSteps.length - 1);
        if (currentIdx === this.lastSpokenStepIndex) return;
        this.lastSpokenStepIndex = currentIdx;

        const currentStep = this.walkingSteps[currentIdx];
        if (!currentStep) return;

        const dist = Math.round(currentStep.distance);
        const name = currentStep.name || 'the road';
        const mod = (currentStep.maneuver?.modifier || '').replace('_', ' ');
        const mType = currentStep.maneuver?.type;

        let spoken = '';
        if (mType === 'arrive' || currentIdx === this.walkingSteps.length - 1) {
            spoken = `In ${dist} meters, arrive at ${this.nearestStopInfo?.stop?.name || 'the bus stop'}.`;
        } else if (mType === 'depart') {
            spoken = `Head ${mod || 'forward'} on ${name} for ${dist} meters.`;
        } else if (mod) {
            spoken = `In ${dist} meters, turn ${mod} onto ${name}.`;
        } else {
            spoken = `Continue on ${name} for ${dist} meters.`;
        }

        this.speakVoice(spoken);
    },

    speakVoice(text) {
        if (this.isVoiceMuted || !text) return;
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);
            } catch (e) {}
        }
    },

    toggleVoiceMute() {
        this.isVoiceMuted = !this.isVoiceMuted;
        if (this.isVoiceMuted) {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            if (window.NotificationUtils) NotificationUtils.showToast('Voice Muted', 'Audio guidance turned off', 'info', 1200);
        } else {
            this.speakVoice('Voice guidance enabled.');
            if (window.NotificationUtils) NotificationUtils.showToast('Voice Enabled', 'Audio guidance turned on', 'info', 1200);
        }
        
        const topHud = document.querySelector('#home-map-section > div:first-child');
        if (topHud && topHud.classList.contains('bg-gradient-to-r')) {
            topHud.outerHTML = this.renderLiveNavigationTopHUD();
        }
    },

    simulateWalkStep() {
        if (!MapUtils.walkingRoadPoints || MapUtils.walkingRoadPoints.length < 2) return;

        this.navSimulatedIdx = Math.min(MapUtils.walkingRoadPoints.length - 1, (this.navSimulatedIdx || 0) + 1);
        const pt = MapUtils.walkingRoadPoints[this.navSimulatedIdx];

        this.onGPSWalkUpdate(pt[0], pt[1]);

        if (this.navSimulatedIdx >= MapUtils.walkingRoadPoints.length - 1) {
            this.stopAutoWalk();
            this.handleArrivalAtStop();
        }
    },

    toggleAutoWalk() {
        if (this.autoWalkTimer) {
            this.stopAutoWalk();
            if (window.NotificationUtils) NotificationUtils.showToast('Auto-walk Paused', 'Simulation paused', 'info', 1200);
        } else {
            if (window.NotificationUtils) NotificationUtils.showToast('Auto-walk Active', 'Simulating walk along road', 'info', 1200);
            this.autoWalkTimer = setInterval(() => {
                this.simulateWalkStep();
            }, 1200);
        }

        const bottomHud = document.querySelector('#home-map-section > div:last-child');
        if (bottomHud) {
            bottomHud.outerHTML = this.renderLiveNavigationBottomHUD();
        }
    },

    stopAutoWalk() {
        if (this.autoWalkTimer) {
            clearInterval(this.autoWalkTimer);
            this.autoWalkTimer = null;
        }
    },

    handleArrivalAtStop() {
        if (this.hasArrivedAtStop) return;
        this.hasArrivedAtStop = true;
        this.stopAutoWalk();

        const stopName = this.nearestStopInfo?.stop ? I18n.translateStop(this.nearestStopInfo.stop.name) : 'Bus Stop';
        const scoredBuses = this.calculateBestBus(this.nearestStopInfo?.stop, this.destination);
        const best = scoredBuses && scoredBuses.length > 0 ? scoredBuses[0] : null;
        const busPlate = best?.trip?.bus_number || 'Bus 378';

        this.speakVoice(`You have arrived at ${stopName}! Ready to board ${busPlate}.`);

        if (window.NotificationUtils) {
            NotificationUtils.showToast(`🎉 Arrived at ${stopName}!`, `Ready to board ${busPlate}`, 'success', 4000);
        }

        if (window.app && typeof window.app.showModal === 'function') {
            window.app.showModal(`
                <div class="glass-panel rounded-2xl p-5 max-w-sm mx-auto shadow-2xl border border-secondary/40 text-center space-y-4">
                    <div class="w-14 h-14 rounded-full bg-secondary/20 border-2 border-secondary text-secondary flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(78,222,163,0.4)]">
                        <span class="material-symbols-outlined text-3xl">check_circle</span>
                    </div>
                    <div>
                        <span class="text-[10px] uppercase tracking-wider font-extrabold text-secondary">WALK COMPLETE</span>
                        <h3 class="font-bold text-base text-on-surface mt-0.5">Arrived at ${stopName}</h3>
                        <p class="text-xs text-on-surface-variant mt-1">You are at the bus stop platform. Recommended <strong>${busPlate}</strong> arrives in ~3 mins.</p>
                    </div>
                    <div class="space-y-2">
                        <button 
                            class="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary-fixed cursor-pointer transition-all"
                            onclick="window.app.closeModal(); HomeView.startJourney('${best?.trip?.id || ''}')"
                        >
                            <span>Board & Track ${busPlate}</span>
                            <span class="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                        <button 
                            class="w-full py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-white/10 cursor-pointer"
                            onclick="window.app.closeModal(); HomeView.stopWalkthrough();"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            `);
        }
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
                const aStarts = aName.startsWith(q) ? 0 : 1;
                const bStarts = bName.startsWith(q) ? 0 : 1;
                if (aStarts !== bStarts) return aStarts - bStarts;
                const aMajor = a.is_major ? 0 : 1;
                const bMajor = b.is_major ? 0 : 1;
                return (a.sequence_order || 0) - (b.sequence_order || 0);
            });
    },

    highlightMatch(text, query) {
        if (!query) return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<span class="text-primary underline font-extrabold">$1</span>');
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
            NotificationUtils.showToast('GPS Status', 'Using RR Nagar / Uttarahalli Corridor', 'info');
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
                    lat: 12.9245,
                    lng: 77.5180,
                    name: 'RR Nagar / Uttarahalli Corridor'
                };
                MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng);
                NotificationUtils.showToast('Location Pin', 'Centered on RR Nagar / Uttarahalli', 'info');
            }
        );
    }
};
