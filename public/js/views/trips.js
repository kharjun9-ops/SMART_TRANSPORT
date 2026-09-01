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
    alertedBoarding: false,
    alertedNextStopDeboard: false,
    alertedAtDestinationDeboard: false,
    alertedMissedStop: false,
    lastMissedAlertStopIndex: null,
    isDeboardAlarmActive: true,
    activeTab: 'summary', // 'summary' | 'forecast' | 'timeline'
    isMapEnlarged: false,

    async render(params = {}) {
        this.tripId = params.tripId || null;

        if (!this.tripId) {
            return this.renderTripSelector();
        }

        return `
            <div class="view-fade-in fixed inset-0 z-30 bg-[#0a0d14] flex flex-col overflow-hidden text-white">
                <!-- Top App Bar (Pixel-matched Header) -->
                <header class="fixed top-0 w-full z-50 bg-[#0a0d14]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-4 h-14 transition-colors duration-200 relative">
                    <button 
                        class="text-primary hover:opacity-80 transition-opacity active:scale-95 p-2 -ml-2 flex items-center justify-center cursor-pointer"
                        onclick="window.app.navigate('home')"
                        aria-label="Location / Home"
                        title="Back to Home / Locate"
                    >
                        <span class="material-symbols-outlined text-2xl text-primary" style="font-variation-settings: 'FILL' 1;">location_on</span>
                    </button>

                    <div class="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm cursor-pointer hover:bg-white/10 transition-all pointer-events-auto" onclick="window.app.navigate('home')">
                        <span class="material-symbols-outlined text-primary text-base" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                        <h1 class="font-bold text-xs tracking-tight text-white uppercase">SMART TRANSIT</h1>
                    </div>

                    <div class="flex items-center gap-1.5 ml-auto">
                        <!-- Language Selector -->
                        <button 
                            id="trip-lang-toggle-btn"
                            class="text-primary hover:opacity-80 transition-all active:scale-90 px-2 py-0.5 flex items-center justify-center gap-1 rounded-lg bg-white/5 border border-white/10 font-bold text-xs cursor-pointer"
                            onclick="window.app.cycleLanguage()"
                            title="Change Language"
                        >
                            <span class="material-symbols-outlined text-sm">translate</span>
                            <span id="trip-lang-label">EN</span>
                        </button>

                        <!-- Theme Toggle -->
                        <button 
                            aria-label="Toggle Theme" 
                            class="text-primary hover:opacity-80 transition-all active:scale-90 p-1.5 flex items-center justify-center rounded-lg hover:bg-white/5 cursor-pointer"
                            onclick="ThemeUtils.toggleTheme()"
                            title="Toggle Theme"
                        >
                            <span class="material-symbols-outlined text-xl theme-toggle-icon">dark_mode</span>
                        </button>

                        <!-- Notifications -->
                        <button aria-label="Notifications" class="text-primary hover:opacity-80 transition-opacity active:scale-95 p-1.5 -mr-1 relative flex items-center justify-center cursor-pointer" onclick="window.app.navigate('profile')">
                            <span class="material-symbols-outlined text-xl">notifications</span>
                            <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-tertiary"></span>
                        </button>
                    </div>
                </header>

                <!-- Main Map Area (Top ~38% vh or Fullscreen when enlarged) -->
                <div class="fixed top-0 left-0 w-full ${this.isMapEnlarged ? 'h-[calc(100vh-60px)] z-10' : 'h-[38vh] min-h-[220px] max-h-[380px] z-0'} pt-14 transition-all duration-300" id="trip-map-container">
                    <div id="live-trip-map" class="w-full h-full"></div>
                    <!-- Smooth Gradient Overlay -->
                    <div class="absolute bottom-0 w-full h-20 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/75 to-transparent pointer-events-none z-[400]"></div>

                    <!-- Map Control Bar (Enlarge & Recenter GPS Buttons) -->
                    <div class="absolute top-16 right-3 flex items-center gap-2 z-[450]">
                        <!-- Enlarge / Shrink Map Button -->
                        <button 
                            onclick="TripsView.toggleMapEnlarge()"
                            class="glass-panel text-on-surface hover:text-primary px-3 py-1.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all cursor-pointer border border-white/20"
                            id="trip-enlarge-map-btn"
                            title="${this.isMapEnlarged ? 'Shrink Map' : 'Enlarge Map to Fullscreen'}"
                        >
                            <span class="material-symbols-outlined text-sm font-bold">${this.isMapEnlarged ? 'close_fullscreen' : 'open_in_full'}</span>
                            <span class="text-[11px] font-semibold">${this.isMapEnlarged ? 'Shrink' : 'Enlarge Map'}</span>
                        </button>

                        <!-- Recenter / Detect GPS Real Location Button -->
                        <button 
                            onclick="TripsView.detectGPSLocation()"
                            class="bg-primary text-on-primary p-2 rounded-full shadow-[0_2px_12px_rgba(26,115,232,0.5)] hover:bg-primary-fixed active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                            title="Detect & Center My Real Location"
                            id="trip-locate-btn"
                        >
                            <span class="material-symbols-outlined text-lg font-bold">my_location</span>
                        </button>
                    </div>
                </div>

                <!-- Bottom Sheet / Drawer (Bottom ~64% vh or Collapsed when map is enlarged) -->
                <main id="trip-bottom-drawer" class="fixed bottom-0 w-full ${this.isMapEnlarged ? 'h-[70px]' : 'h-[64vh] max-h-[660px]'} z-20 bg-[#0a0d14]/95 backdrop-blur-xl rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.85)] border-t border-white/10 flex flex-col pt-2.5 pb-[85px] overflow-hidden transition-all duration-300">
                    <!-- Drag Handle / Toggle Header -->
                    <div class="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2 shrink-0 cursor-pointer" onclick="TripsView.toggleMapEnlarge()" title="Toggle Map View"></div>

                    <div class="flex-1 overflow-y-auto px-4 flex flex-col gap-3.5" id="trip-live-drawer-content">
                        <div class="text-center py-8 text-gray-400">
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
                        <button class="font-label-bold text-xs text-primary bg-primary-container/20 px-3 py-1 rounded-full hover:bg-primary-container/30 transition-all flex items-center gap-1" onclick="window.app.navigate('trips')">
                            <span class="material-symbols-outlined text-xs">sync</span> ${I18n.t('trips.refresh')}
                        </button>
                    </div>

                    <div class="flex flex-col gap-3">
                        <!-- Verified Multi-User Crowd Consensus Alerts (Shown ONLY when 2+ passenger uploads match) -->
                        ${(() => {
                            const verifiedAlerts = window.ComplaintsView ? ComplaintsView.getVerifiedCrowdConsensusAlerts() : [];
                            if (!verifiedAlerts || verifiedAlerts.length === 0) return '';
                            return verifiedAlerts.map(alert => `
                                <div class="glass-panel rounded-2xl p-3 px-3.5 bg-gradient-to-r from-amber-500/20 via-surface-container-high to-surface-container border border-amber-500/40 flex items-center justify-between shadow-lg animate-in">
                                    <div class="flex items-center gap-2.5 min-w-0 pr-2">
                                        <span class="material-symbols-outlined text-amber-400 text-lg font-bold animate-pulse shrink-0">warning</span>
                                        <div class="min-w-0">
                                            <div class="font-extrabold text-[10px] text-amber-300 uppercase tracking-wide">VERIFIED CROWD CONSENSUS ALERT</div>
                                            <div class="text-xs text-on-surface font-medium truncate">${alert.text}</div>
                                        </div>
                                    </div>
                                    <span class="bg-amber-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0">VERIFIED (${alert.count} Passenger Uploads)</span>
                                </div>
                            `).join('');
                        })()}
                        ${trips.length === 0 ? `
                            <div class="glass-panel rounded-2xl p-6 text-center space-y-3">
                                <span class="material-symbols-outlined text-4xl text-primary">directions_bus</span>
                                <h3 class="font-headline-md text-sm font-bold text-on-surface">Connecting to BMTC GPS Fleet...</h3>
                                <p class="text-xs text-on-surface-variant">Live telemetry is synchronizing with Route 378 buses.</p>
                                <button onclick="window.app.navigate('trips')" class="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-md">
                                    ${I18n.t('trips.retry')}
                                </button>
                            </div>
                        ` : trips.map(trip => {
                            const isAtStop = trip.state === 'at_stop';
                            const etaText = isAtStop ? 'At Station' : (trip.next_stop_eta ? (trip.next_stop_eta.display_text || `${trip.next_stop_eta.eta_minutes}m`) : 'In Transit');
                            const nextStopName = trip.next_stop_name || 'Upcoming Stop';
                            const nextForecast = trip.next_stop_forecast;
                            const nextWaitCount = nextForecast ? nextForecast.waiting_passengers_count : (trip.stops ? trip.stops[trip.current_stop_index + 1]?.waiting_passengers || 0 : 0);
                            const nextNextForecast = trip.next_next_stop_forecast;
                            const nextNextProb = nextNextForecast ? nextNextForecast.boarding_probability_percentage : null;

                            let crowdPillHtml = '';
                            if (trip.crowd_level === 'low') {
                                crowdPillHtml = `<span class="bg-secondary/20 text-secondary border border-secondary/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">${I18n.t('crowd.low')}</span>`;
                            } else if (trip.crowd_level === 'medium') {
                                crowdPillHtml = `<span class="bg-tertiary/20 text-tertiary border border-tertiary/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">${I18n.t('crowd.medium')}</span>`;
                            } else {
                                crowdPillHtml = `<span class="bg-error/20 text-error border border-error/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">${I18n.t('crowd.high')}</span>`;
                            }

                            return `
                                <div 
                                    class="glass-panel hover:border-primary/50 transition-all rounded-2xl p-4 cursor-pointer active:scale-[0.99] space-y-3"
                                    onclick="window.app.navigate('trips', { tripId: '${trip.id}' })"
                                >
                                    <div class="flex justify-between items-start">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-base">
                                                ${trip.route_number || '378'}
                                            </div>
                                            <div>
                                                <div class="flex items-center gap-1.5">
                                                    <h3 class="font-headline-md text-sm font-bold text-on-surface">${trip.route_name || 'Electronic City - Kengeri TTMC'}</h3>
                                                    <span class="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant">${trip.direction || 'outbound'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <span class="font-headline-md text-xs text-primary font-bold">₹${trip.fare_lkr || 25}</span>
                                        </div>
                                    </div>

                                    <div class="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                                        <div class="flex items-center gap-2 text-on-surface-variant">
                                            <span>${trip.bus_number}</span>
                                            <span>•</span>
                                            <span class="text-primary font-medium flex items-center gap-1">
                                                <span class="w-1.5 h-1.5 rounded-full ${isAtStop ? 'bg-tertiary' : 'bg-primary'}"></span>
                                                ${etaText}
                                            </span>
                                        </div>
                                        <div class="flex flex-col items-end gap-1">
                                            ${crowdPillHtml}
                                            <span class="text-[10px] text-on-surface-variant">${I18n.t('trips.onboard', { count: trip.current_passenger_count, total: trip.capacity || 55 })}</span>
                                        </div>
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
            this.isOnBoard = false; // Strictly unboarded on init until user explicitly clicks & verifies GPS
            this.userWaitlist = null; // Start fresh with Join Waiting List prompt
            this.alertedBoarding = false;
            this.alertedNear = false;
            this.alertedNextStopDeboard = false;
            this.alertedAtDestinationDeboard = false;
            this.alertedMissedStop = false;
            this.lastMissedAlertStopIndex = null;
            if (params.destinationStopId) {
                this.selectedDestinationStopId = params.destinationStopId;
            }
            await this.loadTripDetails();

            // Polling tracking updates every 1.0s (real-time telemetry sync)
            if (this.trackInterval) clearInterval(this.trackInterval);
            this.trackInterval = setInterval(() => {
                if (window.app && window.app.currentView === 'trips' && this.tripId) {
                    this.pollLiveTracking();
                }
            }, 1000);
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

            // Restore saved destination alarm
            if (!this.selectedDestinationStopId && this.tripId) {
                this.selectedDestinationStopId = localStorage.getItem('lumina_dest_' + this.tripId) || null;
            }
            // Ensure isOnBoard is false until user explicitly checks in with GPS
            this.isOnBoard = this.isOnBoard || false;

            // Initialize Trip Map
            const centerLat = this.tripData.current_latitude || 12.9778;
            const centerLng = this.tripData.current_longitude || 77.5726;

            MapUtils.initMap('live-trip-map', [centerLat, centerLng], 14, { hideZoom: true });

            // Automatically place user's live GPS location marker
            this.syncUserLocationMarker(false);

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
                        <button class="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold cursor-pointer" onclick="window.app.navigate('trips')">Back to Buses</button>
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
        // Retain user's explicit active session waitlist, or start null
        this.userWaitlist = this.userWaitlist || null;
    },

    syncUserLocationMarker(centerMap = false) {
        let userLat = 12.8452;
        let userLng = 77.6602;

        if (window.HomeView && window.HomeView.userLocation) {
            userLat = window.HomeView.userLocation.lat;
            userLng = window.HomeView.userLocation.lng;
        }

        MapUtils.setUserLocation(userLat, userLng, centerMap);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    if (window.HomeView) {
                        window.HomeView.userLocation = {
                            lat: lat,
                            lng: lng,
                            name: 'My GPS Location'
                        };
                    }
                    MapUtils.setUserLocation(lat, lng, centerMap);
                },
                () => {},
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    },

    detectGPSLocation() {
        if (!navigator.geolocation) {
            NotificationUtils.showToast('GPS Status', 'Geolocation not supported by device', 'info');
            return;
        }

        NotificationUtils.showToast('Locating...', 'Fetching real-time GPS location...', 'info', 1500);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                if (window.HomeView) {
                    window.HomeView.userLocation = {
                        lat: lat,
                        lng: lng,
                        name: 'My GPS Location'
                    };
                }

                MapUtils.setUserLocation(lat, lng, true);
                NotificationUtils.showToast('GPS Active 📍', 'Centered on your real location', 'success', 3000);
            },
            (err) => {
                let userLat = 12.8452;
                let userLng = 77.6602;
                if (window.HomeView && window.HomeView.userLocation) {
                    userLat = window.HomeView.userLocation.lat;
                    userLng = window.HomeView.userLocation.lng;
                }
                MapUtils.setUserLocation(userLat, userLng, true);
                NotificationUtils.showToast('Location Pin', 'Centered on your location pin', 'info', 2500);
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            }
        );
    },

    async pollLiveTracking() {
        if (!this.tripId || !this.tripData) return;
        try {
            const res = await API.getTrip(this.tripId);
            if (!res || !res.trip) return;

            // Update full live trip model (stops, current_stop_index, GPS, passenger count, forecast)
            this.tripData = res.trip;

            // Update Map Marker live position
            MapUtils.renderBusMarker(this.tripData);

            // Update live telemetry in-place for instant 60fps UI responsiveness without DOM thrashing
            this.updateLiveTelemetryInPlace();

            // Check Waiting List Boarding Proximity Alert & Auto-Removal Logic
            if (this.userWaitlist && !this.isOnBoard && this.tripData && this.tripData.stops) {
                const waitlistStopId = this.userWaitlist.stop_id || this.userWaitlist.id;
                const waitlistIdx = this.tripData.stops.findIndex(s => 
                    (s.stop_id && s.stop_id === waitlistStopId) || 
                    (s.id && s.id === waitlistStopId) ||
                    (this.userWaitlist.stop_name && (s.stop_name === this.userWaitlist.stop_name || s.name === this.userWaitlist.stop_name))
                );

                if (waitlistIdx !== -1) {
                    const currentIdx = this.tripData.current_stop_index || 0;
                    const stopsRemaining = waitlistIdx - currentIdx;
                    const waitlistStop = this.tripData.stops[waitlistIdx];
                    const currentStop = this.tripData.stops[currentIdx];
                    const waitlistStopName = waitlistStop ? (waitlistStop.stop_name || waitlistStop.name) : (this.userWaitlist.stop_name || 'your stop');
                    const currName = currentStop ? (currentStop.stop_name || currentStop.name) : 'Previous Stop';

                    // 1. AUTO-REMOVAL FROM WAITLIST: User did NOT board when bus arrived & departed!
                    const hasDepartedWaitlistStop = currentIdx > waitlistIdx || (currentIdx === waitlistIdx && this.tripData.state === 'in_transit' && (this.alertedBoarding === 'at_stop' || this.alertedBoarding === true));

                    if (hasDepartedWaitlistStop) {
                        const stopName = this.userWaitlist.stop_name || waitlistStopName;
                        API.leaveWaitlist(waitlistStopId, this.tripId).catch(() => {});
                        this.userWaitlist = null;
                        this.alertedBoarding = false;
                        
                        NotificationUtils.showToast(
                            'Waitlist Removed ⌛', 
                            `You were automatically removed from the ${stopName} waiting list because you did not board when the bus arrived.`, 
                            'info', 
                            6000
                        );

                        this.renderDrawerUI();
                        this.updateLiveTelemetryInPlace();
                        return;
                    }

                    // 2. SYNCHRONIZED ETA & BOARDING PROXIMITY ALERT
                    const forecast = this.tripData.forecast;
                    const nextForecast = forecast ? forecast.next_stop_forecast : null;
                    const etaEl = document.getElementById('drawer-eta-value');
                    const etaValText = etaEl ? etaEl.textContent.trim() : '';

                    // Extract actual live ETA text (ensures 100% match with stops timeline and header)
                    const liveEtaText = (nextForecast && nextForecast.display_text)
                        ? nextForecast.display_text
                        : (waitlistStop && waitlistStop.eta && waitlistStop.eta.display_text
                            ? waitlistStop.eta.display_text
                            : (etaValText && !etaValText.includes('AT STOP') ? etaValText : '1 min'));

                    const etaLower = liveEtaText.toLowerCase();

                    // "Arriving soon" condition: Next stop is user's waitlisted stop (stopsRemaining === 1)
                    const isArrivingSoon = stopsRemaining === 1 && (
                        this.tripData.state === 'in_transit' ||
                        etaLower.includes('arriving') ||
                        etaLower.includes('< 1') ||
                        etaLower.includes('1 min') ||
                        (nextForecast && nextForecast.wait_time_minutes <= 2)
                    );

                    if (isArrivingSoon && !this.alertedBoarding) {
                        this.alertedBoarding = true;
                        this.triggerBoardingAlert(waitlistStopName, currName, false, liveEtaText);
                    } else if (stopsRemaining <= 0 && this.tripData.state === 'at_stop' && this.alertedBoarding !== 'at_stop') {
                        this.alertedBoarding = 'at_stop';
                        this.triggerBoardingAlert(waitlistStopName, waitlistStopName, true, 'At Station');
                    }
                }
            }

            // Check Deboarding Proximity & Missed Stop Alarms (when user has selected a destination stop)
            if (this.selectedDestinationStopId && this.tripData && this.tripData.stops) {
                const destIdx = this.tripData.stops.findIndex(s => 
                    (s.stop_id && s.stop_id === this.selectedDestinationStopId) ||
                    (s.id && s.id === this.selectedDestinationStopId)
                );

                if (destIdx !== -1) {
                    const currentIdx = this.tripData.current_stop_index || 0;
                    const stopsRemaining = destIdx - currentIdx;
                    const destStop = this.tripData.stops[destIdx];
                    const currentStop = this.tripData.stops[currentIdx];
                    const destName = destStop ? (destStop.stop_name || destStop.name) : 'your destination';
                    const currName = currentStop ? (currentStop.stop_name || currentStop.name) : 'Next Stop';

                    // 1. Deboarding Pre-Alert (1 stop remaining)
                    if (stopsRemaining === 1 && !this.alertedNextStopDeboard) {
                        this.alertedNextStopDeboard = true;
                        
                        if (this.isDeboardAlarmActive !== false && window.AlarmUtils) {
                            AlarmUtils.playDeboardChime();
                        }
                        
                        NotificationUtils.showToast(
                            '🔔 DEBOARDING ALERT', 
                            `Next stop is your destination: ${destName}! Get ready to deboard.`, 
                            'warning', 
                            7000
                        );

                        if ('speechSynthesis' in window) {
                            try {
                                const utter = new SpeechSynthesisUtterance("Next stop is your destination, " + destName + ". Please get ready to deboard.");
                                window.speechSynthesis.speak(utter);
                            } catch(e) {}
                        }
                    } 
                    // 2. Deboarding Alert AT Destination Stop (0 stops remaining)
                    else if (stopsRemaining === 0 && !this.alertedAtDestinationDeboard && this.isOnBoard) {
                        this.alertedAtDestinationDeboard = true;

                        if (window.AlarmUtils) {
                            AlarmUtils.playDeboardChime();
                        }

                        NotificationUtils.showToast(
                            '📍 DESTINATION ARRIVED!', 
                            `The bus is at your target stop: ${destName}! Please deboard now.`, 
                            'success', 
                            8000
                        );

                        if ('speechSynthesis' in window) {
                            try {
                                const utter = new SpeechSynthesisUtterance("The bus has arrived at your destination, " + destName + ". Please deboard now!");
                                window.speechSynthesis.speak(utter);
                            } catch(e) {}
                        }

                        // Show popup modal to deboard at target stop
                        window.app.showModal(`
                            <div class="glass-panel rounded-2xl p-5 max-w-md mx-auto shadow-2xl border-2 border-emerald-500/80 bg-gradient-to-b from-emerald-950/90 via-surface-container-high to-surface-container text-white space-y-4">
                                <div class="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
                                    <div class="w-12 h-12 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0 animate-bounce">
                                        <span class="material-symbols-outlined text-3xl">directions_bus</span>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-extrabold text-base text-emerald-300 uppercase tracking-wider">Destination Reached</h3>
                                        <p class="text-xs text-emerald-200 mt-0.5 font-medium">Arrived at: <strong class="text-white">${destName}</strong></p>
                                    </div>
                                </div>

                                <p class="text-xs text-gray-200 leading-normal">
                                    The bus has reached your selected deboarding stop <strong>${destName}</strong>. Tap below to confirm deboarding.
                                </p>

                                <div class="flex items-center gap-2 pt-1">
                                    <button 
                                        class="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                        onclick="window.app.closeModal(); TripsView.handleDeboardingClick();"
                                    >
                                        <span class="material-symbols-outlined text-base">exit_to_app</span>
                                        <span>I'm Deboarding Now</span>
                                    </button>
                                </div>
                            </div>
                        `);
                    }
                    // 3. MISSED STOP REMINDER FOR NEXT STOP (Bus passed destination stop and user did NOT deboard!)
                    else if (stopsRemaining < 0 && this.isOnBoard && this.lastMissedAlertStopIndex !== currentIdx) {
                        this.lastMissedAlertStopIndex = currentIdx;

                        // Play loud urgent beeps
                        if (window.AlarmUtils) {
                            AlarmUtils.playMissedStopAlarm();
                        }

                        // Voice warning alert
                        if ('speechSynthesis' in window) {
                            try {
                                const utter = new SpeechSynthesisUtterance("Warning! You missed your deboarding stop " + destName + ". Please get ready to deboard at the next stop, " + currName + ", immediately!");
                                window.speechSynthesis.speak(utter);
                            } catch(e) {}
                        }

                        // Display loud alert notification
                        NotificationUtils.showToast(
                            '🚨 MISSED DESTINATION REMINDER!', 
                            `You missed your stop ${destName}! The bus is now approaching ${currName}. Deboard at ${currName} next!`, 
                            'error', 
                            12000
                        );

                        // Show unmissable popup modal with direct deboard action for the NEXT stop
                        window.app.showModal(`
                            <div class="glass-panel rounded-2xl p-5 max-w-md mx-auto shadow-2xl border-2 border-red-500/80 bg-gradient-to-b from-red-950/90 via-surface-container-high to-surface-container text-white space-y-4 animate-bounce-short">
                                <div class="flex items-center gap-3 p-3 rounded-xl bg-red-500/20 border border-red-500/40">
                                    <div class="w-12 h-12 rounded-full bg-red-500/30 border border-red-400 flex items-center justify-center text-red-400 shrink-0 animate-pulse">
                                        <span class="material-symbols-outlined text-3xl">warning</span>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-extrabold text-base text-red-300 uppercase tracking-wider">Missed Stop Reminder</h3>
                                        <p class="text-xs text-red-200 mt-0.5 font-medium">Passed Stop: <strong class="text-white">${destName}</strong></p>
                                    </div>
                                </div>

                                <div class="bg-surface-container-lowest/80 rounded-xl p-3 border border-white/10 space-y-2 text-xs">
                                    <div class="flex items-center gap-2 text-amber-300 font-bold text-xs">
                                        <span class="material-symbols-outlined text-sm">directions_bus</span>
                                        <span>Deboard at Next Stop: <strong class="text-emerald-400 font-extrabold underline">${currName}</strong></span>
                                    </div>
                                    <p class="text-[11px] text-gray-300 leading-normal">
                                        You missed your scheduled deboarding stop (<strong>${destName}</strong>). Please get ready to deboard immediately at the next station: <strong>${currName}</strong>.
                                    </p>
                                </div>

                                <div class="flex items-center gap-2 pt-1">
                                    <button 
                                        class="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                        onclick="window.app.closeModal(); TripsView.handleDeboardingClick();"
                                    >
                                        <span class="material-symbols-outlined text-base">exit_to_app</span>
                                        <span>I'm Deboarding at ${currName} Now</span>
                                    </button>
                                </div>
                            </div>
                        `);
                    }
                }
            }
        } catch (e) {}
    },

    updateLiveTelemetryInPlace() {
        if (!this.tripData) return;
        const trip = this.tripData;
        const currentIdx = trip.current_stop_index || 0;
        const stops = trip.stops || [];
        const currentStop = stops[currentIdx] || { stop_name: 'In Transit' };
        const nextStop = currentIdx + 1 < stops.length ? stops[currentIdx + 1] : null;
        const forecast = trip.forecast;
        const nextForecast = forecast ? forecast.next_stop_forecast : null;
        const nextStopName = nextStop ? I18n.translateStop(nextStop.stop_name || nextStop.name) : 'Terminus';

        let etaDisplayText = '2 mins';
        let etaValue = 2;
        let headerLabel = 'NEXT STOP ARRIVAL';
        let subtext = `Next stop: ${nextStopName}`;

        if (trip.state === 'at_stop' && (trip.dwell_seconds == null || trip.dwell_seconds > 0)) {
            const dwellSec = trip.dwell_seconds != null ? trip.dwell_seconds : 15;
            headerLabel = 'BUS AT STATION';
            etaDisplayText = `AT STOP (${dwellSec}s)`;
            const nextEtaMins = nextForecast ? (nextForecast.wait_time_minutes || 2) : 2;
            subtext = `Next stop (${nextStopName}) in ~${nextEtaMins} mins after departure`;
        } else if (nextForecast) {
            etaValue = nextForecast.wait_time_minutes || 2;
            etaDisplayText = nextForecast.display_text || `${etaValue} mins`;
            subtext = `Next stop: ${nextStopName}`;
        } else if (nextStop && nextStop.eta) {
            etaValue = nextStop.eta.eta_minutes || 2;
            etaDisplayText = nextStop.eta.display_text || `${etaValue} mins`;
            subtext = `Next stop: ${nextStopName}`;
        }

        const headerLabelEl = document.getElementById('drawer-eta-header-label');
        if (headerLabelEl) {
            headerLabelEl.textContent = headerLabel;
        }

        const etaEl = document.getElementById('drawer-eta-value');
        if (etaEl) {
            etaEl.textContent = etaDisplayText;
        }

        const subtextEl = document.getElementById('drawer-eta-subtext');
        if (subtextEl) {
            subtextEl.textContent = subtext;
        }

        const capacity = trip.capacity || 55;
        const passengers = trip.current_passenger_count || 35;
        const loadPercentage = Math.round((passengers / capacity) * 100);

        const paxEl = document.getElementById('drawer-passengers-text');
        if (paxEl) {
            paxEl.textContent = `${I18n.t('trips.bus_passengers') || 'Bus Passengers:'} ${passengers}/${capacity} (${loadPercentage}% load)`;
        }

        const dwellCountdownEl = document.getElementById('dwell-countdown-val');
        if (dwellCountdownEl && trip.dwell_seconds != null) {
            dwellCountdownEl.textContent = `${trip.dwell_seconds}s`;
        }
    },

    getStopCrowdInfo(stop, stopIdx) {
        if (!stop) return this.formatCrowdBadge('LOW');

        const stopId = stop.stop_id || stop.id || '';

        // 1. If user explicitly updated crowd for this stop/trip:
        if (this._userStopCrowdLevels && this._userStopCrowdLevels[stopId]) {
            return this.formatCrowdBadge(this._userStopCrowdLevels[stopId]);
        }

        // 2. If user joined waitlist at this stop:
        const isUserWaitingHere = this.userWaitlist && (this.userWaitlist.stop_id === stopId || this.userWaitlist.id === stopId);
        if (isUserWaitingHere) {
            return this.formatCrowdBadge('MID');
        }

        // 3. If user reported overall crowd for this trip:
        if (this._tripReportedCrowdLevel) {
            if (this._tripReportedCrowdLevel === 'low') {
                return this.formatCrowdBadge('LOW');
            } else if (this._tripReportedCrowdLevel === 'medium') {
                return this.formatCrowdBadge((stopIdx % 2 === 0) ? 'MID' : 'LOW');
            } else {
                return this.formatCrowdBadge(stop.is_major ? 'HIGH' : 'MID');
            }
        }

        // 4. Distinct, natural variation based on bus index & stop index:
        let busNum = 1;
        const busNumStr = String(this.tripData?.bus_number || this.tripData?.id || '');
        if (busNumStr.includes('3782') || busNumStr.includes('02')) busNum = 2;
        else if (busNumStr.includes('3783') || busNumStr.includes('03')) busNum = 3;
        else if (busNumStr.includes('3784') || busNumStr.includes('04')) busNum = 4;
        else busNum = 1;

        const idx = Number(stopIdx) || 0;
        const pattern = (busNum * 3 + idx * 7) % 10;

        let level = 'LOW';
        if (busNum === 1) {
            level = (pattern < 7) ? 'LOW' : 'MID';
        } else if (busNum === 2) {
            level = (pattern < 4) ? 'LOW' : (pattern < 8 ? 'MID' : 'HIGH');
        } else if (busNum === 3) {
            level = (pattern < 6) ? 'LOW' : 'MID';
        } else {
            level = (pattern < 3) ? 'LOW' : (pattern < 7 ? 'MID' : 'HIGH');
        }

        return this.formatCrowdBadge(level);
    },

    formatCrowdBadge(level) {
        const norm = (level || 'LOW').toUpperCase();
        if (norm === 'HIGH') {
            return {
                level: 'HIGH',
                text: 'HIGH',
                dotColor: 'bg-error',
                textColor: 'text-error',
                badgeClass: 'text-error bg-error/15 border-error/30'
            };
        } else if (norm === 'MID' || norm === 'MEDIUM') {
            return {
                level: 'MID',
                text: 'MID',
                dotColor: 'bg-tertiary',
                textColor: 'text-tertiary',
                badgeClass: 'text-tertiary bg-tertiary/15 border-tertiary/30'
            };
        } else {
            return {
                level: 'LOW',
                text: 'LOW',
                dotColor: 'bg-secondary',
                textColor: 'text-secondary',
                badgeClass: 'text-secondary bg-secondary/15 border-secondary/30'
            };
        }
    },

    renderDrawerUI() {
        const container = document.getElementById('trip-live-drawer-content');
        if (!container || !this.tripData) return;

        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isInteracting = activeTag === 'select' || activeTag === 'input' || activeTag === 'textarea' || this._isInteractingWithSelect;

        // If user is actively interacting with ANY dropdown or input in the drawer, update in-place without destroying DOM nodes
        if (container.querySelector('#drawer-eta-value') && isInteracting) {
            this.updateLiveTelemetryInPlace();
            return;
        }

        // Preserve scroll positions of drawer and stops list
        const drawerScrollTop = container.scrollTop;
        const existingStopsScroll = document.getElementById('route-stops-scroll-list');
        const stopsScrollTop = existingStopsScroll ? existingStopsScroll.scrollTop : (this._savedStopsScrollTop || 0);

        // Preserve selected stop in waitlist dropdown
        const existingWaitlistSelect = document.getElementById('inline-waitlist-stop-select');
        if (existingWaitlistSelect && existingWaitlistSelect.value) {
            this._selectedWaitlistStopId = existingWaitlistSelect.value;
        }

        const trip = this.tripData;
        const currentIdx = trip.current_stop_index || 0;
        const stops = trip.stops || [];
        const currentStop = stops[currentIdx] || { stop_name: 'In Transit' };
        const nextStop = currentIdx + 1 < stops.length ? stops[currentIdx + 1] : null;

        // Forecast data
        const forecast = trip.forecast;
        const nextForecast = forecast ? forecast.next_stop_forecast : null;

        // ETA & Arrival Text Calculation
        let etaValue = 2;
        let etaDisplayText = '2 mins';
        if (trip.state === 'at_stop') {
            const dwellSec = trip.dwell_seconds != null ? trip.dwell_seconds : 15;
            etaDisplayText = `AT STOP (${dwellSec}s)`;
            etaValue = dwellSec;
        } else if (nextForecast) {
            etaValue = nextForecast.wait_time_minutes || 2;
            etaDisplayText = nextForecast.display_text || `${etaValue} mins`;
        } else if (nextStop && nextStop.eta) {
            etaValue = nextStop.eta.eta_minutes || 2;
            etaDisplayText = nextStop.eta.display_text || `${etaValue} mins`;
        }

        // Passenger count & Load percentage
        const capacity = trip.capacity || 55;
        const passengers = trip.current_passenger_count || 35;
        const loadPercentage = Math.round((passengers / capacity) * 100);
        
        const crowdLevel = trip.crowd_level || (loadPercentage <= 40 ? 'low' : (loadPercentage <= 70 ? 'medium' : 'high'));
        let crowdLabel = 'MED';
        let crowdFullText = 'MEDIUM CROWD';
        let crowdDotColor = 'bg-tertiary';
        let crowdTextColor = 'text-tertiary';

        if (crowdLevel === 'low') {
            crowdLabel = 'LOW';
            crowdFullText = 'LOW CROWD';
            crowdDotColor = 'bg-secondary';
            crowdTextColor = 'text-secondary';
        } else if (crowdLevel === 'high') {
            crowdLabel = 'HIGH';
            crowdFullText = 'HIGH CROWD';
            crowdDotColor = 'bg-error';
            crowdTextColor = 'text-error';
        }

        // Upcoming stops for Card 2 (Show next 3 upcoming stops along the route)
        let upcomingStops = stops.slice(currentIdx + 1, currentIdx + 4);
        if (upcomingStops.length === 0 && stops.length > 0) {
            upcomingStops = stops.slice(0, Math.min(3, stops.length));
        }

        // Synchronized Next Stop Crowd Info
        const nextStopInfo = this.getStopCrowdInfo(nextStop, currentIdx + 1);

        container.innerHTML = `
            <!-- Next Stop Arrival & Bus Crowd / Passengers Bar -->
            <div class="flex justify-between items-end pt-1 pb-2 border-b border-white/10">
                <div>
                    <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5" id="drawer-eta-header-label">
                        ${(trip.state === 'at_stop' && (trip.dwell_seconds == null || trip.dwell_seconds > 0)) ? 'BUS AT STATION' : 'NEXT STOP ARRIVAL'}
                    </p>
                    <div class="flex items-baseline gap-1.5">
                        <span class="text-2xl font-extrabold text-white tracking-tight" id="drawer-eta-value">
                            ${etaDisplayText}
                        </span>
                    </div>
                    <p class="text-[10px] text-gray-400 font-medium mt-0.5" id="drawer-eta-subtext">
                        ${(trip.state === 'at_stop' && (trip.dwell_seconds == null || trip.dwell_seconds > 0))
                            ? `Next stop (${nextStop ? I18n.translateStop(nextStop.stop_name || nextStop.name) : 'Terminus'}) in ~${nextForecast ? (nextForecast.wait_time_minutes || 2) : 2} mins after departure`
                            : `Next stop: ${nextStop ? I18n.translateStop(nextStop.stop_name || nextStop.name) : 'Terminus'}`
                        }
                    </p>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <div class="flex items-center gap-1.5 text-xs font-bold ${crowdTextColor}">
                        <span class="w-2.5 h-2.5 rounded-full ${crowdDotColor}"></span>
                        <span>${I18n.t('trips.bus_crowd') || 'BUS CROWD:'} ${crowdLabel}</span>
                    </div>
                    <p class="text-[11px] text-gray-300 font-medium flex items-center gap-1" id="drawer-passengers-text">
                        <span>🚌</span>
                        <span>${I18n.t('trips.bus_passengers') || 'Bus Passengers:'} ${passengers}/${capacity} (${loadPercentage}% load)</span>
                    </p>
                </div>
            </div>

            <!-- Deboard Audio Alarm Control Toggle -->
            <button 
                onclick="TripsView.toggleDeboardAlarm()"
                class="w-full py-2.5 px-3.5 rounded-xl border ${this.isDeboardAlarmActive ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]' : 'bg-surface-container-high border-white/10 text-on-surface-variant'} flex items-center justify-between font-bold text-xs transition-all active:scale-[0.99] cursor-pointer my-1 shadow-sm"
                id="deboard-alarm-btn"
            >
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-base ${this.isDeboardAlarmActive ? 'text-amber-400 animate-pulse' : 'text-on-surface-variant'}">notifications_active</span>
                    <span>${this.isDeboardAlarmActive ? 'Deboard Audio Alarm ACTIVE (Beep Alert)' : 'Enable Deboard Audio Alarm'}</span>
                </div>
                <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${this.isDeboardAlarmActive ? 'bg-amber-500 text-black' : 'bg-white/10 text-on-surface-variant'}">
                    ${this.isDeboardAlarmActive ? 'ON' : 'OFF'}
                </span>
            </button>

            <!-- 🌟 DEPARTED FROM & STATION DWELL LIVE INFO BANNER 🌟 -->
            ${trip.state === 'at_stop' ? `
                <div class="bg-primary/10 border border-primary/40 rounded-2xl p-3 flex items-center justify-between shadow-lg">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                            <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">hail</span>
                        </div>
                        <div class="min-w-0">
                            <div class="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                                <span>Bus Stopped At Station</span>
                            </div>
                            <div class="text-xs font-bold text-white truncate">${I18n.translateStop(currentStop.stop_name || currentStop.name)}</div>
                        </div>
                    </div>
                    <div class="bg-primary/20 border border-primary/40 px-3 py-1 rounded-xl text-right flex-shrink-0">
                        <div class="text-[9px] text-gray-300 font-semibold uppercase">Departs In</div>
                        <div class="text-xs font-extrabold text-primary flex items-center gap-1 justify-end">
                            <span class="material-symbols-outlined text-xs">timer</span>
                            <span id="dwell-countdown-val">${trip.dwell_seconds != null ? trip.dwell_seconds : 15}s</span>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="bg-white/[0.03] border border-white/10 rounded-2xl p-3 flex items-center justify-between shadow-md">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary flex-shrink-0">
                            <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">departure_board</span>
                        </div>
                        <div class="min-w-0">
                            <div class="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Left From Stop</div>
                            <div class="text-xs font-bold text-white truncate">${I18n.translateStop(currentStop.stop_name || currentStop.name)}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 text-right flex-shrink-0">
                        <div class="min-w-0">
                            <div class="text-[10px] text-secondary font-semibold uppercase tracking-wider">Next Stop</div>
                            <div class="text-xs font-bold text-gray-100 truncate max-w-[130px]">${I18n.translateStop(nextStop ? (nextStop.stop_name || nextStop.name) : 'Terminus')}</div>
                        </div>
                        <span class="material-symbols-outlined text-secondary text-sm">arrow_forward</span>
                    </div>
                </div>
            `}

            <!-- 🌟 WAITING LIST INTERFACE: CHOOSE STOP TO JOIN, OR SHOW ACTIVE BANNER WHEN JOINED 🌟 -->
            ${this.userWaitlist ? `
                <!-- Active Waiting List Banner (Shown ONLY after user joins) -->
                <div class="bg-secondary/15 border border-secondary/40 rounded-2xl p-3 flex items-center justify-between shadow-md">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl bg-secondary/25 flex items-center justify-center text-secondary">
                            <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">timer</span>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-secondary">${I18n.t('trips.you_are_waiting') || 'You are on the Waiting List'}</div>
                            <div class="text-[10px] text-gray-300">Registered for this bus at ${I18n.translateStop(
                                this.userWaitlist.stop_name || 
                                ((this.tripData?.stops || []).find(s => s.stop_id === (this.userWaitlist.stop_id || this.userWaitlist.id) || s.id === (this.userWaitlist.stop_id || this.userWaitlist.id))?.stop_name) ||
                                'Stop'
                            )}</div>
                        </div>
                    </div>
                    <button 
                        class="px-2.5 py-1 rounded-lg bg-secondary/20 hover:bg-secondary/30 text-secondary text-[11px] font-bold border border-secondary/30 transition-all cursor-pointer"
                        onclick="TripsView.handleLeaveWaitlist('${this.userWaitlist.stop_id || this.userWaitlist.id}')"
                    >
                        ${I18n.t('trips.leave_queue') || 'Leave Queue'}
                    </button>
                </div>
            ` : `
                <!-- Initial Waiting List Card (User chooses stop to join) -->
                <div class="bg-[#10141d]/90 border border-white/10 rounded-2xl p-3.5 space-y-2.5 shadow-xl">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                <span class="material-symbols-outlined text-base">hail</span>
                            </div>
                            <div>
                                <h4 class="text-xs font-bold text-white">Join Stop Waiting List</h4>
                                <p class="text-[10px] text-gray-400">Queue for this bus & reserve crowd seat intelligence</p>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <select 
                            id="inline-waitlist-stop-select"
                            class="flex-1 bg-[#1e2638] text-white text-xs font-semibold rounded-xl px-3 py-2 border border-white/20 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer truncate"
                            style="color: #ffffff !important; background-color: #1e2638 !important;"
                            onchange="TripsView._selectedWaitlistStopId = this.value"
                        >
                            ${stops.filter((s, idx) => idx >= currentIdx).map(s => `
                                <option value="${s.stop_id}" ${this._selectedWaitlistStopId === s.stop_id ? 'selected' : ''} style="color: #ffffff !important; background-color: #151b28 !important;">
                                    ${I18n.translateStop(s.stop_name || s.name)}
                                </option>
                            `).join('')}
                        </select>
                        <button 
                            class="bg-secondary text-[#003822] font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer flex-shrink-0"
                            onclick="TripsView.handleInlineJoinWaitlist()"
                        >
                            <span class="material-symbols-outlined text-sm font-bold">add</span>
                            <span>Join Queue</span>
                        </button>
                    </div>
                </div>
            `}

            <!-- 🌟 LIVE CROWD INTELLIGENCE BREAKDOWN HEADER ROW 🌟 -->
            <div class="flex items-center justify-between pt-0.5">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-base" style="font-variation-settings: 'FILL' 1;">groups</span>
                    <h3 class="text-xs font-bold text-white uppercase tracking-wider">
                        ${I18n.t('trips.live_crowd_breakdown') || 'LIVE CROWD INTELLIGENCE BREAKDOWN'}
                    </h3>
                </div>
            </div>

            <!-- 🌟 2-CARDS GRID (Card 1: People in Bus, Card 2: People Waiting at Stop) 🌟 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- Card 1: 1. People In The Bus -->
                <div class="bg-[#10141d]/90 border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-bold text-white flex items-center gap-1.5">
                                <span>🚌</span>
                                <span>${I18n.t('trips.people_in_bus') || '1. People In The Bus'}</span>
                            </span>
                        </div>
                        <span class="border border-white/20 bg-white/5 px-2.5 py-0.5 rounded-full text-xs text-white font-semibold">
                            ${passengers} ${I18n.t('trips.onboard_label') || 'On-Board'}
                        </span>
                    </div>

                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Bus Passenger Capacity:</span>
                            <span class="font-bold text-white">${passengers}/${capacity} (${loadPercentage}%)</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Bus On-Board Crowd:</span>
                            <span class="font-bold ${crowdTextColor}">${crowdFullText}</span>
                        </div>
                    </div>

                    <p class="text-[10px] text-gray-400 italic pt-1 border-t border-white/5">
                        * Passenger count increases ONLY when commuters click "I'm Boarding".
                    </p>
                </div>

                <!-- Card 2: 2. People Waiting At Stop -->
                <div class="bg-[#10141d]/90 border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-bold text-white flex items-center gap-1.5">
                                <span>🚶</span>
                                <span>${I18n.t('trips.people_waiting_stop') || '2. People Waiting At Stop'}</span>
                            </span>
                        </div>
                        <span class="border ${nextStopInfo.badgeClass} px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 1;">flag</span>
                            <span>${nextStopInfo.text} at Next Stop</span>
                        </span>
                    </div>

                    <div class="space-y-2 text-xs">
                        ${upcomingStops.map((s, uIdx) => {
                            const stopIdx = currentIdx + 1 + uIdx;
                            const info = this.getStopCrowdInfo(s, stopIdx);

                            return `
                                <div class="flex justify-between items-center py-0.5">
                                    <span class="text-gray-200 truncate max-w-[180px] font-medium">${I18n.translateStop(s.stop_name || s.name)}</span>
                                    <span class="flex items-center gap-1.5 font-bold ${info.textColor} text-[11px]">
                                        <span class="w-2 h-2 rounded-full ${info.dotColor}"></span>
                                        <span>${info.text}</span>
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-white/5">
                        <div class="flex items-center gap-3">
                            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-secondary"></span> Low (1-5)</span>
                            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-tertiary"></span> Mid (6-10)</span>
                            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-error"></span> High (10+)</span>
                        </div>
                        <span class="italic text-gray-400">Updates live</span>
                    </div>
                </div>
            </div>

            <!-- 🌟 ROUTE STOPS & LIVE PROGRESS (Full-Width Horizontal) 🌟 -->
            <div class="bg-[#10141d]/90 border border-white/10 rounded-2xl p-4 shadow-xl space-y-2.5 w-full">
                <div class="flex justify-between items-center pb-2 border-b border-white/10">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-base" style="font-variation-settings: 'FILL' 1;">alt_route</span>
                        <h3 class="text-xs font-bold text-white uppercase tracking-wider">
                            ${I18n.t('trips.route_stops_progress') || 'Route Stops & Live Progress'}
                        </h3>
                    </div>
                    <span class="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                        <span>GPS Updated</span>
                    </span>
                </div>

                <!-- Scrollable Stops List with Scroll Preservation -->
                <div id="route-stops-scroll-list" class="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    ${stops.map((s, idx) => {
                        const isPassed = idx < currentIdx;
                        const isCurrent = idx === currentIdx;
                        const isNext = idx === currentIdx + 1;
                        const isNextNext = idx === currentIdx + 2;

                        let rowClass = 'bg-white/[0.02] border-white/5';
                        let dotColor = 'bg-gray-500';
                        let textColor = 'text-gray-400';
                        let badgeHtml = '';

                        if (isCurrent) {
                            rowClass = 'bg-primary/10 border-primary/40 shadow-sm';
                            dotColor = 'bg-primary';
                            textColor = 'text-white font-bold';
                            badgeHtml = `
                                <span class="bg-primary/20 text-primary border border-primary/30 text-[9.5px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <span>🚌</span>
                                    <span>${trip.state === 'at_stop' ? 'At Stop' : 'Here'}</span>
                                </span>
                            `;
                        } else if (isNext) {
                            rowClass = 'bg-white/[0.04] border-secondary/30';
                            dotColor = 'bg-secondary';
                            textColor = 'text-gray-100 font-semibold';
                            badgeHtml = `
                                <span class="bg-secondary/20 text-secondary border border-secondary/30 text-[9.5px] px-2 py-0.5 rounded-full font-bold">
                                    Next
                                </span>
                            `;
                        } else if (isNextNext) {
                            rowClass = 'bg-white/[0.02] border-white/10';
                            dotColor = 'bg-gray-400';
                            textColor = 'text-gray-300';
                            badgeHtml = `
                                <span class="bg-white/10 text-gray-300 border border-white/15 text-[9.5px] px-2 py-0.5 rounded-full font-semibold">
                                    Next+1
                                </span>
                            `;
                        } else if (isPassed) {
                            dotColor = 'bg-gray-600';
                            textColor = 'text-gray-500 line-through';
                            badgeHtml = `<span class="text-gray-500 text-[9px]">Passed</span>`;
                        }

                        // Crowd status (100% unified with Card 2)
                        const stopCrowd = this.getStopCrowdInfo(s, idx);

                        return `
                            <div class="flex justify-between items-center px-3 py-2 rounded-xl border ${rowClass} transition-all">
                                <div class="flex items-center gap-2.5 min-w-0">
                                    <span class="w-2 h-2 rounded-full ${dotColor} flex-shrink-0"></span>
                                    <span class="text-xs ${textColor} truncate">${I18n.translateStop(s.stop_name || s.name)}</span>
                                </div>
                                <div class="flex items-center gap-1.5 flex-shrink-0">
                                    ${badgeHtml}
                                    <span class="border ${stopCrowd.badgeClass} text-[9.5px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                        <span class="w-1.5 h-1.5 rounded-full ${stopCrowd.dotColor}"></span>
                                        <span>${stopCrowd.text}</span>
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Destination Notification Picker (Deboard Alarm) -->
            <div class="bg-[#10141d]/90 border ${this.isOnBoard ? 'border-secondary/30 shadow-[0_0_20px_rgba(78,222,163,0.15)]' : 'border-white/10 opacity-75'} rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-xl transition-all">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="material-symbols-outlined ${this.isOnBoard ? 'text-secondary animate-pulse' : 'text-gray-400'} text-lg" style="font-variation-settings: 'FILL' 1;">
                        ${this.isOnBoard ? 'notifications_active' : 'lock'}
                    </span>
                    <div class="flex flex-col min-w-0">
                        <span class="text-xs text-white font-bold truncate">${I18n.t('trips.deboard_alarm') || 'Deboard Alarm'}</span>
                        ${!this.isOnBoard ? '<span class="text-[9.5px] text-amber-300 font-medium flex items-center gap-0.5"><span>🔒</span> Board bus to enable alarm</span>' : ''}
                    </div>
                </div>
                <select 
                    id="deboard-alarm-select"
                    class="bg-[#1e2638] text-white text-xs font-semibold rounded-xl px-3 py-1.5 border ${this.isOnBoard ? 'border-white/20' : 'border-white/10 opacity-60 cursor-not-allowed'} focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    style="color: #ffffff !important; background-color: #1e2638 !important;"
                    ${!this.isOnBoard ? 'disabled' : ''}
                    onchange="TripsView.setDestination(this.value)"
                >
                    <option value="" style="color: #ffffff !important; background-color: #151b28 !important;">
                        ${!this.isOnBoard ? '🔒 Board Bus First' : (I18n.t('trips.choose_stop') || '-- Choose Stop --')}
                    </option>
                    ${this.isOnBoard ? stops.filter((s, idx) => idx > currentIdx).map(s => `
                        <option value="${s.stop_id}" ${this.selectedDestinationStopId === s.stop_id ? 'selected' : ''} style="color: #ffffff !important; background-color: #151b28 !important;">
                            ${I18n.translateStop(s.stop_name)}
                        </option>
                    `).join('') : ''}
                </select>
            </div>

            <!-- Action Buttons (Boarding & Deboarding Symmetrical Bar) -->
            <div class="flex flex-col gap-2.5 mt-auto pt-2 w-full">
                <div class="flex items-center gap-2.5 w-full">
                    <!-- Boarding Button -->
                    <button 
                        class="flex-1 min-w-0 py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-extrabold text-xs transition-all shadow-md active:scale-95 cursor-pointer ${this.isOnBoard ? 'cursor-default' : ''}"
                        style="${this.isOnBoard 
                            ? 'background-color: rgba(16, 185, 129, 0.18) !important; border: 1.5px solid rgba(16, 185, 129, 0.5) !important; color: #34d399 !important;' 
                            : (trip.state === 'at_stop'
                                ? 'background-color: #1a73e8 !important; color: #ffffff !important; box-shadow: 0 4px 14px rgba(26,115,232,0.45) !important;' 
                                : 'background-color: rgba(26, 115, 232, 0.15) !important; border: 1px solid rgba(26, 115, 232, 0.35) !important; color: #93c5fd !important;')}"
                        onclick="${!this.isOnBoard ? 'TripsView.handleBoarding()' : ''}"
                    >
                        <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">
                            ${this.isOnBoard ? 'check_circle' : (trip.state === 'at_stop' ? 'directions_bus' : 'lock_clock')}
                        </span>
                        <span class="truncate">
                            ${this.isOnBoard ? (I18n.t('trips.boarded') || 'On-Board ✓') : (trip.state === 'at_stop' ? (I18n.t('trips.im_boarding') || "I'm Boarding") : "Board at Stop")}
                        </span>
                    </button>

                    <!-- Deboarding Button -->
                    <button 
                        class="flex-1 min-w-0 py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-extrabold text-xs transition-all shadow-md active:scale-95 ${this.isOnBoard ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed opacity-40'}"
                        style="${this.isOnBoard 
                            ? (trip.state === 'at_stop'
                                ? 'background-color: #dc2626 !important; color: #ffffff !important; box-shadow: 0 4px 14px rgba(220,38,38,0.5) !important; border: 1px solid rgba(255,255,255,0.2) !important;' 
                                : 'background-color: rgba(220, 38, 38, 0.18) !important; border: 1px solid rgba(220, 38, 38, 0.35) !important; color: #fca5a5 !important;')
                            : 'background-color: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #9ca3af !important;'}"
                        onclick="TripsView.handleDeboardingClick()"
                    >
                        <span class="material-symbols-outlined text-lg">
                            ${this.isOnBoard && trip.state !== 'at_stop' ? 'lock_clock' : 'exit_to_app'}
                        </span>
                        <span class="truncate">
                            ${this.isOnBoard ? (trip.state === 'at_stop' ? "I'm Deboarding" : "Deboard at Stop") : "I'm Deboarding"}
                        </span>
                    </button>
                </div>

                <!-- Report Crowd Button -->
                <button 
                    class="w-full bg-white/5 border border-tertiary/30 text-tertiary font-bold text-xs py-2.5 px-4 rounded-xl flex justify-center items-center gap-2 hover:bg-tertiary/10 active:scale-95 transition-all shadow-md cursor-pointer"
                    onclick="TripsView.openCrowdModal()"
                >
                    <span class="material-symbols-outlined text-lg">group</span>
                    <span>Report Crowd Level (+10 Pts)</span>
                </button>
            </div>
        `;

        // Restore scroll positions seamlessly after DOM render
        if (drawerScrollTop) container.scrollTop = drawerScrollTop;
        const newStopsScroll = document.getElementById('route-stops-scroll-list');
        if (newStopsScroll) {
            newStopsScroll.scrollTop = stopsScrollTop;
            newStopsScroll.addEventListener('scroll', () => {
                this._savedStopsScrollTop = newStopsScroll.scrollTop;
            }, { passive: true });
        }

        // Attach focus and interaction listeners to ALL select dropdowns in the drawer
        container.querySelectorAll('select').forEach(select => {
            select.addEventListener('focus', () => { this._isInteractingWithSelect = true; });
            select.addEventListener('mousedown', () => { this._isInteractingWithSelect = true; });
            select.addEventListener('pointerdown', () => { this._isInteractingWithSelect = true; });
            select.addEventListener('blur', () => { 
                setTimeout(() => { this._isInteractingWithSelect = false; }, 600); 
            });
            select.addEventListener('change', () => { 
                this._isInteractingWithSelect = false;
                select.blur();
            });
        });
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
                                    ${I18n.translateStop(s.stop_name)} (${s.is_major ? 'Major Hub' : 'Stop'} • ~${s.eta ? s.eta.eta_minutes : 5}m away)
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
        const selectedStop = (this.tripData?.stops || []).find(s => s.stop_id === stopId || s.id === stopId);
        const stopName = selectedStop ? (selectedStop.stop_name || selectedStop.name) : 'Stop';
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

            this.userWaitlist = { ...(res.waitlist || {}), stop_id: stopId, stop_name: stopName, status: 'waiting' };
            this.alertedBoarding = false;
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

    async handleInlineJoinWaitlist() {
        const select = document.getElementById('inline-waitlist-stop-select');
        if (!select || !select.value) {
            NotificationUtils.showToast('Select Stop', 'Please select a stop to join the waiting list', 'warning');
            return;
        }

        const stopId = select.value;
        const selectedStop = (this.tripData?.stops || []).find(s => s.stop_id === stopId || s.id === stopId);
        const stopName = selectedStop ? (selectedStop.stop_name || selectedStop.name) : 'Stop';

        try {
            if (API.isAuthenticated()) {
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
                this.userWaitlist = { ...(res.waitlist || {}), stop_id: stopId, stop_name: stopName, status: 'waiting' };
                if (window.app && typeof window.app.updateSidebarUser === 'function') {
                    window.app.updateSidebarUser();
                }
            } else {
                this.userWaitlist = { stop_id: stopId, stop_name: stopName, status: 'waiting' };
            }

            this.alertedBoarding = false;
            NotificationUtils.showToast('Joined Waiting List! 🎉', `Registered for this bus at ${I18n.translateStop(stopName)}.`, 'success', 4000);
            this.renderDrawerUI();
        } catch (e) {
            // Fallback for seamless commuter experience
            this.userWaitlist = { stop_id: stopId, stop_name: stopName, status: 'waiting' };
            this.alertedBoarding = false;
            NotificationUtils.showToast('Joined Waiting List! 🎉', `Registered for this bus at ${I18n.translateStop(stopName)}.`, 'success', 4000);
            this.renderDrawerUI();
        }
    },

    async handleLeaveWaitlist(stopId) {
        try {
            await API.leaveWaitlist(stopId, this.tripId);
            this.userWaitlist = null;
            this.alertedBoarding = false;
            NotificationUtils.showToast('Removed', 'You have left the stop waiting list', 'info');
            this.renderDrawerUI();
        } catch (e) {
            this.userWaitlist = null;
            this.alertedBoarding = false;
            NotificationUtils.showToast('Removed', 'You have left the stop waiting list', 'info');
            this.renderDrawerUI();
        }
    },

    setDestination(stopId) {
        if (!this.isOnBoard && stopId) {
            NotificationUtils.showToast('Boarding Required ⚠️', 'Please tap "I\'m Boarding" first before setting a deboarding alarm.', 'warning', 4000);
            this.selectedDestinationStopId = null;
            this.renderDrawerUI();
            return;
        }

        if (!stopId) {
            this.selectedDestinationStopId = null;
            this.alertedNear = false;
            if (this.tripId) {
                localStorage.removeItem('lumina_dest_' + this.tripId);
            }
            NotificationUtils.showToast('Alarm Cleared', 'Deboarding alert turned off.', 'info', 3000);
            return;
        }

        this.selectedDestinationStopId = stopId;
        this.alertedNear = false;
        this.alertedNextStopDeboard = false;
        this.alertedAtDestinationDeboard = false;
        this.alertedMissedStop = false;
        this.lastMissedAlertStopIndex = null;
        if (this.tripId) {
            localStorage.setItem('lumina_dest_' + this.tripId, stopId);
        }

        if (this.tripData && this.tripData.stops) {
            const destIdx = this.tripData.stops.findIndex(s => s.stop_id === stopId);
            const currentIdx = this.tripData.current_stop_index || 0;
            const stop = this.tripData.stops[destIdx];
            const destName = stop ? (stop.stop_name || stop.name) : 'your destination';
            const currStop = this.tripData.stops[currentIdx];
            const currName = currStop ? (currStop.stop_name || currStop.name) : 'Current Station';

            // Sync with backend API
            API.setDestinationAlarm(this.tripId, stopId).catch(() => {});

            const stopsRemaining = destIdx - currentIdx;
            if (stopsRemaining === 1) {
                // Bus is already at the preceding stop right before destination -> alert now!
                this.alertedNear = true;
                this.triggerDeboardingAlert(destName, currName);
            } else if (stopsRemaining > 1) {
                NotificationUtils.showToast(
                    'Deboard Alarm Active',
                    `We will alert you when the bus arrives at the station before ${destName}.`,
                    'info',
                    4500
                );
            }
        }
    },

    triggerBoardingAlert(waitlistStopName, currentStopName, isAtStation = false, etaText = '1 min') {
        // 1. Audio Chime
        try { NotificationUtils.playChime(); } catch(e) {}

        const displayTimeText = isAtStation ? 'At Station' : (etaText.includes('min') ? etaText : `${etaText} mins`);

        // 2. Announce Voice Alert
        try {
            const speechText = isAtStation
                ? `Attention: Route ${this.tripData?.route_short_name || '378'} has arrived at ${waitlistStopName}. Please board the bus now.`
                : `Attention: Route ${this.tripData?.route_short_name || '378'} is ${displayTimeText} away from ${waitlistStopName}. Please get ready to board.`;
            NotificationUtils.speakAlert(speechText);
        } catch(e) {}

        // 3. Haptic Vibration
        try {
            if ('vibrate' in navigator) {
                navigator.vibrate([350, 150, 350, 150, 600]);
            }
        } catch(e) {}

        // 4. Persistent Toast Banner
        NotificationUtils.showToast(
            isAtStation ? '🚌 Bus Has Arrived!' : `🚌 Bus Arriving in ~${displayTimeText}!`,
            isAtStation 
                ? `Route ${this.tripData?.route_short_name || '378'} is at ${waitlistStopName}. Please board now!`
                : `Bus is at ${currentStopName}, next stop is ${waitlistStopName} (ETA ~${displayTimeText}) — prepare to board!`,
            'bus_approaching',
            10000
        );

        const isDark = document.documentElement.classList.contains('dark');
        const modalBg = isDark ? '#10141d' : '#ffffff';
        const titleColor = isDark ? '#ffffff' : '#111827';
        const bodyColor = isDark ? '#c2c6d6' : '#374151';
        const highlightColor = isDark ? '#ffffff' : '#111827';
        const dismissBtnBg = isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
        const dismissBtnText = isDark ? '#ffffff' : '#111827';
        const dismissBtnBorder = isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db';

        // 5. Present Boarding Attention Modal
        window.app.showModal(`
            <div class="rounded-3xl p-6 text-center space-y-4 border-2 border-primary shadow-2xl max-w-sm mx-auto animate-in" style="background-color: ${modalBg} !important; color: ${titleColor} !important;">
                <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce" style="background-color: rgba(26, 115, 232, 0.15); border: 1.5px solid rgba(26, 115, 232, 0.35); color: #1a73e8;">
                    <span class="material-symbols-outlined text-4xl" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                </div>
                <div>
                    <span class="text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block" style="background-color: rgba(26, 115, 232, 0.15); border: 1px solid rgba(26, 115, 232, 0.35); color: #1a73e8;">
                        ${isAtStation ? 'Bus At Station • Board Now' : `Boarding Alert • ~${displayTimeText}`}
                    </span>
                    <h3 class="text-xl font-extrabold mt-3" style="color: ${titleColor} !important;">
                        ${isAtStation ? `Bus Arrived at ${I18n.translateStop(waitlistStopName)}` : `Next Stop: ${I18n.translateStop(waitlistStopName)}`}
                    </h3>
                    <p class="text-xs mt-2 leading-relaxed font-medium" style="color: ${bodyColor} !important;">
                        ${isAtStation 
                            ? `Route <strong style="color: ${highlightColor} !important; font-weight: 700;">${this.tripData?.route_short_name || '378'}</strong> is at <strong style="color: ${highlightColor} !important; font-weight: 700;">${I18n.translateStop(waitlistStopName)}</strong>. Tap below to confirm boarding and update crowd intelligence.`
                            : `Route <strong style="color: ${highlightColor} !important; font-weight: 700;">${this.tripData?.route_short_name || '378'}</strong> is leaving <strong style="color: ${highlightColor} !important; font-weight: 700;">${I18n.translateStop(currentStopName)}</strong> and will reach <strong style="color: ${highlightColor} !important; font-weight: 700;">${I18n.translateStop(waitlistStopName)}</strong> in about ${displayTimeText}!`
                        }
                    </p>
                </div>
                <div class="flex gap-2 pt-2">
                    <button class="py-3 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-sm" style="background-color: ${dismissBtnBg} !important; color: ${dismissBtnText} !important; border: 1px solid ${dismissBtnBorder} !important;" onclick="window.app.closeModal()">
                        Remind on Arrival
                    </button>
                    <button class="flex-1 py-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-1.5" style="background-color: #1a73e8 !important; color: #ffffff !important;" onclick="TripsView.handleBoarding(); window.app.closeModal();">
                        <span class="material-symbols-outlined text-sm font-bold" style="color: #ffffff !important;">directions_bus</span>
                        <span style="color: #ffffff !important;">I'm Boarding (+10 Pts)</span>
                    </button>
                </div>
            </div>
        `);
    },

    triggerDeboardingAlert(destStopName, currentStopName) {
        // 1. Play Audio Chime
        NotificationUtils.playChime();

        // 2. Announce Voice Alert
        NotificationUtils.speakAlert(`Attention: The bus is at ${currentStopName}. Your destination ${destStopName} is the next stop. Please get ready to deboard.`);

        // 3. Haptic Vibration
        if ('vibrate' in navigator) {
            navigator.vibrate([300, 150, 300, 150, 500]);
        }

        // 4. Show Persistent Toast Banner
        NotificationUtils.showToast(
            '📍 Deboarding Alert: Next Stop!',
            `Bus is at ${currentStopName}. Next Stop is ${destStopName} — get ready to deboard!`,
            'destination_approaching',
            10000
        );

        const isDark = document.documentElement.classList.contains('dark');
        const modalBg = isDark ? '#10141d' : '#ffffff';
        const titleColor = isDark ? '#ffffff' : '#111827';
        const bodyColor = isDark ? '#c2c6d6' : '#374151';
        const highlightColor = isDark ? '#ffffff' : '#111827';
        const readyBtnBg = isDark ? '#00a572' : '#188038';
        const readyBtnText = '#ffffff';

        // 5. Present Attention Modal
        window.app.showModal(`
            <div class="rounded-3xl p-6 text-center space-y-4 border-2 shadow-2xl max-w-sm mx-auto animate-in" style="background-color: ${modalBg} !important; border-color: #188038 !important; color: ${titleColor} !important;">
                <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg" style="background-color: rgba(24, 128, 56, 0.15); border: 1.5px solid rgba(24, 128, 56, 0.35); color: #188038;">
                    <span class="material-symbols-outlined text-4xl" style="font-variation-settings: 'FILL' 1;">notifications_active</span>
                </div>
                <div>
                    <span class="text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block" style="background-color: rgba(24, 128, 56, 0.15); border: 1px solid rgba(24, 128, 56, 0.35); color: #188038;">
                        Deboarding Alert
                    </span>
                    <h3 class="text-xl font-extrabold mt-3" style="color: ${titleColor} !important;">Next Stop: ${I18n.translateStop(destStopName)}</h3>
                    <p class="text-xs mt-2 leading-relaxed font-medium" style="color: ${bodyColor} !important;">
                        The bus is currently at <strong style="color: ${highlightColor} !important; font-weight: 700;">${I18n.translateStop(currentStopName)}</strong>. Your destination is the very next stop! Please prepare to deboard.
                    </p>
                </div>
                <div class="flex gap-2 pt-2">
                    <button class="flex-1 py-3 px-4 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-md active:scale-95" style="background-color: ${readyBtnBg} !important; color: ${readyBtnText} !important;" onclick="window.app.closeModal()">
                        I'm Ready
                    </button>
                    <button class="flex-1 py-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5" style="background-color: #d93025 !important; color: #ffffff !important;" onclick="TripsView.handleDeboarding(); window.app.closeModal();">
                        <span class="material-symbols-outlined text-sm font-bold" style="color: #ffffff !important;">exit_to_app</span>
                        <span style="color: #ffffff !important;">Deboard Now</span>
                    </button>
                </div>
            </div>
        `);
    },

    async handleBoarding() {
        if (!API.isAuthenticated()) {
            window.app.showAuthModal();
            return;
        }

        const currentStop = this.tripData?.stops ? this.tripData.stops[this.tripData.current_stop_index] : null;
        const stopId = currentStop ? currentStop.stop_id : (this.tripData?.stops?.[0]?.stop_id || null);

        NotificationUtils.showToast('Verifying GPS... 📡', 'Validating high-precision GPS geofence telemetry.', 'info', 2000);

        try {
            const loc = await GPSUtils.getCurrentPosition();
            const res = await API.reportBoarding(
                this.tripId,
                stopId,
                loc.latitude,
                loc.longitude,
                loc.isDemo
            );

            const isVerified = !!(res && (res.verified || res.status === 'verified'));

            if (isVerified) {
                // Instantly update on-board status & passenger count ONLY when GPS is verified!
                this.isOnBoard = true;
                this.userWaitlist = null;
                if (res && res.passengerCount != null && this.tripData) {
                    this.tripData.current_passenger_count = res.passengerCount;
                } else if (this.tripData) {
                    this.tripData.current_passenger_count = (this.tripData.current_passenger_count || 35) + 1;
                }
                NotificationUtils.showToast('Boarding Verified! 🚌', 'Checked in on-board. Passenger count updated (+10 Pts)', 'success', 3500);
            } else {
                // Rejection: Keep isOnBoard = false
                this.isOnBoard = false;
                const reason = res?.verification?.rejectionReason || res?.message || 'You are outside the 350m bus stop geofence. Enable Demo Geofence if testing from home.';
                NotificationUtils.showToast('Boarding Rejected ⚠️', reason, 'error', 5000);
            }

            GPSUtils.showVerificationResultModal(res, 'Boarding Check-in');
            this.renderDrawerUI();
            this.updateLiveTelemetryInPlace();
            if (window.app && typeof window.app.updateSidebarUser === 'function') {
                window.app.updateSidebarUser();
            }
        } catch (e) {
            this.isOnBoard = false;
            NotificationUtils.showToast('Verification Error ⚠️', e.message || 'Failed to verify GPS location', 'error', 4000);
            this.renderDrawerUI();
            this.updateLiveTelemetryInPlace();
        }
    },

    handleDeboardingClick() {
        if (!this.isOnBoard) {
            NotificationUtils.showToast('Boarding Required ⚠️', 'You must check in with "I\'m Boarding" first before you can deboard.', 'warning', 3500);
            return;
        }
        this.handleDeboarding();
    },

    async handleDeboarding() {
        if (!this.isOnBoard) {
            NotificationUtils.showToast('Boarding Required ⚠️', 'You must be on board before you can deboard.', 'warning', 3500);
            return;
        }

        if (!API.isAuthenticated()) {
            window.app.showAuthModal();
            return;
        }

        const currentStop = this.tripData?.stops ? this.tripData.stops[this.tripData.current_stop_index] : null;
        const stopId = currentStop ? currentStop.stop_id : null;

        // Reset on-board status and clear deboard alarm
        this.isOnBoard = false;
        this.selectedDestinationStopId = null;
        this.alertedNear = false;
        if (this.tripId) {
            localStorage.removeItem('lumina_dest_' + this.tripId);
        }

        // Instantly decrement passenger count locally
        if (this.tripData && this.tripData.current_passenger_count > 0) {
            this.tripData.current_passenger_count -= 1;
        }
        this.renderDrawerUI();
        this.updateLiveTelemetryInPlace();

        try {
            const loc = await GPSUtils.getCurrentPosition();
            const res = await API.reportDeboarding(
                this.tripId,
                stopId,
                loc.latitude,
                loc.longitude,
                loc.isDemo
            );

            if (res && res.passengerCount != null && this.tripData) {
                this.tripData.current_passenger_count = res.passengerCount;
            }

            GPSUtils.showVerificationResultModal(res, 'Deboarding Confirmation');
            NotificationUtils.showToast('Deboarded Successfully! 👋', 'You have deboarded from this bus.', 'success', 3000);
            this.renderDrawerUI();
            this.updateLiveTelemetryInPlace();
            if (window.app && typeof window.app.updateSidebarUser === 'function') {
                window.app.updateSidebarUser();
            }
        } catch (e) {
            NotificationUtils.showToast('Deboarded 👋', 'You have deboarded from this bus.', 'info', 3000);
            this.renderDrawerUI();
            this.updateLiveTelemetryInPlace();
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

        // Immediately apply reported crowd level locally for instantaneous UI update
        this._tripReportedCrowdLevel = level;
        if (!this._userStopCrowdLevels) this._userStopCrowdLevels = {};
        if (stopId) {
            this._userStopCrowdLevels[stopId] = level === 'high' ? 'HIGH' : (level === 'medium' ? 'MID' : 'LOW');
        }
        if (this.tripData) {
            this.tripData.crowd_level = level;
            const cap = this.tripData.capacity || 55;
            if (level === 'low') this.tripData.current_passenger_count = Math.min(this.tripData.current_passenger_count || 20, Math.round(cap * 0.35));
            else if (level === 'medium') this.tripData.current_passenger_count = Math.round(cap * 0.65);
            else if (level === 'high') this.tripData.current_passenger_count = Math.round(cap * 0.9);
        }
        this.renderDrawerUI();
        this.updateLiveTelemetryInPlace();

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
    },

    destroy() {
        if (this.isMapEnlarged) {
            this.isMapEnlarged = false;
        }
    },

    toggleMapEnlarge(expand = null) {
        this.isMapEnlarged = expand !== null ? expand : !this.isMapEnlarged;

        const mapContainer = document.getElementById('trip-map-container');
        const bottomDrawer = document.getElementById('trip-bottom-drawer');
        const btn = document.getElementById('trip-enlarge-map-btn');

        if (mapContainer && bottomDrawer) {
            if (this.isMapEnlarged) {
                mapContainer.className = 'fixed top-0 left-0 w-full h-[calc(100vh-60px)] z-10 pt-14 transition-all duration-300';
                bottomDrawer.className = 'fixed bottom-0 w-full h-[70px] z-20 bg-[#0a0d14]/95 backdrop-blur-xl rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.85)] border-t border-white/10 flex flex-col pt-2.5 pb-[85px] overflow-hidden transition-all duration-300';
            } else {
                mapContainer.className = 'fixed top-0 w-full h-[38vh] min-h-[220px] max-h-[380px] z-0 pt-14 transition-all duration-300';
                bottomDrawer.className = 'fixed bottom-0 w-full h-[64vh] max-h-[660px] z-20 bg-[#0a0d14] rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.85)] border-t border-white/10 flex flex-col pt-2.5 pb-[85px] overflow-hidden transition-all duration-300';
            }
        }

        if (btn) {
            btn.innerHTML = `
                <span class="material-symbols-outlined text-sm font-bold">${this.isMapEnlarged ? 'close_fullscreen' : 'open_in_full'}</span>
                <span class="text-[11px] font-semibold">${this.isMapEnlarged ? 'Shrink' : 'Enlarge Map'}</span>
            `;
            btn.title = this.isMapEnlarged ? 'Shrink Map' : 'Enlarge Map';
        }

        // Invalidate Leaflet map size after CSS animation
        setTimeout(() => {
            if (window.MapUtils && MapUtils.map) {
                MapUtils.invalidateSize();
            }
        }, 320);
    },

    toggleDeboardAlarm() {
        this.isDeboardAlarmActive = !this.isDeboardAlarmActive;
        if (this.isDeboardAlarmActive && window.AlarmUtils) {
            AlarmUtils.playDeboardChime();
            NotificationUtils.showToast('🔔 Deboard Alarm Active', 'You will receive audio beeps and vibration when your stop is next or missed!', 'success', 3000);
        } else {
            NotificationUtils.showToast('Deboard Alarm Disabled', 'Audio beeps turned off', 'info', 2000);
        }
        this.renderDrawerUI();
    }
};
