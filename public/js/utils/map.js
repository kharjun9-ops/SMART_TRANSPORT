/**
 * Lumina Transit Map Utilities with Leaflet
 * Clean HUD Map & Dynamic Journey Routing (Google Maps style)
 */
const MapUtils = {
    map: null,
    markers: {
        buses: new Map(),
        stops: new Map(),
        user: null,
        destination: null
    },
    routeLayers: new Map(),

    initMap(containerId = 'map', center = [6.9271, 79.8612], zoom = 13, options = {}) {
        if (this.map) {
            try {
                this.map.remove();
            } catch (e) {}
            this.map = null;
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

        // CartoDB Dark Matter HUD tiles for clean aesthetic
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
        }).addTo(this.map);

        if (!options.hideZoom) {
            L.control.zoom({ position: 'bottomright' }).addTo(this.map);
        }

        return this.map;
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
        }
    },

    setUserLocation(lat, lng) {
        if (!this.map) return;

        const userIcon = L.divIcon({
            className: 'lumina-user-marker',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
                    <div style="
                        width: 20px;
                        height: 20px;
                        background: #4edea3;
                        border: 3px solid #ffffff;
                        border-radius: 50%;
                        box-shadow: 0 0 16px rgba(78, 222, 163, 0.9);
                        position: relative;
                    ">
                        <div style="
                            position: absolute;
                            inset: -8px;
                            border-radius: 50%;
                            border: 2px solid #4edea3;
                            animation: pulseDot 2s infinite;
                            opacity: 0.6;
                        "></div>
                    </div>
                </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
        });

        if (this.markers.user) {
            this.markers.user.setLatLng([lat, lng]);
        } else {
            this.markers.user = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
        }

        this.map.setView([lat, lng], 13);
    },

    addDestinationMarker(lat, lng, label = 'Destination') {
        if (!this.map) return;

        if (this.markers.destination) {
            try { this.map.removeLayer(this.markers.destination); } catch(e) {}
        }

        const destIcon = L.divIcon({
            className: 'lumina-dest-marker',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
                    <div style="
                        background: #ffb4ab;
                        color: #690005;
                        font-family: 'Inter', sans-serif;
                        font-weight: 700;
                        font-size: 11px;
                        padding: 2px 8px;
                        border-radius: 999px;
                        box-shadow: 0 0 14px rgba(255, 180, 171, 0.7);
                        white-space: nowrap;
                        margin-bottom: 2px;
                    ">
                        ${label}
                    </div>
                    <div style="
                        width: 16px;
                        height: 16px;
                        background: #ffb4ab;
                        border: 3px solid #0c1322;
                        border-radius: 50%;
                        box-shadow: 0 0 10px #ffb4ab;
                    "></div>
                </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
        });

        this.markers.destination = L.marker([lat, lng], { icon: destIcon }).addTo(this.map);
    },

    drawRoute(routeId, stops, color = '#4d8eff') {
        if (!this.map || !stops || stops.length < 2) return;

        if (this.routeLayers.has(routeId)) {
            try { this.map.removeLayer(this.routeLayers.get(routeId)); } catch(e) {}
        }

        const latLngs = stops.map(s => [s.latitude, s.longitude]);
        const polyline = L.polyline(latLngs, {
            color: color || '#4d8eff',
            weight: 5,
            opacity: 0.9,
            lineJoin: 'round'
        }).addTo(this.map);

        this.routeLayers.set(routeId, polyline);
    },

    renderStops(stops, onClickStop) {
        if (!this.map || !stops || !Array.isArray(stops)) return;

        stops.forEach(stop => {
            if (this.markers.stops.has(stop.stop_id || stop.id)) return;

            const isMajor = stop.is_major;
            const stopIcon = L.divIcon({
                className: 'lumina-stop-icon',
                html: `
                    <div style="
                        width: ${isMajor ? '12px' : '8px'};
                        height: ${isMajor ? '12px' : '8px'};
                        background: ${isMajor ? '#4d8eff' : '#8c909f'};
                        border: 2px solid #0c1322;
                        border-radius: 50%;
                        box-shadow: 0 0 ${isMajor ? '8px #4d8eff' : '4px rgba(0,0,0,0.5)'};
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
                <div style="font-family: 'Inter', sans-serif; font-size: 13px; color: #dce2f7; padding: 2px 4px;">
                    <strong style="font-size: 14px; color: #adc6ff;">${stop.stop_name || stop.name}</strong><br>
                    <span style="color: #c2c6d6; font-size: 11px;">${stop.zone || 'Transit Stop'}</span>
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
            low: '#4edea3',
            medium: '#ffb95f',
            high: '#ffb4ab'
        };
        const color = crowdColors[trip.crowd_level] || '#adc6ff';
        const routeNum = trip.route_number || 'Bus';

        const customIcon = L.divIcon({
            className: 'lumina-bus-marker',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
                    <div style="
                        background: #adc6ff;
                        color: #002e6a;
                        font-family: 'Inter', sans-serif;
                        font-weight: 700;
                        font-size: 11px;
                        padding: 2px 8px;
                        border-radius: 999px;
                        box-shadow: 0 0 14px rgba(173, 198, 255, 0.7);
                        white-space: nowrap;
                        margin-bottom: 2px;
                        border: 1px solid rgba(255,255,255,0.4);
                    ">
                        ${routeNum}
                    </div>
                    <div style="
                        width: 14px;
                        height: 14px;
                        background: ${color};
                        border: 2.5px solid #0c1322;
                        border-radius: 50%;
                        box-shadow: 0 0 10px ${color};
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
