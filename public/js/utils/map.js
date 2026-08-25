/**
 * Lumina Transit Map Utilities with Leaflet
 * Official Google Maps Style Tile Engine & Dynamic Routing
 */
const MapUtils = {
    map: null,
    tileLayer: null,
    currentMapType: 'roadmap', // 'roadmap' | 'satellite' | 'dark'
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
            ...options
        });

        // Apply Google Maps Standard Roadmap Tiles (Official Google Maps Interface)
        const isLight = document.documentElement.classList.contains('light');
        this.currentMapType = isLight ? 'roadmap' : 'dark';
        this.applyTileLayer(this.currentMapType);

        if (!options.hideZoom) {
            L.control.zoom({ position: 'bottomright' }).addTo(this.map);
        }

        // Add Google Maps layer switcher floating button if requested
        if (options.showLayerSwitcher) {
            this.addLayerSwitcherControl(containerId);
        }

        return this.map;
    },

    applyTileLayer(type = 'roadmap') {
        if (!this.map) return;
        this.currentMapType = type;

        if (this.tileLayer) {
            try {
                this.map.removeLayer(this.tileLayer);
            } catch (e) {}
        }

        if (type === 'roadmap') {
            // Google Maps Official Standard Roadmap (Real Google Maps Interface)
            this.tileLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: '&copy; Google Maps'
            }).addTo(this.map);
        } else if (type === 'satellite') {
            // Google Maps Satellite / Hybrid with Labels
            this.tileLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: '&copy; Google Maps Satellite'
            }).addTo(this.map);
        } else if (type === 'dark') {
            // CartoDB Dark Matter HUD
            this.tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                subdomains: 'abcd',
                attribution: '&copy; CARTO'
            }).addTo(this.map);
        } else {
            // CartoDB Voyager Google Maps Style Fallback
            this.tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                subdomains: 'abcd',
                attribution: '&copy; CARTO'
            }).addTo(this.map);
        }
    },

    updateTheme(isLight) {
        // When theme is updated, switch to Google Maps Roadmap in Light mode
        const newType = isLight ? 'roadmap' : 'dark';
        this.applyTileLayer(newType);

        // Refresh user marker
        if (this.userCoordinates) {
            this.setUserLocation(this.userCoordinates.lat, this.userCoordinates.lng, false);
        }

        // Refresh destination marker
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

        const isLight = document.documentElement.classList.contains('light');

        // Official Google Maps Blue Dot Marker with Pulse Wave
        const dotColor = isLight ? '#1a73e8' : '#4edea3';
        const shadowGlow = isLight ? 'rgba(26, 115, 232, 0.4)' : 'rgba(78, 222, 163, 0.9)';

        const userIcon = L.divIcon({
            className: 'google-maps-user-marker',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
                    <div style="
                        width: 22px;
                        height: 22px;
                        background: ${dotColor};
                        border: 3.5px solid #ffffff;
                        border-radius: 50%;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.35), 0 0 12px ${shadowGlow};
                        position: relative;
                    ">
                        <div style="
                            position: absolute;
                            inset: -10px;
                            border-radius: 50%;
                            border: 2px solid ${dotColor};
                            background: ${isLight ? 'rgba(26, 115, 232, 0.2)' : 'rgba(78, 222, 163, 0.2)'};
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
            this.map.setView([lat, lng], 13);
        }
    },

    addDestinationMarker(lat, lng, label = 'Destination') {
        if (!this.map) return;
        this.destinationCoordinates = { lat, lng };
        this.destinationLabel = label;

        if (this.markers.destination) {
            try { this.map.removeLayer(this.markers.destination); } catch(e) {}
        }

        // Official Google Maps Red Destination Pin
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
                        box-shadow: 0 2px 10px rgba(0,0,0,0.25);
                        white-space: nowrap;
                        margin-bottom: 2px;
                        border: 2px solid #ffffff;
                    ">
                        ${label}
                    </div>
                    <div style="
                        width: 20px;
                        height: 20px;
                        background: #ea4335;
                        border: 3px solid #ffffff;
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        box-shadow: 0 3px 8px rgba(0,0,0,0.35);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
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

        const isLight = document.documentElement.classList.contains('light');
        const routeColor = color || (isLight ? '#1a73e8' : '#4d8eff');

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

        const isLight = document.documentElement.classList.contains('light');

        stops.forEach(stop => {
            if (this.markers.stops.has(stop.stop_id || stop.id)) return;

            const isMajor = stop.is_major;
            const stopColor = isMajor ? (isLight ? '#1a73e8' : '#4d8eff') : (isLight ? '#5f6368' : '#8c909f');

            const stopIcon = L.divIcon({
                className: 'google-maps-stop-icon',
                html: `
                    <div style="
                        width: ${isMajor ? '14px' : '10px'};
                        height: ${isMajor ? '14px' : '10px'};
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
                <div style="font-family: 'Inter', sans-serif; font-size: 13px; color: ${isLight ? '#202124' : '#dce2f7'}; padding: 2px 4px;">
                    <strong style="font-size: 14px; color: ${isLight ? '#1a73e8' : '#adc6ff'};">${stop.stop_name || stop.name}</strong><br>
                    <span style="color: ${isLight ? '#5f6368' : '#c2c6d6'}; font-size: 11px;">${stop.zone || 'BMTC Transit Stop'}</span>
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

        const isLight = document.documentElement.classList.contains('light');

        const crowdColors = isLight ? {
            low: '#188038',
            medium: '#ea8600',
            high: '#d93025'
        } : {
            low: '#4edea3',
            medium: '#ffb95f',
            high: '#ffb4ab'
        };

        const dotColor = crowdColors[trip.crowd_level] || (isLight ? '#1a73e8' : '#adc6ff');
        const routeNum = trip.route_number || 'BMTC';

        const customIcon = L.divIcon({
            className: 'google-maps-bus-marker',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
                    <div style="
                        background: ${isLight ? '#ffffff' : '#adc6ff'};
                        color: ${isLight ? '#1a73e8' : '#002e6a'};
                        font-family: 'Inter', sans-serif;
                        font-weight: 800;
                        font-size: 11px;
                        padding: 3px 9px;
                        border-radius: 999px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                        white-space: nowrap;
                        margin-bottom: 3px;
                        border: 2px solid ${isLight ? '#1a73e8' : '#ffffff'};
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${dotColor};"></span>
                        <span>${routeNum}</span>
                    </div>
                    <div style="
                        width: 14px;
                        height: 14px;
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
