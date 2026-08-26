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
                                crowdPillHtml = `<span class="bg-secondary/20 text-secondary border border-secondary/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">${I18n.t('home.low_crowd')}</span>`;
                            } else if (trip.crowd_level === 'medium') {
                                crowdPillHtml = `<span class="bg-tertiary/20 text-tertiary border border-tertiary/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">${I18n.t('home.med_crowd')}</span>`;
                            } else {
                                crowdPillHtml = `<span class="bg-error/20 text-error border border-error/30 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">${I18n.t('home.high_crowd')}</span>`;
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
                                                <p class="text-xs text-on-surface-variant mt-0.5">${I18n.t('trips.driver_label')} <strong class="text-on-surface">${trip.driver_name || 'BMTC Pilot'}</strong></p>
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
            await this.loadTripDetails();

            // Polling tracking updates every 2.5s
            if (this.trackInterval) clearInterval(this.trackInterval);
            this.trackInterval = setInterval(() => {
                if (window.app && window.app.currentView === 'trips' && this.tripId) {
                    this.pollLiveTracking();
                }
            }, 2500);
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
            const res = await API.getTrip(this.tripId);
            if (!res || !res.trip) return;

            // Update full live trip model (stops, current_stop_index, GPS, passenger count, forecast)
            this.tripData = res.trip;

            // Update Map Marker live position
            MapUtils.renderBusMarker(this.tripData);

            // Re-render the drawer UI components to match exact current stop
            this.renderDrawerUI();

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

    renderDrawerUI() {
        const container = document.getElementById('trip-live-drawer-content');
        if (!container || !this.tripData) return;

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
        if (nextForecast) {
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

        const driverName = trip.driver_name || 'Manjunath Gowda';

        // Upcoming stops for Card 2 (Show next 3 upcoming stops along the route)
        let upcomingStops = stops.slice(currentIdx + 1, currentIdx + 4);
        if (upcomingStops.length === 0 && stops.length > 0) {
            upcomingStops = stops.slice(0, Math.min(3, stops.length));
        }

        const nextStopWaitLevel = (nextForecast && nextForecast.waiting_passengers_count > 10) ? 'HIGH' : ((nextForecast && nextForecast.waiting_passengers_count > 5) ? 'MID' : 'LOW');

        container.innerHTML = `
            <!-- Next Stop Arrival & Bus Crowd / Passengers Bar -->
            <div class="flex justify-between items-end pt-1 pb-2 border-b border-white/10">
                <div>
                    <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Next Stop Arrival</p>
                    <div class="flex items-baseline gap-1.5">
                        <span class="text-3xl font-extrabold text-white tracking-tight" id="drawer-eta-value">
                            ${etaDisplayText.toLowerCase().includes('min') ? etaDisplayText : `${etaValue} mins`}
                        </span>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <div class="flex items-center gap-1.5 text-xs font-bold ${crowdTextColor}">
                        <span class="w-2.5 h-2.5 rounded-full ${crowdDotColor}"></span>
                        <span>BUS CROWD: ${crowdLabel}</span>
                    </div>
                    <p class="text-[11px] text-gray-300 font-medium flex items-center gap-1">
                        <span>🚌</span>
                        <span>Bus Passengers: ${passengers}/${capacity} (${loadPercentage}% load)</span>
                    </p>
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
                            <div class="text-[10px] text-gray-300">Registered for this bus at Stop</div>
                        </div>
                    </div>
                    <button 
                        class="px-2.5 py-1 rounded-lg bg-secondary/20 hover:bg-secondary/30 text-secondary text-[11px] font-bold border border-secondary/30 transition-all cursor-pointer"
                        onclick="TripsView.handleLeaveWaitlist('${this.userWaitlist.stop_id}')"
                    >
                        Leave Queue
                    </button>
                </div>
            ` : ''}

            <!-- 🌟 LIVE CROWD INTELLIGENCE BREAKDOWN HEADER ROW 🌟 -->
            <div class="flex items-center justify-between pt-0.5">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-base" style="font-variation-settings: 'FILL' 1;">groups</span>
                    <h3 class="text-xs font-bold text-white uppercase tracking-wider">
                        LIVE CROWD INTELLIGENCE BREAKDOWN
                    </h3>
                </div>
                ${!this.userWaitlist ? `
                <button 
                    class="text-xs text-white font-semibold flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full border border-white/20 transition-all cursor-pointer active:scale-95"
                    onclick="TripsView.openJoinWaitlistModal()"
                >
                    <span class="material-symbols-outlined text-xs">add</span> Join Stop Queue
                </button>
                ` : ''}
            </div>

            <!-- 🌟 2-CARDS GRID (Card 1: People in Bus, Card 2: People Waiting at Stop) 🌟 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- Card 1: 1. People In The Bus -->
                <div class="bg-[#10141d]/90 border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-bold text-white flex items-center gap-1.5">
                                <span>🚌</span>
                                <span>1. People In The Bus</span>
                            </span>
                        </div>
                        <span class="border border-white/20 bg-white/5 px-2.5 py-0.5 rounded-full text-xs text-white font-semibold">
                            ${passengers} On-Board
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
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Bus Driver:</span>
                            <span class="font-bold text-white">${driverName}</span>
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
                                <span>2. People Waiting At Stop</span>
                            </span>
                        </div>
                        <span class="border border-secondary/30 bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 1;">flag</span>
                            <span>${nextStopWaitLevel} at Next Stop</span>
                        </span>
                    </div>

                    <div class="space-y-2 text-xs">
                        ${upcomingStops.map(s => {
                            const waitCount = s.waiting_passengers || (s.eta?.is_approaching ? 2 : 1);
                            let stopCrowdText = 'LOW';
                            let stopDotColor = 'bg-secondary';
                            let stopTextColor = 'text-secondary';
                            if (waitCount > 10) {
                                stopCrowdText = 'HIGH';
                                stopDotColor = 'bg-error';
                                stopTextColor = 'text-error';
                            } else if (waitCount > 5) {
                                stopCrowdText = 'MID';
                                stopDotColor = 'bg-tertiary';
                                stopTextColor = 'text-tertiary';
                            }

                            return `
                                <div class="flex justify-between items-center py-0.5">
                                    <span class="text-gray-200 truncate max-w-[180px] font-medium">${s.stop_name || s.name}</span>
                                    <span class="flex items-center gap-1.5 font-bold ${stopTextColor} text-[11px]">
                                        <span class="w-2 h-2 rounded-full ${stopDotColor}"></span>
                                        <span>${stopCrowdText}</span>
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

            <!-- Destination Notification Picker -->
            <div class="bg-[#10141d]/70 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="material-symbols-outlined text-secondary text-lg" style="font-variation-settings: 'FILL' 1;">notifications_active</span>
                    <span class="text-xs text-gray-300 font-medium truncate">Deboard Alarm</span>
                </div>
                <select 
                    class="bg-surface-container-high text-white text-xs rounded-lg px-2 py-1 border border-white/10 focus:outline-none focus:ring-1 focus:ring-primary max-w-[180px]"
                    onchange="TripsView.setDestination(this.value)"
                >
                    <option value="">-- Choose Stop --</option>
                    ${stops.filter((s, idx) => idx > currentIdx).map(s => `
                        <option value="${s.stop_id}" ${this.selectedDestinationStopId === s.stop_id ? 'selected' : ''}>
                            ${s.stop_name}
                        </option>
                    `).join('')}
                </select>
            </div>

            <!-- Action Grid (Boarding & Crowd Feedback) -->
            <div class="grid grid-cols-2 gap-2 mt-auto pt-1">
                <button 
                    class="${!this.isOnBoard ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'} font-label-bold text-xs py-3 px-3 rounded-xl flex justify-center items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md font-semibold cursor-pointer"
                    onclick="TripsView.handleBoarding()"
                >
                    <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                    ${this.isOnBoard ? 'Boarded ✓' : "I'm Boarding"}
                </button>

                <button 
                    class="${this.isOnBoard ? 'bg-error text-on-error' : 'bg-white/5 border border-white/10 text-white'} font-label-bold text-xs py-3 px-3 rounded-xl flex justify-center items-center gap-2 hover:bg-white/10 active:scale-95 transition-all shadow-md font-semibold cursor-pointer"
                    onclick="TripsView.handleDeboarding()"
                >
                    <span class="material-symbols-outlined text-lg">exit_to_app</span>
                    I'm Deboarding
                </button>

                <button 
                    class="col-span-2 bg-white/5 border border-tertiary/30 text-tertiary font-label-bold text-xs py-2.5 px-4 rounded-xl flex justify-center items-center gap-2 hover:bg-tertiary/10 active:scale-95 transition-all font-semibold shadow-md cursor-pointer"
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
