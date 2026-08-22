/**
 * Lumina Transit - Live Trip Tracking & Drawer View
 * Pixel-matched with Stitch live_trip_tracking export
 */
const TripsView = {
    tripId: null,
    tripData: null,
    isOnBoard: false,
    selectedDestinationStopId: null,
    trackInterval: null,
    alertedNear: false,

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
                            Tracking Route ${this.tripData ? this.tripData.route_number : '...'}
                        </h1>
                        <p class="font-label-sm text-label-sm text-on-surface-variant" id="live-header-subtitle">
                            ${this.tripData ? (this.tripData.direction === 'outbound' ? 'Outbound Route' : 'Inbound Route') : 'Connecting live telemetry...'}
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

                <!-- Main Map Area (Top 45-50% vh) -->
                <div class="fixed top-0 w-full h-[45vh] min-h-[260px] max-h-[440px] z-0 pt-16">
                    <div id="live-trip-map" class="w-full h-full"></div>
                    <!-- Gradient Overlay to blend with bottom sheet -->
                    <div class="absolute bottom-0 w-full h-24 bg-gradient-to-t from-surface via-surface/60 to-transparent pointer-events-none z-[400]"></div>
                </div>

                <!-- Bottom Sheet / Drawer (Bottom 55% vh) -->
                <main class="fixed bottom-0 w-full h-[58vh] max-h-[580px] z-20 bg-surface rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.7)] border-t border-white/10 flex flex-col pt-3 pb-[80px] transition-transform duration-300">
                    <!-- Drag Handle -->
                    <div class="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto mb-3"></div>

                    <div class="flex-1 overflow-y-auto px-container-margin flex flex-col gap-4" id="trip-live-drawer-content">
                        <div class="text-center py-8 text-on-surface-variant">
                            <span class="material-symbols-outlined animate-spin text-3xl text-primary mb-2">sync</span>
                            <p class="text-sm">Retrieving real-time bus telemetry...</p>
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
                            <h2 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">Select Active Bus</h2>
                            <p class="text-xs text-on-surface-variant">Live GPS tracking & crowd occupancy</p>
                        </div>
                        <button class="font-label-bold text-xs text-primary bg-primary-container/20 px-3 py-1 rounded-full hover:bg-primary-container/30 transition-all flex items-center gap-1" onclick="TripsView.renderTripSelector()">
                            <span class="material-symbols-outlined text-xs">sync</span> Refresh
                        </button>
                    </div>

                    <div class="flex flex-col gap-3">
                        ${trips.map(trip => {
                            const crowdLevel = trip.crowd_level || 'low';
                            let crowdPillHtml = '';
                            if (crowdLevel === 'low') {
                                crowdPillHtml = `<span class="bg-secondary/20 border border-secondary/30 text-secondary text-xs px-2.5 py-0.5 rounded-full font-semibold">Low Crowd</span>`;
                            } else if (crowdLevel === 'medium') {
                                crowdPillHtml = `<span class="bg-tertiary/20 border border-tertiary/30 text-tertiary text-xs px-2.5 py-0.5 rounded-full font-semibold">Med Crowd</span>`;
                            } else {
                                crowdPillHtml = `<span class="bg-error/20 border border-error/30 text-error text-xs px-2.5 py-0.5 rounded-full font-semibold">High Crowd</span>`;
                            }

                            return `
                                <div 
                                    class="glass-panel rounded-transit p-4 flex items-center justify-between hover:bg-surface-container-high active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                                    onclick="window.app.navigate('trips', { tripId: '${trip.id}' })"
                                >
                                    <div class="flex items-center gap-3.5">
                                        <div class="w-12 h-12 rounded-2xl bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary font-bold font-status-number text-lg">
                                            ${trip.route_number || '138'}
                                        </div>
                                        <div>
                                            <h3 class="font-headline-md text-sm font-semibold text-on-surface">${trip.route_name}</h3>
                                            <div class="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                                                <span>${trip.bus_number}</span>
                                                <span>•</span>
                                                <span class="text-primary font-medium">${trip.delay_minutes > 0 ? `+${trip.delay_minutes}m delay` : 'On Schedule'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex flex-col items-end gap-1.5">
                                        ${crowdPillHtml}
                                        <span class="text-[11px] text-on-surface-variant">Tap to Track</span>
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
                        <h3 class="font-headline-md text-on-surface">Unable to load active trips</h3>
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

            // Polling tracking updates
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

            // Update Map Marker
            MapUtils.renderBusMarker(this.tripData);

            // Update DOM counters smoothly
            const etaValEl = document.getElementById('drawer-eta-value');
            if (etaValEl) {
                const nextEtaMins = Math.max(1, (this.tripData.delay_minutes || 0) + 4);
                etaValEl.textContent = nextEtaMins;
            }

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
                <div class="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5 border-secondary/30">
                    <div class="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.8)]"></div>
                    <span class="font-label-sm text-xs text-secondary uppercase tracking-wider font-semibold">Low Crowd</span>
                </div>
            `;
        } else if (crowdLevel === 'medium') {
            crowdChip = `
                <div class="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5 border-tertiary/30">
                    <div class="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(255,185,95,0.8)]"></div>
                    <span class="font-label-sm text-xs text-tertiary uppercase tracking-wider font-semibold">Medium Crowd</span>
                </div>
            `;
        } else {
            crowdChip = `
                <div class="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5 border-error/30">
                    <div class="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(255,180,171,0.8)]"></div>
                    <span class="font-label-sm text-xs text-error uppercase tracking-wider font-semibold">High Crowd</span>
                </div>
            `;
        }

        // Stops Timeline computation
        const currentIdx = trip.current_stop_index || 0;
        const stops = trip.stops || [];
        const prevStop = currentIdx > 0 ? stops[currentIdx - 1] : null;
        const currentStop = stops[currentIdx] || { stop_name: 'In Transit' };
        const nextStop = currentIdx + 1 < stops.length ? stops[currentIdx + 1] : null;

        container.innerHTML = `
            <!-- Hero Stats Row (Exact Match with Stitch live_trip_tracking) -->
            <div class="flex justify-between items-end pt-1">
                <div>
                    <p class="font-label-sm text-label-sm text-on-surface-variant mb-1">Arriving in</p>
                    <div class="flex items-baseline gap-2 text-primary">
                        <span class="font-status-number text-status-number text-[44px] leading-none tracking-tighter font-bold" id="drawer-eta-value">${arrivingMins}</span>
                        <span class="font-headline-md text-headline-md-mobile text-primary-fixed-dim font-medium">mins</span>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-1.5">
                    ${crowdChip}
                    <p class="font-label-sm text-xs text-on-surface-variant">Bus #${trip.bus_number}</p>
                </div>
            </div>

            <!-- Route Timeline Card (Exact Match with Stitch live_trip_tracking) -->
            <div class="glass-panel rounded-2xl p-4 flex flex-col relative shadow-lg">
                <!-- Timeline Vertical Line -->
                <div class="absolute left-[31px] top-8 bottom-8 w-0.5 bg-outline-variant/60 rounded-full"></div>
                <!-- Active portion of timeline -->
                <div class="absolute left-[31px] top-8 h-12 w-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(173,198,255,0.7)]"></div>

                <!-- Previous Stop (if any) -->
                ${prevStop ? `
                    <div class="flex items-start gap-stack-md mb-4 relative opacity-50">
                        <div class="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant z-10 shrink-0">
                            <div class="w-1.5 h-1.5 rounded-full bg-outline-variant"></div>
                        </div>
                        <div class="flex-1 pb-1">
                            <p class="font-body-md text-sm text-on-surface-variant">${prevStop.stop_name}</p>
                            <p class="font-label-sm text-[11px] text-outline-variant">Departed 2 mins ago</p>
                        </div>
                    </div>
                ` : ''}

                <!-- Current Highlighted Stop -->
                <div class="flex items-start gap-stack-md mb-4 relative">
                    <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary z-10 shrink-0 shadow-[0_0_12px_rgba(173,198,255,0.4)]">
                        <div class="w-2 h-2 rounded-full bg-primary live-pulse"></div>
                    </div>
                    <div class="flex-1 bg-primary/10 rounded-xl p-3 border border-primary/30 -mt-1 shadow-inner">
                        <div class="flex justify-between items-center mb-0.5">
                            <h3 class="font-headline-md text-sm text-primary font-bold">${currentStop.stop_name}</h3>
                            <span class="font-label-bold text-xs text-primary font-semibold bg-primary/20 px-2 py-0.5 rounded-full">Now</span>
                        </div>
                        <p class="font-label-sm text-[11px] text-on-surface-variant">Continuous GPS Verified Position</p>
                    </div>
                </div>

                <!-- Next Stop -->
                ${nextStop ? `
                    <div class="flex items-start gap-stack-md relative">
                        <div class="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant z-10 shrink-0">
                            <div class="w-1.5 h-1.5 rounded-full bg-outline-variant"></div>
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-center">
                                <p class="font-body-md text-sm text-on-surface font-medium">${nextStop.stop_name}</p>
                                <span class="font-label-sm text-xs text-on-surface-variant">~${arrivingMins} mins</span>
                            </div>
                        </div>
                    </div>
                ` : ''}
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
            <div class="grid grid-cols-2 gap-stack-sm mt-auto pt-2">
                <button 
                    class="${!this.isOnBoard ? 'bg-primary text-on-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]' : 'bg-surface-container-high text-on-surface-variant'} font-label-bold text-xs py-3.5 px-3 rounded-xl flex justify-center items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md font-semibold"
                    onclick="TripsView.handleBoarding()"
                >
                    <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">directions_bus</span>
                    ${this.isOnBoard ? 'Boarded ✓' : "I'm Boarding"}
                </button>

                <button 
                    class="${this.isOnBoard ? 'bg-error text-on-error' : 'glass-panel text-on-surface'} font-label-bold text-xs py-3.5 px-3 rounded-xl flex justify-center items-center gap-2 hover:bg-white/5 active:scale-95 transition-all shadow-md font-semibold"
                    onclick="TripsView.handleDeboarding()"
                >
                    <span class="material-symbols-outlined text-lg">exit_to_app</span>
                    I'm Deboarding
                </button>

                <button 
                    class="col-span-2 glass-panel text-tertiary font-label-bold text-xs py-3.5 px-4 rounded-xl flex justify-center items-center gap-2 border-tertiary/30 hover:bg-tertiary/10 active:scale-95 transition-all font-semibold shadow-md"
                    onclick="TripsView.openCrowdModal()"
                >
                    <span class="material-symbols-outlined text-lg">group</span>
                    Report Crowd Level (+10 Pts)
                </button>
            </div>
        `;
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

        const currentStop = this.tripData.stops[this.tripData.current_stop_index];
        const stopId = currentStop ? currentStop.stop_id : this.tripData.stops[0]?.stop_id;

        try {
            const res = await API.reportBoarding(
                this.tripId,
                stopId,
                this.tripData.current_latitude || 12.9778,
                this.tripData.current_longitude || 77.5726
            );

            this.isOnBoard = true;
            NotificationUtils.showToast(
                'Boarding Confirmed!',
                `Earned +${res.points} points. Telemetry continuous verification active!`,
                'points_earned'
            );

            this.renderDrawerUI();
            window.app.updateSidebarUser();
        } catch (e) {
            NotificationUtils.showToast('Boarding Error', e.message, 'error');
        }
    },

    async handleDeboarding() {
        if (!API.isAuthenticated()) {
            window.app.showAuthModal();
            return;
        }

        const currentStop = this.tripData.stops[this.tripData.current_stop_index];
        const stopId = currentStop ? currentStop.stop_id : null;

        try {
            const res = await API.reportDeboarding(
                this.tripId,
                stopId,
                this.tripData.current_latitude || 12.9778,
                this.tripData.current_longitude || 77.5726
            );

            this.isOnBoard = false;
            NotificationUtils.showToast(
                'Trip Completed!',
                `Earned +${res.points} points for verified deboarding.`,
                'points_earned'
            );

            this.renderDrawerUI();
            window.app.updateSidebarUser();
        } catch (e) {
            NotificationUtils.showToast('Deboarding Error', e.message, 'error');
        }
    },

    openCrowdModal() {
        if (!API.isAuthenticated()) {
            window.app.showAuthModal();
            return;
        }

        const currentStopName = this.tripData && this.tripData.stops ? (this.tripData.stops[this.tripData.current_stop_index]?.stop_name || 'Grand Central Station') : 'Grand Central Station';

        // Render exact Stitch crowd_update modal view
        window.app.showModal(`
            <div class="glass-panel rounded-2xl p-6 relative overflow-hidden max-w-md mx-auto shadow-2xl border border-white/15">
                <!-- Decorative Glow -->
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/15 blur-3xl rounded-full pointer-events-none"></div>

                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-headline-md text-headline-md-mobile text-on-surface font-bold">How crowded is this bus?</h3>
                    <button class="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-on-surface-variant" onclick="window.app.closeModal()">
                        <span class="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div class="flex flex-col gap-stack-sm mb-4" id="crowd-selection-group">
                    <!-- Low Card -->
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
                            <div class="font-headline-md text-sm font-bold text-secondary">Low</div>
                            <div class="font-body-md text-xs text-on-surface-variant">Plenty of seats</div>
                        </div>
                    </button>

                    <!-- Medium Card -->
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
                            <div class="font-headline-md text-sm font-bold text-tertiary">Medium</div>
                            <div class="font-body-md text-xs text-on-surface-variant">Standing room only</div>
                        </div>
                    </button>

                    <!-- High Card -->
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
                            <div class="font-headline-md text-sm font-bold text-error">High</div>
                            <div class="font-body-md text-xs text-on-surface-variant">Very crowded</div>
                        </div>
                    </button>
                </div>

                <!-- Submit Button -->
                <button 
                    id="crowd-submit-btn"
                    class="w-full py-3.5 rounded-xl bg-primary text-on-primary font-label-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-fixed transition-all active:scale-[0.98] shadow-lg shadow-primary/20 font-bold"
                    onclick="TripsView.submitSelectedCrowdReport()"
                >
                    <span>Submit & Earn 10 Pts</span>
                    <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">stars</span>
                </button>

                <!-- Secondary Section: Verify Stop (Stitch crowd_update) -->
                <div class="mt-4 p-3.5 rounded-xl border border-white/10 bg-surface-container-low/80 backdrop-blur-xl relative overflow-hidden">
                    <h4 class="font-headline-md text-xs font-bold text-on-surface mb-1">Verify Stop Location</h4>
                    <p class="font-body-md text-xs text-on-surface-variant mb-2.5">
                        Are you currently near <strong class="text-primary font-medium">${currentStopName}</strong>?
                    </p>
                    <div class="flex gap-2">
                        <button class="flex-1 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface font-label-bold text-xs hover:bg-surface-container-high transition-colors active:scale-95" onclick="NotificationUtils.showToast('Feedback Received', 'Thank you for verifying stop position', 'info'); window.app.closeModal();">
                            No
                        </button>
                        <button class="flex-1 py-2 rounded-lg border border-primary/30 bg-primary-container/20 text-primary font-label-bold text-xs hover:bg-primary-container/40 transition-colors active:scale-95" onclick="NotificationUtils.showToast('Verified!', '+5 Points awarded for stop confirmation', 'success'); window.app.closeModal();">
                            Yes
                        </button>
                    </div>
                </div>
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

        try {
            const res = await API.reportCrowd(
                this.tripId,
                stopId,
                level,
                this.tripData.current_latitude || 12.9778,
                this.tripData.current_longitude || 77.5726
            );

            NotificationUtils.showToast(
                'Crowd Report Submitted!',
                `Earned +${res.points} points. Telemetry verified!`,
                'points_earned'
            );

            this.loadTripDetails();
            window.app.updateSidebarUser();
        } catch (e) {
            NotificationUtils.showToast('Report Error', e.message, 'error');
        }
    }
};
