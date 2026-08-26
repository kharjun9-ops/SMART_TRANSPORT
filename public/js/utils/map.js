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

        // Official Google Maps Blue Dot Marker with Pulse Radar Halo
        const userIcon = L.divIcon({
            className: 'google-maps-user-marker',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
                    <div style="
                        width: 20px;
                        height: 20px;
                        background: #1a73e8;
                        border: 3.5px solid #ffffff;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.35), 0 0 10px rgba(26,115,232,0.6);
                        position: relative;
                    ">
                        <div style="
                            position: absolute;
                            inset: -8px;
                            border-radius: 50%;
                            border: 2px solid #1a73e8;
                            background: rgba(26, 115, 232, 0.2);
                            animation: pulseDot 2s infinite;
                        "></div>
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

    drawRoute(routeId, stops, color = null) {
        if (!this.map || !stops || stops.length < 2) return;

        if (this.routeLayers.has(routeId)) {
            try { this.map.removeLayer(this.routeLayers.get(routeId)); } catch(e) {}
        }

        // Official Google Maps Navigation Route Blue
        const routeColor = color || '#1a73e8';

        const latLngs = stops.map(s => [s.latitude, s.longitude]);
        const polyline = L.polyline(latLngs, {
            color: routeColor,
            weight: 6,
            opacity: 0.95,
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(this.map);

        this.routeLayers.set(routeId, polyline);
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

    renderBusMarker(trip) {
        if (!this.map || !trip || !trip.current_latitude || !trip.current_longitude) return;

        const crowdColors = {
            low: '#188038',
            medium: '#ea8600',
            high: '#d93025'
        };

        const dotColor = crowdColors[trip.crowd_level] || '#1a73e8';
        const routeNum = trip.route_number || 'BMTC';

        // Official Google Maps Styled Live Bus Pin
        const customIcon = L.divIcon({
            className: 'google-maps-bus-marker',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
                    <div style="
                        background: #ffffff;
                        color: #202124;
                        font-family: 'Inter', sans-serif;
                        font-weight: 800;
                        font-size: 11px;
                        padding: 3px 9px;
                        border-radius: 999px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                        white-space: nowrap;
                        margin-bottom: 3px;
                        border: 2px solid #1a73e8;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${dotColor};"></span>
                        <span>${routeNum}</span>
                    </div>
                    <div style="
                        width: 15px;
                        height: 15px;
                        background: ${dotColor};
                        border: 2.5px solid #ffffff;
                        border-radius: 50%;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                    "></div>
                </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
        });

        const latLng = [trip.current_latitude, trip.current_longitude];

        if (this.markers.buses.has(trip.id)) {
            const marker = this.markers.buses.get(trip.id);
            marker.setLatLng(latLng);
            marker.setIcon(customIcon);
        } else {
            const marker = L.marker(latLng, { icon: customIcon }).addTo(this.map);
            marker.on('click', () => {
                if (window.app) window.app.viewTrip(trip.id);
            });
            this.markers.buses.set(trip.id, marker);
        }
    },

    fitBounds(latLngs) {
        if (!this.map || !latLngs || latLngs.length === 0) return;
        this.map.fitBounds(latLngs, { padding: [40, 40] });
    }
};
