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
    activeTab: 'summary', // 'summary' | 'forecast' | 'timeline'

    async render(params = {}) {
        this.tripId = params.tripId || null;

        if (!this.tripId) {
            return this.renderTripSelector();
        }

        return `
            <div class="view-fade-in fixed inset-0 z-30 bg-[#0a0d14] flex flex-col overflow-hidden text-white">
                <!-- Top App Bar (Pixel-matched Header) -->
                <header class="fixed top-0 w-full z-50 bg-[#0a0d14]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-4 h-14 transition-colors duration-200">
                    <button 
                        class="text-primary hover:opacity-80 transition-opacity active:scale-95 p-2 -ml-2 flex items-center justify-center cursor-pointer"
                        onclick="window.app.navigate('home')"
                        aria-label="Location / Home"
                        title="Back to Home / Locate"
                    >
                        <span class="material-symbols-outlined text-2xl text-primary" style="font-variation-settings: 'FILL' 1;">location_on</span>
                    </button>

                    <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm cursor-pointer hover:bg-white/10 transition-all" onclick="window.app.navigate('home')">
                        <span class="material-symbols-outlined text-primary text-base" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                        <h1 class="font-bold text-xs tracking-tight text-white">Lumina Transit</h1>
                    </div>

                    <div class="flex items-center gap-1.5">
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

                <!-- Main Map Area (Top ~38% vh) -->
                <div class="fixed top-0 w-full h-[38vh] min-h-[220px] max-h-[380px] z-0 pt-14">
                    <div id="live-trip-map" class="w-full h-full"></div>
                    <!-- Smooth Gradient Overlay -->
                    <div class="absolute bottom-0 w-full h-20 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/75 to-transparent pointer-events-none z-[400]"></div>

                    <!-- Recenter / Detect GPS Real Location Button -->
                    <button 
                        onclick="TripsView.detectGPSLocation()"
                        class="absolute top-16 right-3 bg-primary text-on-primary p-2.5 rounded-full shadow-[0_2px_12px_rgba(26,115,232,0.5)] hover:bg-primary-fixed active:scale-90 transition-all z-[450] flex items-center justify-center cursor-pointer"
                        title="Detect & Center My Real Location"
                        id="trip-locate-btn"
                    >
                        <span class="material-symbols-outlined text-lg font-bold">my_location</span>
                    </button>
                </div>

                <!-- Bottom Sheet / Drawer (Bottom ~64% vh) -->
                <main class="fixed bottom-0 w-full h-[64vh] max-h-[660px] z-20 bg-[#0a0d14] rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.85)] border-t border-white/10 flex flex-col pt-2.5 pb-[85px] overflow-hidden">
                    <!-- Drag Handle -->
                    <div class="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2 shrink-0"></div>

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
            this.userWaitlist = null; // Start fresh with Join Waiting List prompt
            this.alertedBoarding = false;
            this.alertedNear = false;
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

            // Re-render the drawer UI components to match exact current stop
            this.renderDrawerUI();

            // Check Waiting List Boarding Proximity Alert (1 Station / ~1 Min Before Chosen Stop)
            if (this.userWaitlist && this.userWaitlist.stop_id && this.tripData && this.tripData.stops && !this.isOnBoard) {
                const waitlistIdx = this.tripData.stops.findIndex(s => s.stop_id === this.userWaitlist.stop_id);
                if (waitlistIdx !== -1) {
                    const currentIdx = this.tripData.current_stop_index || 0;
                    const stopsRemaining = waitlistIdx - currentIdx;

                    if (stopsRemaining === 1 && !this.alertedBoarding) {
                        this.alertedBoarding = true;
                        const waitlistStop = this.tripData.stops[waitlistIdx];
                        const currentStop = this.tripData.stops[currentIdx];
                        const waitlistStopName = waitlistStop ? (waitlistStop.stop_name || waitlistStop.name) : 'your stop';
                        const currName = currentStop ? (currentStop.stop_name || currentStop.name) : 'Current Station';
                        this.triggerBoardingAlert(waitlistStopName, currName, false);
                    } else if (stopsRemaining <= 0 && this.tripData.state === 'at_stop' && this.alertedBoarding !== 'at_stop') {
                        this.alertedBoarding = 'at_stop';
                        const waitlistStop = this.tripData.stops[waitlistIdx];
                        const waitlistStopName = waitlistStop ? (waitlistStop.stop_name || waitlistStop.name) : 'your stop';
                        this.triggerBoardingAlert(waitlistStopName, waitlistStopName, true);
                    }
                }
            }

            // Check 1-Station-Before Deboarding Proximity Alert
            if (this.selectedDestinationStopId && this.tripData && this.tripData.stops) {
                const destIdx = this.tripData.stops.findIndex(s => s.stop_id === this.selectedDestinationStopId);
                if (destIdx !== -1) {
                    const currentIdx = this.tripData.current_stop_index || 0;
                    const stopsRemaining = destIdx - currentIdx;

                    if (stopsRemaining === 1 && !this.alertedNear) {
                        this.alertedNear = true;
                        const destStop = this.tripData.stops[destIdx];
                        const currentStop = this.tripData.stops[currentIdx];
                        const destName = destStop ? destStop.stop_name : 'your destination';
                        const currName = currentStop ? currentStop.stop_name : 'Current Station';
                        this.triggerDeboardingAlert(destName, currName);
                    } else if (stopsRemaining <= 0 && this.alertedNear !== 'arrived') {
                        this.alertedNear = 'arrived';
                        const destStop = this.tripData.stops[destIdx];
                        const destName = destStop ? destStop.stop_name : 'your destination';
                        NotificationUtils.showToast('Arrived at Destination!', `You have reached ${destName}. Please deboard now!`, 'success', 8000);
                        if ('vibrate' in navigator) navigator.vibrate([400, 150, 400]);
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

        let etaDisplayText = '2 mins';
        let etaValue = 2;
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

        const etaEl = document.getElementById('drawer-eta-value');
        if (etaEl) {
            etaEl.textContent = etaDisplayText;
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
        if (!stop) return { level: 'LOW', text: 'LOW', dotColor: 'bg-secondary', textColor: 'text-secondary', badgeClass: 'text-secondary bg-secondary/15 border-secondary/30' };

        const currentIdx = this.tripData?.current_stop_index || 0;
        const forecast = this.tripData?.forecast;

        let level = 'LOW';

        // 1. Check predicted crowd from backend
        if (stop.crowd_prediction && stop.crowd_prediction.predicted_level) {
            const l = stop.crowd_prediction.predicted_level.toUpperCase();
            level = l === 'HIGH' ? 'HIGH' : (l === 'MEDIUM' || l === 'MID' ? 'MID' : 'LOW');
        } 
        // 2. Next stop forecast check
        else if (stopIdx === currentIdx + 1 && forecast?.next_stop_forecast) {
            const f = forecast.next_stop_forecast;
            if (f.waiting_passengers_count > 10 || f.crowd_level === 'high') level = 'HIGH';
            else if (f.waiting_passengers_count > 5 || f.crowd_level === 'medium') level = 'MID';
            else level = 'LOW';
        } 
        // 3. Next+1 stop forecast check
        else if (stopIdx === currentIdx + 2 && forecast?.next_next_stop_forecast) {
            const f = forecast.next_next_stop_forecast;
            if (f.waiting_passengers_count > 10 || f.crowd_level === 'high') level = 'HIGH';
            else if (f.waiting_passengers_count > 5 || f.crowd_level === 'medium') level = 'MID';
            else level = 'LOW';
        } 
        // 4. Passenger wait count or major hub
        else {
            const count = stop.waiting_passengers || (stop.eta?.is_approaching ? 2 : 1);
            if (count > 10) level = 'HIGH';
            else if (count > 5) level = 'MID';
            else level = 'LOW';
        }

        if (level === 'HIGH') {
            return {
                level: 'HIGH',
                text: 'HIGH',
                dotColor: 'bg-error',
                textColor: 'text-error',
                badgeClass: 'text-error bg-error/15 border-error/30'
            };
        } else if (level === 'MID') {
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
                    <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">${I18n.t('trips.next_stop_arrival') || 'Next Stop Arrival'}</p>
                    <div class="flex items-baseline gap-1.5">
                        <span class="text-3xl font-extrabold text-white tracking-tight" id="drawer-eta-value">
                            ${etaDisplayText}
                        </span>
                    </div>
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
                            <div class="text-[10px] text-gray-300">Registered for this bus at ${I18n.translateStop(this.userWaitlist.stop_name || 'Stop')}</div>
                        </div>
                    </div>
                    <button 
                        class="px-2.5 py-1 rounded-lg bg-secondary/20 hover:bg-secondary/30 text-secondary text-[11px] font-bold border border-secondary/30 transition-all cursor-pointer"
                        onclick="TripsView.handleLeaveWaitlist('${this.userWaitlist.stop_id}')"
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
                        <span class="bg-primary/20 text-primary border border-primary/30 text-[9.5px] px-2 py-0.5 rounded-full font-bold">+15 Pts</span>
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
            <div class="bg-[#10141d]/90 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-xl">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="material-symbols-outlined text-secondary text-lg" style="font-variation-settings: 'FILL' 1;">notifications_active</span>
                    <span class="text-xs text-white font-bold truncate">${I18n.t('trips.deboard_alarm') || 'Deboard Alarm'}</span>
                </div>
                <select 
                    id="deboard-alarm-select"
                    class="bg-[#1e2638] text-white text-xs font-semibold rounded-xl px-3 py-1.5 border border-white/20 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    style="color: #ffffff !important; background-color: #1e2638 !important;"
                    onchange="TripsView.setDestination(this.value)"
                >
                    <option value="" style="color: #ffffff !important; background-color: #151b28 !important;">${I18n.t('trips.choose_stop') || '-- Choose Stop --'}</option>
                    ${stops.filter((s, idx) => idx > currentIdx).map(s => `
                        <option value="${s.stop_id}" ${this.selectedDestinationStopId === s.stop_id ? 'selected' : ''} style="color: #ffffff !important; background-color: #151b28 !important;">
                            ${I18n.translateStop(s.stop_name)}
                        </option>
                    `).join('')}
                </select>
            </div>

            <!-- Action Grid (Boarding & Deboarding Buttons) -->
            <div class="grid grid-cols-2 gap-3 mt-auto pt-1">
                <button 
                    class="${!this.isOnBoard ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(173,198,255,0.35)]' : 'bg-surface-container-high text-on-surface-variant'} font-bold text-xs py-3 px-3 rounded-xl flex justify-center items-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    onclick="TripsView.handleBoarding()"
                >
                    <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                    <span>${this.isOnBoard ? (I18n.t('trips.boarded') || 'Boarded ✓') : (I18n.t('trips.im_boarding') || "I'm Boarding")}</span>
                </button>

                <button 
                    class="${this.isOnBoard ? 'bg-error text-on-error' : 'bg-white/5 border border-white/10 text-white'} font-bold text-xs py-3 px-3 rounded-xl flex justify-center items-center gap-2 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    onclick="TripsView.handleDeboarding()"
                >
                    <span class="material-symbols-outlined text-lg">exit_to_app</span>
                    <span>I'm Deboarding</span>
                </button>

                <button 
                    class="col-span-2 bg-white/5 border border-tertiary/30 text-tertiary font-bold text-xs py-2.5 px-4 rounded-xl flex justify-center items-center gap-2 hover:bg-tertiary/10 active:scale-95 transition-all shadow-md cursor-pointer"
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
                this.userWaitlist = res.waitlist || { stop_id: stopId, stop_name: stopName, status: 'waiting' };
                if (window.app && typeof window.app.updateSidebarUser === 'function') {
                    window.app.updateSidebarUser();
                }
            } else {
                this.userWaitlist = { stop_id: stopId, stop_name: stopName, status: 'waiting' };
            }

            this.alertedBoarding = false;
            NotificationUtils.showToast('Joined Waiting List! 🎉', `Registered for this bus at ${I18n.translateStop(stopName)}. (+15 Pts)`, 'success', 4000);
            this.renderDrawerUI();

            // Immediate check: If bus is already ~1 min away (1 stop away or at stop), trigger Boarding Alert!
            const waitlistIdx = (this.tripData?.stops || []).findIndex(s => s.stop_id === stopId);
            const currentIdx = this.tripData?.current_stop_index || 0;
            if (waitlistIdx !== -1) {
                const stopsRemaining = waitlistIdx - currentIdx;
                if (stopsRemaining === 1) {
                    this.alertedBoarding = true;
                    const currentStop = this.tripData.stops[currentIdx];
                    const currName = currentStop ? (currentStop.stop_name || currentStop.name) : 'Current Station';
                    setTimeout(() => {
                        this.triggerBoardingAlert(stopName, currName, false);
                    }, 800);
                } else if (stopsRemaining <= 0 && this.tripData.state === 'at_stop') {
                    this.alertedBoarding = 'at_stop';
                    setTimeout(() => {
                        this.triggerBoardingAlert(stopName, stopName, true);
                    }, 800);
                }
            }
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

    triggerBoardingAlert(waitlistStopName, currentStopName, isAtStation = false) {
        // 1. Audio Chime
        NotificationUtils.playChime();

        // 2. Announce Voice Alert
        const speechText = isAtStation
            ? `Attention: Route ${this.tripData?.route_short_name || '378'} has arrived at ${waitlistStopName}. Please board the bus now.`
            : `Attention: Route ${this.tripData?.route_short_name || '378'} is 1 minute away from ${waitlistStopName}. Please get ready to board.`;
        NotificationUtils.speakAlert(speechText);

        // 3. Haptic Vibration
        if ('vibrate' in navigator) {
            navigator.vibrate([350, 150, 350, 150, 600]);
        }

        // 4. Persistent Toast Banner
        NotificationUtils.showToast(
            isAtStation ? '🚌 Bus Has Arrived!' : '🚌 Bus Arriving in ~1 Min!',
            isAtStation 
                ? `Route ${this.tripData?.route_short_name || '378'} is at ${waitlistStopName}. Please board now!`
                : `Bus is at ${currentStopName}, next stop is ${waitlistStopName} — prepare to board!`,
            'bus_approaching',
            10000
        );

        // 5. Present Boarding Attention Modal
        window.app.showModal(`
            <div class="glass-panel rounded-3xl p-6 text-center space-y-4 border-2 border-primary shadow-[0_0_50px_rgba(77,142,255,0.45)] max-w-sm mx-auto animate-in">
                <div class="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto text-primary shadow-lg animate-bounce">
                    <span class="material-symbols-outlined text-4xl" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                </div>
                <div>
                    <span class="bg-primary/20 text-primary border border-primary/30 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                        ${isAtStation ? 'Bus At Station • Board Now' : 'Boarding Alert • ~1 Min Away'}
                    </span>
                    <h3 class="text-xl font-bold text-white mt-2">
                        ${isAtStation ? `Bus Arrived at ${waitlistStopName}` : `Next Stop: ${waitlistStopName}`}
                    </h3>
                    <p class="text-xs text-gray-300 mt-1 leading-relaxed">
                        ${isAtStation 
                            ? `Route <strong class="text-white">${this.tripData?.route_short_name || '378'}</strong> is at <strong class="text-white">${waitlistStopName}</strong>. Tap below to confirm boarding and update crowd intelligence.`
                            : `Route <strong class="text-white">${this.tripData?.route_short_name || '378'}</strong> is leaving <strong class="text-white">${currentStopName}</strong> and will reach <strong class="text-white">${waitlistStopName}</strong> in about 1 minute!`
                        }
                    </p>
                </div>
                <div class="flex gap-2 pt-2">
                    <button class="py-3 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all cursor-pointer active:scale-95" onclick="window.app.closeModal()">
                        Remind on Arrival
                    </button>
                    <button class="flex-1 py-3 rounded-xl bg-primary text-[#002e6a] font-extrabold text-xs hover:bg-primary-fixed transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-1.5" onclick="TripsView.handleBoarding(); window.app.closeModal();">
                        <span class="material-symbols-outlined text-sm font-bold">directions_bus</span>
                        <span>I'm Boarding (+10 Pts)</span>
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

        // 5. Present Attention Modal
        window.app.showModal(`
            <div class="glass-panel rounded-3xl p-6 text-center space-y-4 border-2 border-secondary shadow-[0_0_50px_rgba(78,222,163,0.35)] max-w-sm mx-auto animate-in">
                <div class="w-16 h-16 rounded-full bg-secondary/20 border border-secondary/40 flex items-center justify-center mx-auto text-secondary shadow-lg">
                    <span class="material-symbols-outlined text-4xl" style="font-variation-settings: 'FILL' 1;">notifications_active</span>
                </div>
                <div>
                    <span class="bg-secondary/20 text-secondary border border-secondary/30 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                        Deboarding Alert
                    </span>
                    <h3 class="text-xl font-bold text-white mt-2">Next Stop: ${destStopName}</h3>
                    <p class="text-xs text-gray-300 mt-1 leading-relaxed">
                        The bus is currently at <strong class="text-white">${currentStopName}</strong>. Your destination is the very next stop! Please prepare to deboard.
                    </p>
                </div>
                <div class="flex gap-2 pt-2">
                    <button class="flex-1 py-3 rounded-xl bg-secondary text-[#003824] font-bold text-xs hover:bg-secondary-container transition-all cursor-pointer shadow-lg active:scale-95" onclick="window.app.closeModal()">
                        I'm Ready
                    </button>
                    <button class="py-3 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all cursor-pointer active:scale-95" onclick="TripsView.handleDeboarding(); window.app.closeModal();">
                        Deboard Now
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

        // Instantly increment on-board passenger count locally for responsive UX
        if (this.tripData) {
            this.tripData.current_passenger_count = (this.tripData.current_passenger_count || 35) + 1;
        }
        this.isOnBoard = true;
        this.userWaitlist = null;
        this.renderDrawerUI();
        this.updateLiveTelemetryInPlace();

        NotificationUtils.showToast('Boarding Verified! 🚌', 'Checked in on-board. Passenger count updated (+10 Pts)', 'success', 3500);

        try {
            const loc = await GPSUtils.getCurrentPosition();
            const res = await API.reportBoarding(
                this.tripId,
                stopId,
                loc.latitude,
                loc.longitude,
                loc.isDemo
            );

            if (res && res.passengerCount != null && this.tripData) {
                this.tripData.current_passenger_count = res.passengerCount;
            }

            GPSUtils.showVerificationResultModal(res, 'Boarding Check-in');
            this.renderDrawerUI();
            this.updateLiveTelemetryInPlace();
            if (window.app && typeof window.app.updateSidebarUser === 'function') {
                window.app.updateSidebarUser();
            }
        } catch (e) {
            this.renderDrawerUI();
            this.updateLiveTelemetryInPlace();
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

            this.isOnBoard = false;
            GPSUtils.showVerificationResultModal(res, 'Deboarding Confirmation');
            NotificationUtils.showToast('Deboarded Successfully! 👋', 'You have deboarded from this bus.', 'success', 3000);
            this.renderDrawerUI();
            if (window.app && typeof window.app.updateSidebarUser === 'function') {
                window.app.updateSidebarUser();
            }
        } catch (e) {
            this.isOnBoard = false;
            NotificationUtils.showToast('Deboarded 👋', 'You have deboarded from this bus.', 'info', 3000);
            this.renderDrawerUI();
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
