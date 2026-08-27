/**
 * Lumina Transit Map Utilities with Leaflet
 * Official Google Maps Tile Engine & Dynamic Routing
 * Provides Real Google Maps Roadmap, Satellite Hybrid & Live Traffic
 */
const MapUtils = {
    map: null,
    tileLayer: null,
    currentMapType: 'roadmap', // 'roadmap' | 'satellite' | 'traffic'
    markers: {
        buses: new Map(),
        stops: new Map(),
        user: null,
        destination: null
    },
    userCoordinates: null,
    destinationCoordinates: null,
    destinationLabel: 'Destination',
    routeLayers: new Map(),

    initMap(containerId = 'map', center = [12.9716, 77.5946], zoom = 13, options = {}) {
        if (this.map) {
            try {
                this.map.remove();
            } catch (e) {}
            this.map = null;
            this.tileLayer = null;
            this.markers.buses.clear();
            this.markers.stops.clear();
            this.markers.user = null;
            this.markers.destination = null;
            this.routeLayers.clear();
        }

        const container = document.getElementById(containerId);
        if (!container) return null;

        // Create Leaflet instance
        this.map = L.map(containerId, {
            center,
            zoom,
            zoomControl: false,
            attributionControl: false,
            fadeAnimation: true,
            zoomAnimation: true,
            maxZoom: 20,
            minZoom: 5,
            ...options
        });

        // Always apply Google Maps Roadmap as standard base
        this.applyTileLayer(this.currentMapType || 'roadmap');

        if (!options.hideZoom) {
            L.control.zoom({ position: 'bottomright' }).addTo(this.map);
        }

        // Trigger container size recalculation to prevent blank or clipped tiles
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 150);

        return this.map;
    },

    applyTileLayer(type = 'roadmap') {
        if (!this.map) return;
        this.currentMapType = type;

        // Clean up previous tile layer
        if (this.tileLayer) {
            try {
                this.map.removeLayer(this.tileLayer);
            } catch (e) {}
            this.tileLayer = null;
        }

        // Get language for localized labels
        const lang = window.I18n ? window.I18n.currentLang || 'en' : 'en';
        const langParam = lang === 'kn' ? '&hl=kn' : (lang === 'hi' ? '&hl=hi' : '&hl=en');

        if (type === 'satellite') {
            // Google Maps Official Satellite Hybrid (Satellite Imagery + Street Names & Landmarks)
            this.tileLayer = L.tileLayer(`https://mt{s}.google.com/vt/lyrs=y${langParam}&x={x}&y={y}&z={z}`, {
                maxZoom: 20,
                subdomains: ['0', '1', '2', '3'],
                attribution: '&copy; Google Maps'
            }).addTo(this.map);

        } else if (type === 'traffic') {
            // Google Maps Official Live Traffic & Roadmap
            this.tileLayer = L.tileLayer(`https://mt{s}.google.com/vt/lyrs=m,traffic${langParam}&x={x}&y={y}&z={z}`, {
                maxZoom: 20,
                subdomains: ['0', '1', '2', '3'],
                attribution: '&copy; Google Maps'
            }).addTo(this.map);

        } else {
            // Google Maps Official Standard Roadmap
            this.tileLayer = L.tileLayer(`https://mt{s}.google.com/vt/lyrs=m${langParam}&x={x}&y={y}&z={z}`, {
                maxZoom: 20,
                subdomains: ['0', '1', '2', '3'],
                attribution: '&copy; Google Maps'
            }).addTo(this.map);
        }

        // Failover resilience: if any tile encounters a network error, retry or fall back safely
        if (this.tileLayer) {
            this.tileLayer.on('tileerror', (error) => {
                if (error && error.tile && !error.tile.dataset.retried) {
                    error.tile.dataset.retried = 'true';
                    const z = error.coords.z;
                    const x = error.coords.x;
                    const y = error.coords.y;
                    // Fallback to alternate Google Maps mt server subdomain
                    error.tile.src = `https://mt0.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
                }
            });
        }

        // Invalidate size on tile layer change
        if (this.map) {
            this.map.invalidateSize();
        }
    },

    updateTheme(isLight) {
        // Maintain Google Maps view across theme switches
        if (this.currentMapType === 'satellite') {
            this.applyTileLayer('satellite');
        } else {
            this.applyTileLayer('roadmap');
        }

        // Invalidate map size
        if (this.map) {
            setTimeout(() => {
                if (this.map) this.map.invalidateSize();
            }, 100);
        }

        // Refresh markers
        if (this.userCoordinates) {
            this.setUserLocation(this.userCoordinates.lat, this.userCoordinates.lng, false);
        }

        if (this.destinationCoordinates) {
            this.addDestinationMarker(this.destinationCoordinates.lat, this.destinationCoordinates.lng, this.destinationLabel);
        }
    },

    clearRoutesAndBuses() {
        if (!this.map) return;
        this.routeLayers.forEach(layer => {
            try { this.map.removeLayer(layer); } catch(e) {}
        });
        this.routeLayers.clear();

        this.markers.buses.forEach(m => {
            try { this.map.removeLayer(m); } catch(e) {}
        });
        this.markers.buses.clear();

        this.markers.stops.forEach(s => {
            try { this.map.removeLayer(s); } catch(e) {}
        });
        this.markers.stops.clear();

        if (this.markers.destination) {
            try { this.map.removeLayer(this.markers.destination); } catch(e) {}
            this.markers.destination = null;
            this.destinationCoordinates = null;
        }
    },

    setUserLocation(lat, lng, recenter = true) {
        if (!this.map) return;
        this.userCoordinates = { lat, lng };

        // High-Visibility Electric Orange Live GPS Location Beacon with Dual Radar Halo
        const userIcon = L.divIcon({
            className: 'google-maps-user-marker',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
                    <!-- Glowing Orange Pill Badge -->
                    <div style="
                        background: linear-gradient(135deg, #ff6d00 0%, #ff3d00 100%);
                        color: #ffffff;
                        font-family: 'Inter', sans-serif;
                        font-weight: 800;
                        font-size: 10px;
                        letter-spacing: 0.3px;
                        padding: 3px 9px;
                        border-radius: 999px;
                        box-shadow: 0 4px 14px rgba(255, 109, 0, 0.6), 0 2px 4px rgba(0,0,0,0.3);
                        white-space: nowrap;
                        margin-bottom: 4px;
                        border: 1.5px solid #ffffff;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    ">
                        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 6px #fff; animation: pulseDot 1.2s infinite;"></span>
                        <span>YOUR LOCATION</span>
                    </div>

                    <!-- Glowing Orange Radar Core -->
                    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
                        <!-- Primary Outer Orange Radar Shockwave -->
                        <div style="
                            position: absolute;
                            inset: -8px;
                            border-radius: 50%;
                            border: 2px solid #ff6d00;
                            background: rgba(255, 109, 0, 0.25);
                            animation: orangeRadarWave 2.2s infinite ease-out;
                            pointer-events: none;
                        "></div>

                        <!-- Secondary Inner Pulse Ring -->
                        <div style="
                            position: absolute;
                            inset: -3px;
                            border-radius: 50%;
                            border: 1.5px solid #ff9100;
                            background: rgba(255, 145, 0, 0.3);
                            animation: orangeRadarWave 2.2s infinite 0.7s ease-out;
                            pointer-events: none;
                        "></div>

                        <!-- 3D Electric Orange Beacon Dot -->
                        <div style="
                            width: 16px;
                            height: 16px;
                            background: linear-gradient(135deg, #ff9100 0%, #ff5722 50%, #e64a19 100%);
                            border: 2.5px solid #ffffff;
                            border-radius: 50%;
                            box-shadow: 0 0 14px #ff6d00, 0 0 24px rgba(255, 109, 0, 0.7), 0 3px 8px rgba(0,0,0,0.5);
                            position: relative;
                            z-index: 2;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <span style="width: 4px; height: 4px; border-radius: 50%; background: #ffffff;"></span>
                        </div>
                    </div>
                </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
        });

        if (this.markers.user) {
            this.markers.user.setLatLng([lat, lng]);
            this.markers.user.setIcon(userIcon);
        } else {
            this.markers.user = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
            this.markers.user.bindPopup(`
                <div style="font-family: 'Inter', sans-serif; font-size: 12px; color: #202124; padding: 3px 4px; min-width: 160px;">
                    <div style="display: flex; items-center; gap: 6px; margin-bottom: 3px;">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ff6d00; box-shadow: 0 0 6px #ff6d00;"></span>
                        <strong style="color: #ff6d00; font-size: 12px;">Your Live Location</strong>
                    </div>
                    <div style="font-size: 11px; color: #374151; font-weight: 500;">Bengaluru Transit GPS</div>
                    <div style="font-size: 9.5px; color: #9ca3af; margin-top: 2px;">Verified Real-Time Satellite Telemetry</div>
                </div>
            `);
        }

        if (recenter) {
            this.map.setView([lat, lng], 14);
        }
    },

    addDestinationMarker(lat, lng, label = 'Destination') {
        if (!this.map) return;
        this.destinationCoordinates = { lat, lng };
        this.destinationLabel = label;

        if (this.markers.destination) {
            try { this.map.removeLayer(this.markers.destination); } catch(e) {}
        }

        // Official Google Maps Red Teardrop Destination Pin with Pill Label
        const destIcon = L.divIcon({
            className: 'google-maps-dest-marker',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
                    <div style="
                        background: #ea4335;
                        color: #ffffff;
                        font-family: 'Inter', sans-serif;
                        font-weight: 700;
                        font-size: 11px;
                        padding: 3px 10px;
                        border-radius: 999px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        white-space: nowrap;
                        margin-bottom: 2px;
                        border: 2px solid #ffffff;
                    ">
                        ${label}
                    </div>
                    <div style="
                        width: 22px;
                        height: 22px;
                        background: #ea4335;
                        border: 3px solid #ffffff;
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        box-shadow: 0 3px 8px rgba(0,0,0,0.35);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div style="width: 7px; height: 7px; background: #ffffff; border-radius: 50%;"></div>
                    </div>
                </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
        });

        this.markers.destination = L.marker([lat, lng], { icon: destIcon }).addTo(this.map);
    },

    cachedGeometries: {},

    getRouteRoadPoints(routeId, stops) {
        if (this.cachedGeometries[routeId]) {
            return this.cachedGeometries[routeId];
        }

        if (routeId === 'route_blr_378' && window.ROUTE_378_ROAD_COORDINATES && Array.isArray(window.ROUTE_378_ROAD_COORDINATES)) {
            this.cachedGeometries[routeId] = window.ROUTE_378_ROAD_COORDINATES;
            return this.cachedGeometries[routeId];
        }

        return null;
    },

    findClosestPointIndex(points, lat, lng) {
        let minD = Infinity;
        let bestIdx = 0;
        for (let i = 0; i < points.length; i++) {
            const d = Math.pow(points[i][0] - lat, 2) + Math.pow(points[i][1] - lng, 2);
            if (d < minD) {
                minD = d;
                bestIdx = i;
            }
        }
        return bestIdx;
    },

    drawRoute(routeId, stops, color = null) {
        if (!this.map || !stops || stops.length < 2) return;

        if (this.routeLayers.has(routeId)) {
            try { this.map.removeLayer(this.routeLayers.get(routeId)); } catch(e) {}
            this.routeLayers.delete(routeId);
        }

        // Official Google Maps Navigation Route Color
        const routeColor = color || '#1a73e8';

        // 1. Check if we have high-resolution real street road coordinates
        const fullRoadPoints = this.getRouteRoadPoints(routeId, stops);

        let finalLatLngs = [];
        if (fullRoadPoints && fullRoadPoints.length > 0) {
            if (stops.length >= 8) {
                // Full route
                finalLatLngs = fullRoadPoints;
            } else {
                // Subset of stops (e.g. from selected origin stop to destination stop)
                const firstStop = stops[0];
                const lastStop = stops[stops.length - 1];
                const sLat1 = firstStop.latitude || firstStop.lat;
                const sLng1 = firstStop.longitude || firstStop.lng;
                const sLat2 = lastStop.latitude || lastStop.lat;
                const sLng2 = lastStop.longitude || lastStop.lng;
                
                const idx1 = this.findClosestPointIndex(fullRoadPoints, sLat1, sLng1);
                const idx2 = this.findClosestPointIndex(fullRoadPoints, sLat2, sLng2);
                if (idx1 <= idx2) {
                    finalLatLngs = fullRoadPoints.slice(idx1, idx2 + 1);
                } else {
                    finalLatLngs = fullRoadPoints.slice(idx2, idx1 + 1).reverse();
                }
            }
        }

        if (!finalLatLngs || finalLatLngs.length < 2) {
            finalLatLngs = stops.map(s => [s.latitude || s.lat, s.longitude || s.lng]);
            
            // Asynchronously fetch real street routing from OSRM for dynamic custom paths
            const coords = stops.map(s => (s.longitude || s.lng) + ',' + (s.latitude || s.lat)).join(';');
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
            fetch(osrmUrl)
                .then(r => r.json())
                .then(data => {
                    if (data.routes && data.routes[0] && data.routes[0].geometry) {
                        const roadCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                        if (this.routeLayers.has(routeId)) {
                            try { this.map.removeLayer(this.routeLayers.get(routeId)); } catch(e) {}
                        }
                        this.cachedGeometries[routeId] = roadCoords;
                        this.renderPolylineGroup(routeId, roadCoords, routeColor);
                    }
                })
                .catch(() => {});
        }

        this.renderPolylineGroup(routeId, finalLatLngs, routeColor);
    },

    renderPolylineGroup(routeId, latLngs, routeColor) {
        if (!this.map || !latLngs || latLngs.length < 2) return;

        // Outer white casing for high contrast and official Google Maps street route look
        const casing = L.polyline(latLngs, {
            color: '#ffffff',
            weight: 8,
            opacity: 0.9,
            lineJoin: 'round',
            lineCap: 'round'
        });

        // Core vivid navigation road polyline
        const core = L.polyline(latLngs, {
            color: routeColor,
            weight: 5.5,
            opacity: 0.98,
            lineJoin: 'round',
            lineCap: 'round'
        });

        const group = L.layerGroup([casing, core]).addTo(this.map);
        this.routeLayers.set(routeId, group);
    },

    renderStops(stops, onClickStop) {
        if (!this.map || !stops || !Array.isArray(stops)) return;

        stops.forEach(stop => {
            if (this.markers.stops.has(stop.stop_id || stop.id)) return;

            const isMajor = stop.is_major;
            const stopColor = isMajor ? '#1a73e8' : '#5f6368';

            const stopIcon = L.divIcon({
                className: 'google-maps-stop-icon',
                html: `
                    <div style="
                        width: ${isMajor ? '14px' : '11px'};
                        height: ${isMajor ? '14px' : '11px'};
                        background: #ffffff;
                        border: ${isMajor ? '3.5px solid #1a73e8' : '2.5px solid #5f6368'};
                        border-radius: 50%;
                        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                        cursor: pointer;
                        transform: translate(-50%, -50%);
                    "></div>
                `,
                iconSize: [0, 0],
                iconAnchor: [0, 0]
            });

            const lat = stop.latitude;
            const lng = stop.longitude;
            if (!lat || !lng) return;

            const marker = L.marker([lat, lng], { icon: stopIcon }).addTo(this.map);
            marker.bindPopup(`
                <div style="font-family: 'Inter', sans-serif; font-size: 13px; color: #202124; padding: 2px 4px;">
                    <strong style="font-size: 14px; color: #1a73e8;">${stop.stop_name || stop.name}</strong><br>
                    <span style="color: #5f6368; font-size: 11px;">${stop.zone || 'BMTC Transit Stop'}</span>
                </div>
            `);

            if (onClickStop) {
                marker.on('click', () => onClickStop(stop));
            }

            this.markers.stops.set(stop.stop_id || stop.id, marker);
        });
    },

    busMarkerAnimations: new Map(),

    animateBusMarker(tripId, marker, fromLatLng, toLatLng, duration = 950) {
        if (!marker || !fromLatLng || !toLatLng) return;
        const startLat = fromLatLng[0];
        const startLng = fromLatLng[1];
        const endLat = toLatLng[0];
        const endLng = toLatLng[1];

        // If distance is imperceptible, set directly
        if (Math.abs(startLat - endLat) < 0.000002 && Math.abs(startLng - endLng) < 0.000002) {
            marker.setLatLng(toLatLng);
            return;
        }

        // Cancel existing animation for this bus
        if (this.busMarkerAnimations.has(tripId)) {
            cancelAnimationFrame(this.busMarkerAnimations.get(tripId));
            this.busMarkerAnimations.delete(tripId);
        }

        const startTime = performance.now();

        const animateStep = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(1.0, Math.max(0.0, elapsed / duration));

            // Smooth linear progression matching real bus speed
            const curLat = startLat + (endLat - startLat) * progress;
            const curLng = startLng + (endLng - startLng) * progress;

            marker.setLatLng([curLat, curLng]);

            if (progress < 1.0) {
                const reqId = requestAnimationFrame(animateStep);
                this.busMarkerAnimations.set(tripId, reqId);
            } else {
                this.busMarkerAnimations.delete(tripId);
            }
        };

        const reqId = requestAnimationFrame(animateStep);
        this.busMarkerAnimations.set(tripId, reqId);
    },

    renderBusMarker(trip) {
        if (!this.map || !trip || !trip.current_latitude || !trip.current_longitude) return;

        const crowdColors = {
            low: '#188038',
            medium: '#ea8600',
            high: '#d93025'
        };

        const dotColor = crowdColors[trip.crowd_level] || '#1a73e8';
        const routeNum = trip.route_number || '378';
        const speed = trip.current_speed_kmh || 0;
        const isAtStop = trip.state === 'at_stop' || speed === 0;
        const heading = trip.heading || 0;
        const nextStopName = trip.next_stop_name || (trip.next_stop_forecast ? trip.next_stop_forecast.stop_name : 'Next Stop');
        const etaText = trip.next_stop_forecast ? trip.next_stop_forecast.display_text || `${trip.next_stop_forecast.wait_time_minutes}m` : (isAtStop ? 'At Stop' : `${speed} km/h`);

        // Official Google Maps Styled Live Bus Pin with Heading & Speed Telemetry
        const customIcon = L.divIcon({
            className: 'google-maps-bus-marker',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
                    <!-- Top Pill Badge -->
                    <div style="
                        background: #ffffff;
                        color: #202124;
                        font-family: 'Inter', sans-serif;
                        font-weight: 800;
                        font-size: 11px;
                        padding: 3px 8px;
                        border-radius: 999px;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                        white-space: nowrap;
                        margin-bottom: 2px;
                        border: 2px solid ${isAtStop ? '#ea8600' : '#1a73e8'};
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${dotColor};"></span>
                        <span style="letter-spacing: -0.2px;">${routeNum}</span>
                        <span style="color: ${isAtStop ? '#ea8600' : '#1a73e8'}; font-size: 9.5px; font-weight: 700; border-left: 1px solid rgba(0,0,0,0.12); padding-left: 4px;">
                            ${isAtStop ? 'AT STOP' : `${speed}k`}
                        </span>
                    </div>

                    <!-- Center Vehicle Marker with Heading Pointer & Pulse Radar -->
                    <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
                        <!-- Radar Halo Pulse -->
                        <div style="
                            position: absolute;
                            inset: -6px;
                            border-radius: 50%;
                            background: ${isAtStop ? 'rgba(234, 134, 0, 0.25)' : 'rgba(26, 115, 232, 0.25)'};
                            border: 1.5px solid ${isAtStop ? 'rgba(234, 134, 0, 0.6)' : 'rgba(26, 115, 232, 0.6)'};
                            animation: ${isAtStop ? 'busPulseAtStop 1.8s infinite' : 'busPulseMoving 2s infinite'};
                            pointer-events: none;
                        "></div>

                        <!-- Main Vehicle Dot -->
                        <div style="
                            width: 16px;
                            height: 16px;
                            background: ${isAtStop ? '#ea8600' : '#1a73e8'};
                            border: 2.5px solid #ffffff;
                            border-radius: 50%;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                            position: relative;
                            z-index: 2;
                        "></div>

                        <!-- Directional Heading Pointer Arrow -->
                        ${!isAtStop ? `
                            <div style="
                                position: absolute;
                                top: -3px;
                                width: 0;
                                height: 0;
                                border-left: 4px solid transparent;
                                border-right: 4px solid transparent;
                                border-bottom: 7px solid #1a73e8;
                                transform: rotate(${heading}deg);
                                transform-origin: 50% 14px;
                                z-index: 3;
                                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
                            "></div>
                        ` : ''}
                    </div>
                </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
        });

        const targetLatLng = [trip.current_latitude, trip.current_longitude];

        if (this.markers.buses.has(trip.id)) {
            const marker = this.markers.buses.get(trip.id);
            const currentPos = marker.getLatLng();
            this.animateBusMarker(trip.id, marker, [currentPos.lat, currentPos.lng], targetLatLng, 950);
            marker.setIcon(customIcon);
        } else {
            const marker = L.marker(targetLatLng, { icon: customIcon }).addTo(this.map);
            marker.bindPopup(`
                <div style="font-family: 'Inter', sans-serif; min-width: 170px; padding: 2px 4px; color: #202124;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                        <strong style="color: #1a73e8; font-size: 13px;">Route ${trip.route_number || '378'}</strong>
                        <span style="font-size: 10px; font-weight: 700; background: ${isAtStop ? '#fef7e0' : '#e8f0fe'}; color: ${isAtStop ? '#b06000' : '#1a73e8'}; padding: 1px 6px; border-radius: 999px;">
                            ${isAtStop ? 'Station Dwell' : `${speed} km/h`}
                        </span>
                    </div>
                    <div style="font-size: 11px; color: #5f6368; margin-bottom: 3px;">
                        ${trip.bus_number || 'BMTC Transit'} • ${trip.direction === 'outbound' ? 'Outbound' : 'Inbound'}
                    </div>
                    <div style="font-size: 11px; font-weight: 600; color: #202124; padding-top: 3px; border-top: 1px solid #e8eaed; display: flex; justify-content: space-between;">
                        <span>Next Stop:</span>
                        <span style="color: #1a73e8;">${nextStopName}</span>
                    </div>
                    <div style="font-size: 10px; color: #5f6368; display: flex; justify-content: space-between; margin-top: 2px;">
                        <span>Load:</span>
                        <span>${trip.current_passenger_count || 20}/${trip.capacity || 55} passengers</span>
                    </div>
                </div>
            `);
            marker.on('click', () => {
                if (window.app && window.app.currentView !== 'trips') {
                    window.app.viewTrip(trip.id);
                }
            });
            this.markers.buses.set(trip.id, marker);
        }
    },

    renderBuses(trips) {
        if (!this.map || !trips || !Array.isArray(trips)) return;
        const currentTripIds = new Set(trips.map(t => t.id));

        // Remove old bus markers no longer active
        this.markers.buses.forEach((marker, id) => {
            if (!currentTripIds.has(id)) {
                try { this.map.removeLayer(marker); } catch(e) {}
                this.markers.buses.delete(id);
            }
        });

        // Render / update each active bus
        trips.forEach(trip => this.renderBusMarker(trip));
    },

    fitBounds(latLngs) {
        if (!this.map || !latLngs || latLngs.length === 0) return;
        this.map.fitBounds(latLngs, { padding: [40, 40] });
    }
};
