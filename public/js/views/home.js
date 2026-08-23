/**
 * Lumina Transit - Home View (Bengaluru BMTC Transit Network)
 * Google Maps Style Flow:
 * 1. Clean map showing Bengaluru current location
 * 2. User searches/taps destination
 * 3. Shows available BMTC buses with arrival ETAs, fares & crowd levels
 */
const HomeView = {
    routes: [],
    activeTrips: [],
    stops: [],
    userLocation: { lat: 12.9778, lng: 77.5726, name: 'Kempegowda Station (Majestic)' },
    destination: null,
    matchedTransitOptions: [],

    popularDestinations: [
        { name: 'Silk Institute', query: 'Silk Institute', routeNum: '215C', stopName: 'Silk Institute (Kanakapura Rd)' },
        { name: 'Kengeri TTMC', query: 'Kengeri', routeNum: '226N', stopName: 'Kengeri TTMC / Bus Terminal' },
        { name: 'Yeshwanthpur TTMC', query: 'Yeshwanthpur', routeNum: '252', stopName: 'Yeshwanthpur TTMC' },
        { name: 'Jayanagar 4th Block', query: 'Jayanagar', routeNum: '215C', stopName: 'Jayanagar 4th Block TTMC' },
        { name: 'Banashankari TTMC', query: 'Banashankari', routeNum: '215C', stopName: 'Banashankari TTMC' },
        { name: 'Electronic City', query: 'Electronic City', routeNum: '356CW', stopName: 'Electronic City Toll Gate' }
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
                                    ${this.userLocation.name}
                                </span>
                                <button onclick="HomeView.detectGPSLocation()" class="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5">
                                    GPS
                                </button>
                            </div>
                            <!-- Destination Input -->
                            <div class="relative">
                                <input 
                                    id="destination-input"
                                    class="w-full px-3.5 py-2.5 bg-surface-container-high rounded-xl text-xs text-on-surface placeholder:text-outline border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                                    placeholder="Enter Bengaluru destination (e.g. Silk Institute, Kengeri, Yeshwanthpur)..."
                                    type="text"
                                    value="${this.destination ? this.destination.name : ''}"
                                    onkeydown="if(event.key==='Enter') HomeView.handleSearchSubmit(this.value)"
                                    oninput="HomeView.handleSearchInput(this.value)"
                                >
                                ${this.destination ? `
                                    <button onclick="HomeView.clearDestination()" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1">
                                        <span class="material-symbols-outlined text-sm">close</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Clean Location Map -->
                <section class="relative">
                    <div class="relative w-full h-[230px] rounded-transit overflow-hidden border border-white/10 shadow-2xl bg-surface-container-low">
                        <div id="home-map" class="w-full h-full"></div>
                        
                        <!-- HUD Status Badge -->
                        <div class="absolute bottom-3 left-3 glass-panel px-3 py-1 rounded-full flex items-center gap-2 shadow-lg pointer-events-none z-[400]">
                            <div class="w-2 h-2 rounded-full ${this.destination ? 'bg-primary' : 'bg-secondary'} live-pulse"></div>
                            <span class="font-label-sm text-[11px] text-on-surface font-medium" id="map-status-label">
                                ${this.destination ? 'Route Calculated' : 'Bengaluru Location'}
                            </span>
                        </div>

                        <!-- Recenter GPS Button -->
                        <button 
                            onclick="HomeView.detectGPSLocation()"
                            class="absolute bottom-3 right-3 bg-primary text-on-primary p-2 rounded-full shadow-[0_0_15px_rgba(173,198,255,0.5)] hover:bg-primary-fixed active:scale-90 transition-all z-[400] flex items-center justify-center"
                            title="Recenter"
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

    renderDestinationOrSuggestions() {
        if (!this.destination) {
            // Initial State: Show Quick BMTC Destinations
            return `
                <div class="pt-1">
                    <h3 class="font-headline-md text-xs font-bold text-on-surface mb-2.5 px-1 flex items-center justify-between">
                        <span>Popular BMTC Destinations</span>
                        <span class="text-[11px] text-on-surface-variant font-normal">Tap to find buses</span>
                    </h3>
                    <div class="grid grid-cols-2 gap-2">
                        ${this.popularDestinations.map(p => `
                            <button 
                                class="glass-panel rounded-2xl p-3 text-left hover:bg-surface-container-high active:scale-[0.98] transition-all flex items-center justify-between group shadow-md cursor-pointer"
                                onclick="HomeView.selectDestination('${p.name}', '${p.query}')"
                            >
                                <div class="min-w-0 pr-2">
                                    <div class="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate">${p.name}</div>
                                    <div class="text-[10px] text-on-surface-variant mt-0.5 font-medium">Route ${p.routeNum} Available</div>
                                </div>
                                <div class="w-7 h-7 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
                                    <span class="material-symbols-outlined text-sm">directions_bus</span>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Destination Selected State: Show Available Transit Buses (Google Maps style)
        if (this.matchedTransitOptions.length === 0) {
            return `
                <div class="glass-panel rounded-2xl p-6 text-center shadow-lg">
                    <span class="material-symbols-outlined text-3xl text-outline mb-1">directions_bus</span>
                    <h4 class="font-bold text-sm text-on-surface">No direct buses found</h4>
                    <p class="text-xs text-on-surface-variant mt-1">Try selecting a nearby Bengaluru stop.</p>
                    <button class="mt-3 px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold" onclick="HomeView.clearDestination()">Choose Other</button>
                </div>
            `;
        }

        return `
            <div class="space-y-2.5">
                <div class="flex items-center justify-between px-1">
                    <div>
                        <h3 class="font-headline-md text-sm font-bold text-on-surface">Available BMTC Buses to ${this.destination.name}</h3>
                        <p class="text-[11px] text-on-surface-variant">${this.matchedTransitOptions.length} routes found</p>
                    </div>
                    <button onclick="HomeView.clearDestination()" class="text-xs text-primary font-semibold hover:underline">
                        Change
                    </button>
                </div>

                <div class="space-y-2.5">
                    ${this.matchedTransitOptions.map((opt, idx) => {
                        const crowdLevel = opt.trip?.crowd_level || 'low';
                        let crowdBadge = '';
                        if (crowdLevel === 'low') {
                            crowdBadge = `<span class="bg-secondary/20 text-secondary border border-secondary/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-[0_0_8px_rgba(78,222,163,0.3)]">🟢 Plenty of Seats</span>`;
                        } else if (crowdLevel === 'medium') {
                            crowdBadge = `<span class="bg-tertiary/20 text-tertiary border border-tertiary/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-[0_0_8px_rgba(255,185,95,0.3)]">🟡 Standing Room</span>`;
                        } else {
                            crowdBadge = `<span class="bg-error/20 text-error border border-error/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-[0_0_8px_rgba(255,180,171,0.3)]">🔴 Very Crowded</span>`;
                        }

                        const arrivingMins = Math.max(2, (opt.trip?.delay_minutes || 0) + (idx === 0 ? 3 : (idx + 1) * 6));
                        const durationMins = opt.route?.avg_duration_minutes || 30;
                        const fare = opt.route?.fare_lkr || 25;

                        const nextStopForecast = opt.trip?.next_stop_forecast;
                        const nextNextForecast = opt.trip?.next_next_stop_forecast;

                        return `
                            <div class="glass-panel rounded-2xl p-4 shadow-xl border ${idx === 0 ? 'border-primary/40 glow-inner' : 'border-white/10'} hover:bg-surface-container-high transition-all">
                                <div class="flex items-start justify-between mb-2">
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 rounded-xl bg-primary text-on-primary font-bold font-status-number text-base flex items-center justify-center shadow-[0_0_12px_rgba(173,198,255,0.5)]">
                                            ${opt.route?.route_number || '252'}
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-sm text-on-surface">${opt.route?.name || 'BMTC Transit Route'}</h4>
                                            <div class="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1.5 font-medium">
                                                <span class="text-primary font-bold">Arriving in ${arrivingMins} mins</span>
                                                <span>•</span>
                                                <span>~${durationMins} min trip</span>
                                                <span>•</span>
                                                <span>₹${fare}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Downstream Stop Intelligence Strip -->
                                <div class="bg-surface-container/60 rounded-xl px-3 py-1.5 mb-2.5 flex items-center justify-between text-[10px] border border-white/5">
                                    <div class="flex items-center gap-1 text-on-surface-variant">
                                        <span class="material-symbols-outlined text-secondary text-xs">hail</span>
                                        <span>Next Stop Waitlist: <strong class="text-on-surface">${nextStopForecast ? nextStopForecast.waiting_passengers_count : 3} waiting</strong></span>
                                    </div>
                                    <div class="font-bold ${nextNextForecast && nextNextForecast.boarding_probability_percentage < 50 ? 'text-error' : 'text-secondary'}">
                                        Next+1: ${nextNextForecast ? nextNextForecast.boarding_probability_percentage : 85}% Seat Chance
                                    </div>
                                </div>

                                <div class="flex items-center justify-between pt-2 border-t border-white/10">
                                    ${crowdBadge}
                                    <button 
                                        class="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 hover:bg-primary-fixed active:scale-95 transition-all shadow-md"
                                        onclick="HomeView.startJourney('${opt.trip?.id || ''}')"
                                    >
                                        <span>Track & Join Queue</span>
                                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    async init() {
        await this.fetchInitialData();

        // Initialize Clean Map with Bengaluru User Location Pin
        MapUtils.initMap('home-map', [this.userLocation.lat, this.userLocation.lng], 13, { hideZoom: true });
        MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng);
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

            // Set user default location to Kempegowda Bus Station (Majestic)
            const majesticStop = this.stops.find(s => s.id === 'stop_blr_06' || s.name.includes('Majestic'));
            if (majesticStop) {
                this.userLocation = {
                    lat: majesticStop.latitude,
                    lng: majesticStop.longitude,
                    name: 'Kempegowda Bus Station (Majestic)'
                };
            }
        } catch (e) {
            console.error('Failed to load data', e);
        }
    },

    handleSearchInput(value) {
        const query = (value || '').trim().toLowerCase();
        if (!query) {
            this.clearDestination();
            return;
        }

        if (query.length >= 3) {
            const matchedStop = this.stops.find(s => s.name.toLowerCase().includes(query));
            const matchedRoute = this.routes.find(r => r.name.toLowerCase().includes(query) || r.route_number.toLowerCase() === query);
            
            if (matchedStop) {
                this.selectDestination(matchedStop.name, query);
            } else if (matchedRoute) {
                this.selectDestination(matchedRoute.name.split('-')[1]?.trim() || matchedRoute.name, query);
            }
        }
    },

    handleSearchSubmit(value) {
        const query = (value || '').trim();
        if (query) {
            this.selectDestination(query, query);
        }
    },

    async selectDestination(destName, query) {
        const destInput = document.getElementById('destination-input');
        if (destInput) destInput.value = destName;

        // Find destination coordinates in Bengaluru
        const foundStop = this.stops.find(s => s.name.toLowerCase().includes(destName.toLowerCase())) ||
                          this.stops.find(s => s.name.toLowerCase().includes(query.toLowerCase()));

        let destLat = 12.8465;
        let destLng = 77.5342;

        if (foundStop) {
            destLat = foundStop.latitude;
            destLng = foundStop.longitude;
        } else if (destName.toLowerCase().includes('silk')) {
            destLat = 12.8465; destLng = 77.5342;
        } else if (destName.toLowerCase().includes('kengeri')) {
            destLat = 12.9081; destLng = 77.4835;
        } else if (destName.toLowerCase().includes('yeshwanthpur')) {
            destLat = 13.0238; destLng = 77.5503;
        } else if (destName.toLowerCase().includes('jayanagar')) {
            destLat = 12.9299; destLng = 77.5824;
        } else if (destName.toLowerCase().includes('banashankari')) {
            destLat = 12.9177; destLng = 77.5739;
        } else if (destName.toLowerCase().includes('electronic')) {
            destLat = 12.8452; destLng = 77.6602;
        } else if (destName.toLowerCase().includes('whitefield')) {
            destLat = 12.9698; destLng = 77.7499;
        }

        this.destination = {
            name: destName,
            lat: destLat,
            lng: destLng
        };

        // Find matching BMTC routes
        let matchingRoutes = this.routes.filter(r => 
            (r.name && r.name.toLowerCase().includes(destName.toLowerCase())) ||
            (r.name && r.name.toLowerCase().includes(query.toLowerCase())) ||
            (r.route_number && r.route_number.toLowerCase() === query.toLowerCase())
        );

        if (matchingRoutes.length === 0) {
            matchingRoutes = this.routes.slice(0, 3);
        }

        this.matchedTransitOptions = matchingRoutes.map(r => {
            const activeTrip = this.activeTrips.find(t => t.route_id === r.id) || this.activeTrips[0];
            return {
                route: r,
                trip: activeTrip
            };
        });

        // Update Map: Draw Route Line and Destination Pin
        MapUtils.clearRoutesAndBuses();
        MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng);
        MapUtils.addDestinationMarker(this.destination.lat, this.destination.lng, destName);

        // Draw polyline connecting user to destination
        const midLat = (this.userLocation.lat + this.destination.lat) / 2 + 0.003;
        const midLng = (this.userLocation.lng + this.destination.lng) / 2 - 0.003;

        const routeStops = [
            { latitude: this.userLocation.lat, longitude: this.userLocation.lng },
            { latitude: midLat, longitude: midLng },
            { latitude: this.destination.lat, longitude: this.destination.lng }
        ];

        MapUtils.drawRoute('dest_route', routeStops, '#adc6ff');
        MapUtils.fitBounds([
            [this.userLocation.lat, this.userLocation.lng],
            [this.destination.lat, this.destination.lng]
        ]);

        // Re-render results container
        const resultsEl = document.getElementById('transit-results-section');
        if (resultsEl) {
            resultsEl.innerHTML = this.renderDestinationOrSuggestions();
        }

        const mapLabel = document.getElementById('map-status-label');
        if (mapLabel) mapLabel.textContent = `Route to ${destName}`;
    },

    clearDestination() {
        this.destination = null;
        this.matchedTransitOptions = [];

        const destInput = document.getElementById('destination-input');
        if (destInput) destInput.value = '';

        // Reset clean map
        MapUtils.clearRoutesAndBuses();
        MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng);

        const resultsEl = document.getElementById('transit-results-section');
        if (resultsEl) {
            resultsEl.innerHTML = this.renderDestinationOrSuggestions();
        }

        const mapLabel = document.getElementById('map-status-label');
        if (mapLabel) mapLabel.textContent = 'Bengaluru Location';
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
            NotificationUtils.showToast('GPS Status', 'Using default Majestic transit junction', 'info');
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
                if (label) label.innerHTML = `<span class="material-symbols-outlined text-secondary text-sm" style="font-variation-settings: 'FILL' 1;">my_location</span> My GPS Location`;
                NotificationUtils.showToast('GPS Active', 'Location updated', 'success');
                if (this.destination) {
                    this.selectDestination(this.destination.name, this.destination.name);
                }
            },
            () => {
                this.userLocation = {
                    lat: 12.9778,
                    lng: 77.5726,
                    name: 'Kempegowda Bus Station (Majestic)'
                };
                MapUtils.setUserLocation(this.userLocation.lat, this.userLocation.lng);
                NotificationUtils.showToast('Location Pin', 'Centered on Majestic Hub', 'info');
            }
        );
    }
};
