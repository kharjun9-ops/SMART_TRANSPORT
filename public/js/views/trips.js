/**
 * Lumina Transit - Live Trip Tracking, Stop Waiting List & Downstream Crowd Intelligence Forecaster
 * Pixel-matched with Stitch live_trip_tracking export
 */
const TripsView = {
    tripId: null,
    tripData: null,
    isOnBoard: false,
    userWaitlist: null,
    selectedDestinationStopId: null,
    trackInterval: null,
    alertedNear: false,
    activeTab: 'summary', // 'summary' | 'forecast' | 'timeline'

    async render(params = {}) {
        this.tripId = params.tripId || null;

        if (!this.tripId) {
            return this.renderTripSelector();
        }

        return `
            <div class="view-fade-in fixed inset-0 z-30 bg-surface flex flex-col overflow-hidden">
                <!-- Top App Bar -->
                <header class="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-container-margin h-16">
                    <button 
                        class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all text-on-surface-variant hover:text-primary"
                        onclick="window.app.navigate('home')"
                        aria-label="Back"
                    >
                        <span class="material-symbols-outlined text-2xl">arrow_back</span>
                    </button>

                    <div class="flex flex-col items-center">
                        <h1 class="font-headline-md text-headline-md-mobile text-on-surface tracking-tight flex items-center gap-1.5 font-bold" id="live-header-title">
                            <span class="material-symbols-outlined text-primary text-xl live-pulse" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                            ${this.tripData ? I18n.t('trips.tracking_route', { num: this.tripData.route_number }) : '...'}
                        </h1>
                        <p class="font-label-sm text-label-sm text-on-surface-variant" id="live-header-subtitle">
                            ${this.tripData ? (this.tripData.direction === 'outbound' ? I18n.t('trips.outbound') : I18n.t('trips.inbound')) : I18n.t('trips.connecting')}
                        </p>
                    </div>

                    <button 
                        class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all text-on-surface-variant hover:text-primary"
                        onclick="TripsView.openCrowdModal()"
                        aria-label="More"
                        title="Report Crowd"
                    >
                        <span class="material-symbols-outlined text-2xl">more_vert</span>
                    </button>
                </header>

                <!-- Main Map Area (Top 40-45% vh) -->
                <div class="fixed top-0 w-full h-[42vh] min-h-[250px] max-h-[420px] z-0 pt-16">
                    <div id="live-trip-map" class="w-full h-full"></div>
                    <!-- Gradient Overlay to blend with bottom sheet -->
                    <div class="absolute bottom-0 w-full h-24 bg-gradient-to-t from-surface via-surface/60 to-transparent pointer-events-none z-[400]"></div>
                </div>

                <!-- Bottom Sheet / Drawer (Bottom 58% vh) -->
                <main class="fixed bottom-0 w-full h-[60vh] max-h-[620px] z-20 bg-surface rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.7)] border-t border-white/10 flex flex-col pt-3 pb-[80px] transition-transform duration-300">
                    <!-- Drag Handle -->
                    <div class="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto mb-2"></div>

                    <div class="flex-1 overflow-y-auto px-container-margin flex flex-col gap-3.5" id="trip-live-drawer-content">
                        <div class="text-center py-8 text-on-surface-variant">
                            <span class="material-symbols-outlined animate-spin text-3xl text-primary mb-2">sync</span>
                            <p class="text-sm">${I18n.t('trips.retrieving')}</p>
                        </div>
                    </div>
                </main>
            </div>
        `;
    },

    async renderTripSelector() {
        try {
            const res = await API.getActiveTrips();
            const trips = res.trips || [];

            return `
                <div class="view-fade-in pt-[80px] px-container-margin pb-[100px] max-w-xl mx-auto">
                    <div class="flex justify-between items-end mb-stack-md">
                        <div>
                            <h2 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">${I18n.t('trips.select_bus')}</h2>
                            <p class="text-xs text-on-surface-variant">${I18n.t('trips.live_gps')}</p>
                        </div>
                        <button class="font-label-bold text-xs text-primary bg-primary-container/20 px-3 py-1 rounded-full hover:bg-primary-container/30 transition-all flex items-center gap-1" onclick="TripsView.renderTripSelector()">
                            <span class="material-symbols-outlined text-xs">sync</span> ${I18n.t('trips.refresh')}
                        </button>
                    </div>

                    <div class="flex flex-col gap-3">
                        ${trips.map(trip => {
                            const crowdLevel = trip.crowd_level || 'low';
                            let crowdPillHtml = '';
                            if (crowdLevel === 'low') {
                                crowdPillHtml = `<span class="bg-secondary/20 border border-secondary/30 text-secondary text-[11px] px-2 py-0.5 rounded-full font-semibold">${I18n.t('crowd.low')}</span>`;
                            } else if (crowdLevel === 'medium') {
                                crowdPillHtml = `<span class="bg-tertiary/20 border border-tertiary/30 text-tertiary text-[11px] px-2 py-0.5 rounded-full font-semibold">${I18n.t('crowd.medium')}</span>`;
                            } else {
                                crowdPillHtml = `<span class="bg-error/20 border border-error/30 text-error text-[11px] px-2 py-0.5 rounded-full font-semibold">${I18n.t('crowd.high')}</span>`;
                            }

                            const nextStopName = trip.next_stop_forecast ? trip.next_stop_forecast.stop_name : 'Next Stop';
                            const nextWaitCount = trip.next_stop_forecast ? trip.next_stop_forecast.waiting_passengers_count : 0;
                            const nextNextProb = trip.next_next_stop_forecast ? trip.next_next_stop_forecast.boarding_probability_percentage : null;

                            return `
                                <div 
                                    class="glass-panel rounded-transit p-4 flex flex-col gap-2.5 hover:bg-surface-container-high active:scale-[0.98] transition-all cursor-pointer shadow-lg border border-white/10"
                                    onclick="window.app.navigate('trips', { tripId: '${trip.id}' })"
                                >
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <div class="w-11 h-11 rounded-2xl bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary font-bold font-status-number text-base">
                                                ${trip.route_number || 'BMTC'}
                                            </div>
                                            <div>
                                                <h3 class="font-headline-md text-sm font-semibold text-on-surface">${trip.route_name}</h3>
                                                <div class="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                                                    <span>${trip.bus_number}</span>
                                                    <span>•</span>
                                                    <span class="text-primary font-medium">${trip.delay_minutes > 0 ? I18n.t('trips.delay', { mins: trip.delay_minutes }) : I18n.t('trips.on_time')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex flex-col items-end gap-1">
                                            ${crowdPillHtml}
                                            <span class="text-[10px] text-on-surface-variant">${I18n.t('trips.onboard', { count: trip.current_passenger_count, total: trip.capacity })}</span>
                                        </div>
                                    </div>

                                    <!-- Downstream Intelligence Preview Badge -->
                                    <div class="bg-surface-container/60 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] border border-white/5">
                                        <div class="flex items-center gap-1.5 text-on-surface-variant truncate">
                                            <span class="material-symbols-outlined text-secondary text-xs">hail</span>
                                            <span class="truncate">${I18n.t('trips.next')} <strong class="text-on-surface">${nextStopName}</strong></span>
                                            <span class="bg-secondary/15 text-secondary px-1.5 py-0.2 rounded font-semibold text-[10px]">${I18n.t('trips.waiting', { count: nextWaitCount })}</span>
                                        </div>
                                        ${nextNextProb !== null ? `
                                            <div class="text-[10px] font-semibold ${nextNextProb >= 80 ? 'text-secondary' : (nextNextProb >= 50 ? 'text-tertiary' : 'text-error')} flex items-center gap-0.5 flex-shrink-0 ml-2">
                                                <span>${I18n.t('trips.seat_chance', { pct: nextNextProb })}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } catch (e) {
            return `
                <div class="pt-[88px] px-container-margin text-center">
                    <div class="glass-panel rounded-transit p-6">
                        <span class="material-symbols-outlined text-4xl text-error mb-2">error</span>
                        <h3 class="font-headline-md text-on-surface">${I18n.t('trips.unable_load')}</h3>
                        <p class="text-sm text-on-surface-variant mt-1">${e.message}</p>
                    </div>
                </div>
            `;
        }
    },

    async init(params = {}) {
        if (params.tripId) {
            this.tripId = params.tripId;
            await this.loadTripDetails();

            // Polling tracking updates every 3.5s
            if (this.trackInterval) clearInterval(this.trackInterval);
            this.trackInterval = setInterval(() => {
                if (window.app && window.app.currentView === 'trips' && this.tripId) {
                    this.pollLiveTracking();
                }
            }, 3500);
        }
    },

    destroy() {
        if (this.trackInterval) {
            clearInterval(this.trackInterval);
            this.trackInterval = null;
        }
    },

    async loadTripDetails() {
        try {
            const res = await API.getTrip(this.tripId);
            this.tripData = res.trip;

            // Check if current user is on waitlist for this trip
            await this.checkUserWaitlistStatus();

            // Initialize Trip Map
            const centerLat = this.tripData.current_latitude || 12.9778;
            const centerLng = this.tripData.current_longitude || 77.5726;

            MapUtils.initMap('live-trip-map', [centerLat, centerLng], 14, { hideZoom: true });

            if (this.tripData.stops && this.tripData.stops.length > 0) {
                MapUtils.drawRoute(this.tripData.route_id, this.tripData.stops, this.tripData.route_color || '#4d8eff');
                MapUtils.renderStops(this.tripData.stops);
            }

            MapUtils.renderBusMarker(this.tripData);

            this.renderDrawerUI();
        } catch (e) {
            const container = document.getElementById('trip-live-drawer-content');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <span class="material-symbols-outlined text-4xl text-error mb-2">error</span>
                        <p class="text-sm text-on-surface-variant">${e.message}</p>
                        <button class="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold" onclick="window.app.navigate('trips')">Back to Buses</button>
                    </div>
                `;
            }
        }
    },

    async checkUserWaitlistStatus() {
        if (!API.isAuthenticated()) {
            this.userWaitlist = null;
            return;
        }
        try {
            const res = await API.getMyWaitlists();
            if (res && res.waitlists) {
                this.userWaitlist = res.waitlists.find(w => w.status === 'waiting' && (w.trip_id === this.tripId || w.route_id === this.tripData?.route_id)) || null;
            }
        } catch (e) {
            this.userWaitlist = null;
        }
    },

    async pollLiveTracking() {
        if (!this.tripId || !this.tripData) return;
        try {
            const trackRes = await API.getTripTrack(this.tripId);
            const track = trackRes.tracking;

            // Update live telemetry in data model
            this.tripData.current_stop_index = track.current_stop_index;
            this.tripData.current_passenger_count = track.passenger_count;
            this.tripData.current_speed_kmh = track.speed_kmh;
            this.tripData.current_latitude = track.latitude;
            this.tripData.current_longitude = track.longitude;
            this.tripData.forecast = track.forecast;

            // Update Map Marker
            MapUtils.renderBusMarker(this.tripData);

            // Re-render the drawer UI components
            this.renderDrawerUI();

            // Check arrival proximity if user on board
            if (this.isOnBoard && this.selectedDestinationStopId && this.tripData.stops) {
                const destIdx = this.tripData.stops.findIndex(s => s.stop_id === this.selectedDestinationStopId);
                if (destIdx !== -1) {
                    const stopsRemaining = destIdx - track.current_stop_index;
                    if (stopsRemaining === 1 && !this.alertedNear) {
                        this.alertedNear = true;
                        NotificationUtils.showToast('Destination Approaching!', 'Your target stop is next! Prepare to deboard.', 'destination_approaching', 7000);
                    }
                }
            }
        } catch (e) {}
    },

    renderDrawerUI() {
        const container = document.getElementById('trip-live-drawer-content');
        if (!container || !this.tripData) return;

        const trip = this.tripData;
        const crowdLevel = trip.crowd_level || 'low';
        const arrivingMins = Math.max(1, (trip.delay_minutes || 0) + 4);
        const forecast = trip.forecast || {};
        const nextForecast = forecast.next_stop_forecast;
        const nextNextForecast = forecast.next_next_stop_forecast;

        // Update Top Header
        const headerTitle = document.getElementById('live-header-title');
        const headerSub = document.getElementById('live-header-subtitle');
        if (headerTitle) {
            headerTitle.innerHTML = `
                <span class="material-symbols-outlined text-primary text-xl live-pulse" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                Tracking Route ${trip.route_number}
            `;
        }
        if (headerSub) {
            headerSub.textContent = `To ${trip.route_name.split('-')[1]?.trim() || trip.route_name}`;
        }

        // Crowd Chip HTML
        let crowdChip = '';
        if (crowdLevel === 'low') {
            crowdChip = `
                <div class="glass-panel px-3 py-1 rounded-full flex items-center gap-1.5 border-secondary/30">
                    <div class="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.8)]"></div>
                    <span class="font-label-sm text-[11px] text-secondary uppercase tracking-wider font-semibold">Low Crowd</span>
                </div>
            `;
        } else if (crowdLevel === 'medium') {
            crowdChip = `
                <div class="glass-panel px-3 py-1 rounded-full flex items-center gap-1.5 border-tertiary/30">
                    <div class="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(255,185,95,0.8)]"></div>
                    <span class="font-label-sm text-[11px] text-tertiary uppercase tracking-wider font-semibold">Med Crowd</span>
                </div>
            `;
        } else {
            crowdChip = `
                <div class="glass-panel px-3 py-1 rounded-full flex items-center gap-1.5 border-error/30">
                    <div class="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]"></div>
                    <span class="font-label-sm text-[11px] text-error uppercase tracking-wider font-semibold">High Crowd</span>
                </div>
            `;
        }

        // Stops Timeline computation
        const currentIdx = trip.current_stop_index || 0;
        const stops = trip.stops || [];
        const prevStop = currentIdx > 0 ? stops[currentIdx - 1] : null;
        const currentStop = stops[currentIdx] || { stop_name: 'In Transit' };
        const nextStop = currentIdx + 1 < stops.length ? stops[currentIdx + 1] : null;
        const nextNextStop = currentIdx + 2 < stops.length ? stops[currentIdx + 2] : null;

        container.innerHTML = `
            <!-- Hero Stats Row -->
            <div class="flex justify-between items-end pt-1">
                <div>
                    <p class="font-label-sm text-label-sm text-on-surface-variant mb-0.5">Next Stop Arrival</p>
                    <div class="flex items-baseline gap-2 text-primary">
                        <span class="font-status-number text-status-number text-[38px] leading-none tracking-tighter font-bold" id="drawer-eta-value">
                            ${nextForecast ? nextForecast.wait_time_minutes : arrivingMins}
                        </span>
                        <span class="font-headline-md text-sm text-primary-fixed-dim font-semibold">mins</span>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-1">
                    ${crowdChip}
                    <p class="font-label-sm text-[11px] text-on-surface-variant">${trip.current_passenger_count}/${trip.capacity || 50} passengers (${Math.round((trip.current_passenger_count / (trip.capacity || 50)) * 100)}% load)</p>
                </div>
            </div>

            <!-- User Active Waitlist Banner (if joined) -->
            ${this.userWaitlist ? `
                <div class="bg-secondary/15 border border-secondary/40 rounded-2xl p-3 flex items-center justify-between shadow-md">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl bg-secondary/25 flex items-center justify-center text-secondary">
                            <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">timer</span>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-secondary">You are on the Waiting List</div>
                            <div class="text-[10px] text-on-surface-variant">Registered for this bus at Stop</div>
                        </div>
                    </div>
                    <button 
                        class="px-2.5 py-1 rounded-lg bg-secondary/20 hover:bg-secondary/30 text-secondary text-[11px] font-bold border border-secondary/30 transition-all"
                        onclick="TripsView.handleLeaveWaitlist('${this.userWaitlist.stop_id}')"
                    >
                        Leave Queue
                    </button>
                </div>
            ` : ''}

            <!-- 🌟 CORE FEATURE: MULTI-STOP CROWD & WAITLIST PREDICTION CARD 🌟 -->
            <div class="glass-panel rounded-2xl p-4 border border-white/15 shadow-xl relative overflow-hidden space-y-3.5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-primary live-pulse"></div>
                        <h3 class="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider">
                            Multi-Stop Crowd & Waitlist Intelligence
                        </h3>
                    </div>
                    <button 
                        class="text-[10px] text-primary font-semibold flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full border border-primary/20 transition-all"
                        onclick="TripsView.openJoinWaitlistModal()"
                    >
                        <span class="material-symbols-outlined text-xs">add</span> Join Queue
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <!-- 1. NEXT STOP WAITING CALCULATION -->
                    ${nextForecast ? `
                        <div class="bg-surface-container/70 rounded-xl p-3 border border-white/10 flex flex-col justify-between space-y-2">
                            <div class="flex justify-between items-start">
                                <div>
                                    <span class="text-[10px] font-bold text-secondary uppercase tracking-wider">Next Stop (S₁)</span>
                                    <h4 class="text-xs font-bold text-on-surface mt-0.5 truncate max-w-[150px]">${nextForecast.stop_name}</h4>
                                </div>
                                <span class="bg-secondary/20 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    ~${nextForecast.wait_time_minutes}m wait
                                </span>
                            </div>

                            <div class="flex items-center justify-between text-[11px] bg-surface-container-high/60 rounded-lg p-2 border border-white/5">
                                <div class="flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-secondary text-sm" style="font-variation-settings: 'FILL' 1;">groups</span>
                                    <div>
                                        <span class="font-bold text-on-surface text-xs">${nextForecast.waiting_passengers_count}</span>
                                        <span class="text-on-surface-variant text-[10px]"> in waitlist</span>
                                    </div>
                                </div>
                                <div class="text-right text-[10px] text-on-surface-variant">
                                    <span class="text-secondary font-semibold">+${nextForecast.expected_boarding} Board</span> / 
                                    <span class="text-error font-semibold">-${nextForecast.expected_deboarding} Deboard</span>
                                </div>
                            </div>

                            <div class="text-[10px] text-on-surface-variant flex justify-between items-center">
                                <span>Departing Occupancy:</span>
                                <span class="font-bold text-on-surface">${nextForecast.bus_occupancy_after_departure}% (${nextForecast.seats_remaining_after_departure} seats left)</span>
                            </div>
                        </div>
                    ` : `
                        <div class="bg-surface-container/40 rounded-xl p-3 text-center text-xs text-on-surface-variant">
                            Bus approaching final stop.
                        </div>
                    `}

                    <!-- 2. NEXT-NEXT STOP CROWD PROPAGATION & COMMUTER PROBABILITY -->
                    ${nextNextForecast ? `
                        <div class="bg-surface-container/70 rounded-xl p-3 border ${nextNextForecast.verdict_level === 'optimal' ? 'border-secondary/30' : (nextNextForecast.verdict_level === 'moderate' ? 'border-tertiary/30' : 'border-error/30')} flex flex-col justify-between space-y-2 relative overflow-hidden">
                            <div class="flex justify-between items-start">
                                <div>
                                    <span class="text-[10px] font-bold text-primary uppercase tracking-wider">Next+Next Stop (S₂)</span>
                                    <h4 class="text-xs font-bold text-on-surface mt-0.5 truncate max-w-[150px]">${nextNextForecast.stop_name}</h4>
                                </div>
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${nextNextForecast.boarding_probability_percentage >= 80 ? 'bg-secondary/20 text-secondary border border-secondary/30' : (nextNextForecast.boarding_probability_percentage >= 50 ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' : 'bg-error/20 text-error border border-error/30')}">
                                    ${nextNextForecast.boarding_probability_percentage}% Seat Chance
                                </span>
                            </div>

                            <!-- Visual Forecast Gauge -->
                            <div class="space-y-1">
                                <div class="flex justify-between text-[10px]">
                                    <span class="text-on-surface-variant font-medium">Predicted Bus Fill on Arrival:</span>
                                    <span class="font-bold text-on-surface">${nextNextForecast.anticipated_bus_occupancy_on_arrival}% (${nextNextForecast.anticipated_crowd_level.toUpperCase()})</span>
                                </div>
                                <div class="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden flex">
                                    <div 
                                        class="h-full ${nextNextForecast.anticipated_bus_occupancy_on_arrival > 85 ? 'bg-error' : (nextNextForecast.anticipated_bus_occupancy_on_arrival > 60 ? 'bg-tertiary' : 'bg-secondary')} transition-all duration-500 rounded-full"
                                        style="width: ${nextNextForecast.anticipated_bus_occupancy_on_arrival}%;"
                                    ></div>
                                </div>
                            </div>

                            <!-- Commuter Guidance Message -->
                            <div class="text-[10px] text-on-surface-variant bg-surface-container-high/80 rounded-lg p-2 border border-white/5 flex items-start gap-1.5">
                                <span class="material-symbols-outlined text-xs ${nextNextForecast.verdict_level === 'optimal' ? 'text-secondary' : (nextNextForecast.verdict_level === 'moderate' ? 'text-tertiary' : 'text-error')} flex-shrink-0 mt-0.5" style="font-variation-settings: 'FILL' 1;">
                                    ${nextNextForecast.verdict_level === 'optimal' ? 'verified' : (nextNextForecast.verdict_level === 'moderate' ? 'info' : 'warning')}
                                </span>
                                <span class="leading-tight">${nextNextForecast.commuter_advice}</span>
                            </div>
                        </div>
                    ` : `
                        <div class="bg-surface-container/40 rounded-xl p-3 text-center text-xs text-on-surface-variant">
                            Next stop is the terminus.
                        </div>
                    `}
                </div>
            </div>

            <!-- Route Stops Timeline -->
            <div class="glass-panel rounded-2xl p-3.5 flex flex-col relative shadow-lg">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-primary text-sm">route</span>
                        Route Stops & Live Progress
                    </span>
                    <span class="text-[10px] text-on-surface-variant">GPS Updated</span>
                </div>

                <div class="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    ${stops.map((s, idx) => {
                        const isCurrent = idx === currentIdx;
                        const isNext = idx === currentIdx + 1;
                        const isNextNext = idx === currentIdx + 2;
                        const isPassed = idx < currentIdx;
                        const isUpcoming = idx > currentIdx;

                        let statusBadge = '';
                        if (isCurrent) {
                            statusBadge = `<span class="bg-primary/20 text-primary border border-primary/30 text-[10px] px-1.5 py-0.2 rounded font-bold">Current</span>`;
                        } else if (isNext) {
                            statusBadge = `<span class="bg-secondary/20 text-secondary border border-secondary/30 text-[10px] px-1.5 py-0.2 rounded font-bold">Next</span>`;
                        } else if (isNextNext) {
                            statusBadge = `<span class="bg-tertiary/20 text-tertiary border border-tertiary/30 text-[10px] px-1.5 py-0.2 rounded font-bold">Next+1</span>`;
                        } else if (isPassed) {
                            statusBadge = `<span class="text-outline-variant text-[10px]">Passed</span>`;
                        }

                        return `
                            <div class="flex items-center justify-between p-2 rounded-xl ${isCurrent ? 'bg-primary/15 border border-primary/30 font-bold' : (isNext ? 'bg-secondary/10 border border-secondary/20' : 'bg-surface-container/40')} text-xs">
                                <div class="flex items-center gap-2 truncate">
                                    <div class="w-2 h-2 rounded-full ${isCurrent ? 'bg-primary live-pulse' : (isNext ? 'bg-secondary' : (isPassed ? 'bg-outline-variant' : 'bg-surface-variant'))}"></div>
                                    <span class="truncate ${isPassed ? 'text-on-surface-variant opacity-60' : 'text-on-surface'}">${s.stop_name}</span>
                                </div>
                                <div class="flex items-center gap-2 flex-shrink-0">
                                    ${statusBadge}
                                    ${s.waiting_passengers > 0 ? `
                                        <span class="text-[10px] text-on-surface-variant flex items-center gap-0.5">
                                            <span class="material-symbols-outlined text-[11px]">group</span> ${s.waiting_passengers}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Destination Notification Picker -->
            <div class="glass-panel rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="material-symbols-outlined text-secondary text-lg" style="font-variation-settings: 'FILL' 1;">notifications_active</span>
                    <span class="text-xs text-on-surface font-medium truncate">Deboard Alarm</span>
                </div>
                <select 
                    class="bg-surface-container-high text-on-surface text-xs rounded-lg px-2 py-1 border border-white/10 focus:outline-none focus:ring-1 focus:ring-primary max-w-[180px]"
                    onchange="TripsView.setDestination(this.value)"
                >
                    <option value="">-- Choose Stop --</option>
                    ${stops.map(s => `
                        <option value="${s.stop_id}" ${this.selectedDestinationStopId === s.stop_id ? 'selected' : ''}>
                            ${s.stop_name}
                        </option>
                    `).join('')}
                </select>
            </div>

            <!-- Action Grid (Exact Match with Stitch live_trip_tracking) -->
            <div class="grid grid-cols-2 gap-stack-sm mt-auto pt-1">
                <button 
                    class="${!this.isOnBoard ? 'bg-primary text-on-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]' : 'bg-surface-container-high text-on-surface-variant'} font-label-bold text-xs py-3 px-3 rounded-xl flex justify-center items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md font-semibold"
                    onclick="TripsView.handleBoarding()"
                >
                    <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                    ${this.isOnBoard ? 'Boarded ✓' : "I'm Boarding"}
                </button>

                <button 
                    class="${this.isOnBoard ? 'bg-error text-on-error' : 'glass-panel text-on-surface'} font-label-bold text-xs py-3 px-3 rounded-xl flex justify-center items-center gap-2 hover:bg-white/5 active:scale-95 transition-all shadow-md font-semibold"
                    onclick="TripsView.handleDeboarding()"
                >
                    <span class="material-symbols-outlined text-lg">exit_to_app</span>
                    I'm Deboarding
                </button>

                <button 
                    class="col-span-2 glass-panel text-tertiary font-label-bold text-xs py-2.5 px-4 rounded-xl flex justify-center items-center gap-2 border-tertiary/30 hover:bg-tertiary/10 active:scale-95 transition-all font-semibold shadow-md"
                    onclick="TripsView.openCrowdModal()"
                >
                    <span class="material-symbols-outlined text-lg">group</span>
                    Report Crowd Level (+10 Pts)
                </button>
            </div>
        `;
    },

    openJoinWaitlistModal() {
        if (!API.isAuthenticated()) {
            window.app.showAuthModal();
            return;
        }

        const stops = this.tripData?.stops || [];
        const currentIdx = this.tripData?.current_stop_index || 0;
        const upcomingStops = stops.slice(currentIdx + 1);

        window.app.showModal(`
            <div class="glass-panel rounded-2xl p-6 relative overflow-hidden max-w-md mx-auto shadow-2xl border border-white/15">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined text-lg">hail</span>
                        </div>
                        <div>
                            <h3 class="font-headline-md text-sm font-bold text-on-surface">Join Stop Waiting List</h3>
                            <p class="text-[11px] text-on-surface-variant">Alert the system & calculate next stop crowd</p>
                        </div>
                    </div>
                    <button class="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-on-surface-variant" onclick="window.app.closeModal()">
                        <span class="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div class="space-y-3 mb-5">
                    <div>
                        <label class="block text-xs font-semibold text-on-surface mb-1">Select the stop you are waiting at:</label>
                        <select id="waitlist-stop-select" class="w-full bg-surface-container-high text-on-surface text-xs rounded-xl p-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary">
                            ${upcomingStops.map(s => `
                                <option value="${s.stop_id}">
                                    ${s.stop_name} (${s.is_major ? 'Major Hub' : 'Stop'} • ~${s.eta ? s.eta.eta_minutes : 5}m away)
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="p-3 bg-primary/10 rounded-xl border border-primary/20 text-[11px] text-on-surface-variant">
                        💡 <strong>Real-Time Intelligence:</strong> When you join the waiting list, the system recalculates available seats and informs passengers waiting at subsequent stops!
                    </div>
                </div>

                <button 
                    class="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-fixed transition-all shadow-lg active:scale-95"
                    onclick="TripsView.submitJoinWaitlist()"
                >
                    <span>Confirm & Join Queue (+5 Pts)</span>
                    <span class="material-symbols-outlined text-sm">check_circle</span>
                </button>
            </div>
        `);
    },

    async submitJoinWaitlist() {
        const select = document.getElementById('waitlist-stop-select');
        if (!select || !select.value) return;

        const stopId = select.value;
        window.app.closeModal();

        NotificationUtils.showToast('Verifying Location...', 'Checking satellite GPS against stop geofence...', 'info', 2000);

        try {
            const loc = await GPSUtils.getCurrentPosition();
            const res = await API.joinWaitlist(
                stopId, 
                this.tripData.route_id, 
                this.tripId, 
                null, 
                loc.latitude, 
                loc.longitude, 
                loc.isDemo
            );

            this.userWaitlist = res.waitlist;
            GPSUtils.showVerificationResultModal(res, 'Stop Waitlist Registration');

            await this.loadTripDetails();
            window.app.updateSidebarUser();
        } catch (e) {
            GPSUtils.showVerificationResultModal({
                verified: false,
                status: 'rejected',
                points: 0,
                message: e.message || 'Location verification failed. You must be near the stop.',
                verification: {
                    confidence: 0.1,
                    distanceToStopMeters: null,
                    allowedPerimeterMeters: 350,
                    checks: [{ name: 'GPS Geofence', passed: false, details: e.message || 'Out of perimeter' }]
                }
            }, 'Stop Waitlist Registration');
        }
    },

    async handleLeaveWaitlist(stopId) {
        try {
            await API.leaveWaitlist(stopId, this.tripId);
            this.userWaitlist = null;
            NotificationUtils.showToast('Removed', 'You have left the stop waiting list', 'info');
            await this.loadTripDetails();
        } catch (e) {
            NotificationUtils.showToast('Error', e.message, 'error');
        }
    },

    setDestination(stopId) {
        this.selectedDestinationStopId = stopId;
        if (stopId && this.tripData && this.tripData.stops) {
            const stop = this.tripData.stops.find(s => s.stop_id === stopId);
            NotificationUtils.showToast(
                'Alarm Set',
                `We will alert you 1 stop before ${stop ? stop.stop_name : 'your destination'}.`,
                'destination_approaching'
            );
        }
    },

    async handleBoarding() {
        if (!API.isAuthenticated()) {
            window.app.showAuthModal();
            return;
        }

        const currentStop = this.tripData?.stops ? this.tripData.stops[this.tripData.current_stop_index] : null;
        const stopId = currentStop ? currentStop.stop_id : (this.tripData?.stops?.[0]?.stop_id || null);

        NotificationUtils.showToast('Verifying Telemetry...', 'Validating device GPS with bus and stop perimeter...', 'info', 2000);

        try {
            const loc = await GPSUtils.getCurrentPosition();
            const res = await API.reportBoarding(
                this.tripId,
                stopId,
                loc.latitude,
                loc.longitude,
                loc.isDemo
            );

            if (res.verified) {
                this.isOnBoard = true;
                this.userWaitlist = null;
            }

            GPSUtils.showVerificationResultModal(res, 'Boarding Check-in');
            this.renderDrawerUI();
            window.app.updateSidebarUser();
        } catch (e) {
            GPSUtils.showVerificationResultModal({
                verified: false,
                status: 'rejected',
                points: 0,
                message: e.message || 'Verification rejected. You must be physically near the bus or stop.',
                verification: {
                    confidence: 0.15,
                    distanceToStopMeters: null,
                    allowedPerimeterMeters: 350,
                    checks: [{ name: 'GPS Geofence', passed: false, details: 'Location out of perimeter' }]
                }
            }, 'Boarding Check-in');
        }
    },

    async handleDeboarding() {
        if (!API.isAuthenticated()) {
            window.app.showAuthModal();
            return;
        }

        const currentStop = this.tripData?.stops ? this.tripData.stops[this.tripData.current_stop_index] : null;
        const stopId = currentStop ? currentStop.stop_id : null;

        try {
            const loc = await GPSUtils.getCurrentPosition();
            const res = await API.reportDeboarding(
                this.tripId,
                stopId,
                loc.latitude,
                loc.longitude,
                loc.isDemo
            );

            if (res.verified) {
                this.isOnBoard = false;
            }

            GPSUtils.showVerificationResultModal(res, 'Deboarding Confirmation');
            this.renderDrawerUI();
            window.app.updateSidebarUser();
        } catch (e) {
            NotificationUtils.showToast('Deboarding Notice', e.message, 'info');
        }
    },

    openCrowdModal() {
        if (!API.isAuthenticated()) {
            window.app.showAuthModal();
            return;
        }

        const currentStopName = this.tripData && this.tripData.stops ? (this.tripData.stops[this.tripData.current_stop_index]?.stop_name || 'Majestic') : 'Majestic';

        window.app.showModal(`
            <div class="glass-panel rounded-2xl p-6 relative overflow-hidden max-w-md mx-auto shadow-2xl border border-white/15">
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/15 blur-3xl rounded-full pointer-events-none"></div>

                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="font-headline-md text-headline-md-mobile text-on-surface font-bold">Report Bus Crowd</h3>
                        <p class="text-[11px] text-on-surface-variant">Requires GPS verification to earn verified points</p>
                    </div>
                    <button class="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-on-surface-variant" onclick="window.app.closeModal()">
                        <span class="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div class="flex flex-col gap-stack-sm mb-4" id="crowd-selection-group">
                    <button 
                        class="crowd-card group relative flex items-center p-3.5 rounded-xl border border-white/10 bg-surface-container/60 backdrop-blur-md transition-all duration-200 text-left w-full focus:outline-none hover:bg-surface-container-high/80 cursor-pointer is-selected" 
                        data-level="low" 
                        type="button"
                        onclick="TripsView.selectCrowdCard(this, 'low')"
                    >
                        <div class="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center mr-3 shrink-0 border border-secondary/30 text-secondary transition-all">
                            <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">airline_seat_recline_normal</span>
                        </div>
                        <div class="flex-1">
                            <div class="font-headline-md text-sm font-bold text-secondary">Low Crowd</div>
                            <div class="font-body-md text-xs text-on-surface-variant">Plenty of seats available</div>
                        </div>
                    </button>

                    <button 
                        class="crowd-card group relative flex items-center p-3.5 rounded-xl border border-white/10 bg-surface-container/60 backdrop-blur-md transition-all duration-200 text-left w-full focus:outline-none hover:bg-surface-container-high/80 cursor-pointer opacity-70" 
                        data-level="medium" 
                        type="button"
                        onclick="TripsView.selectCrowdCard(this, 'medium')"
                    >
                        <div class="w-12 h-12 rounded-full bg-tertiary/15 flex items-center justify-center mr-3 shrink-0 border border-tertiary/30 text-tertiary transition-all">
                            <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">directions_walk</span>
                        </div>
                        <div class="flex-1">
                            <div class="font-headline-md text-sm font-bold text-tertiary">Medium Crowd</div>
                            <div class="font-body-md text-xs text-on-surface-variant">Standing room only</div>
                        </div>
                    </button>

                    <button 
                        class="crowd-card group relative flex items-center p-3.5 rounded-xl border border-white/10 bg-surface-container/60 backdrop-blur-md transition-all duration-200 text-left w-full focus:outline-none hover:bg-surface-container-high/80 cursor-pointer opacity-70" 
                        data-level="high" 
                        type="button"
                        onclick="TripsView.selectCrowdCard(this, 'high')"
                    >
                        <div class="w-12 h-12 rounded-full bg-error/15 flex items-center justify-center mr-3 shrink-0 border border-error/30 text-error transition-all">
                            <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">groups</span>
                        </div>
                        <div class="flex-1">
                            <div class="font-headline-md text-sm font-bold text-error">High Crowd</div>
                            <div class="font-body-md text-xs text-on-surface-variant">Very crowded / full bus</div>
                        </div>
                    </button>
                </div>

                <!-- GPS Notice -->
                <div class="bg-surface-container/60 rounded-xl p-2.5 border border-white/5 flex items-center justify-between text-[11px] mb-3">
                    <span class="text-on-surface-variant">Perimeter Geofence:</span>
                    <span class="font-semibold text-primary">350 meters limit</span>
                </div>

                <button 
                    id="crowd-submit-btn"
                    class="w-full py-3.5 rounded-xl bg-primary text-on-primary font-label-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-fixed transition-all active:scale-[0.98] shadow-lg shadow-primary/20 font-bold"
                    onclick="TripsView.submitSelectedCrowdReport()"
                >
                    <span>Verify Location & Submit</span>
                    <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">verified</span>
                </button>
            </div>
        `);

        this.currentSelectedCrowd = 'low';
    },

    selectCrowdCard(cardEl, level) {
        this.currentSelectedCrowd = level;
        const cards = document.querySelectorAll('.crowd-card');
        cards.forEach(c => {
            c.classList.remove('is-selected');
            c.classList.add('opacity-70');
        });
        cardEl.classList.add('is-selected');
        cardEl.classList.remove('opacity-70');
    },

    async submitSelectedCrowdReport() {
        const level = this.currentSelectedCrowd || 'low';
        window.app.closeModal();

        const currentStop = this.tripData && this.tripData.stops ? this.tripData.stops[this.tripData.current_stop_index] : null;
        const stopId = currentStop ? currentStop.stop_id : null;

        NotificationUtils.showToast('Verifying GPS...', 'Validating device proximity against bus position...', 'info', 2000);

        try {
            const loc = await GPSUtils.getCurrentPosition();
            const res = await API.reportCrowd(
                this.tripId,
                stopId,
                level,
                loc.latitude,
                loc.longitude,
                loc.isDemo
            );

            GPSUtils.showVerificationResultModal(res, 'Crowd Intelligence Report');
            await this.loadTripDetails();
            window.app.updateSidebarUser();
        } catch (e) {
            GPSUtils.showVerificationResultModal({
                verified: false,
                status: 'rejected',
                points: 0,
                message: e.message || 'Crowd report rejected: Location outside bus perimeter.',
                verification: {
                    confidence: 0.2,
                    distanceToStopMeters: null,
                    allowedPerimeterMeters: 350,
                    checks: [{ name: 'GPS Geofence', passed: false, details: 'Location out of perimeter' }]
                }
            }, 'Crowd Intelligence Report');
        }
    }
};
