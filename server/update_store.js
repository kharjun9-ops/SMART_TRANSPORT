const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '..', 'data', 'transit_store.json');
if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

    const newStops = [
        { id: 'stop_blr_01', name: 'Electronic City Wipro Gate', latitude: 12.84515, longitude: 77.66021, zone: 'Electronic City Hub', is_major: 1, amenities: '["shelter","seating","display_board","restroom"]' },
        { id: 'stop_blr_02', name: 'Electronic City Toll Gate / Phase 1', latitude: 12.84923, longitude: 77.67052, zone: 'Electronic City Corridor', is_major: 0, amenities: '["shelter","seating"]' },
        { id: 'stop_blr_03', name: 'Konappana Agrahara', latitude: 12.85795, longitude: 77.67498, zone: 'Hosur Rd Corridor', is_major: 0, amenities: '["shelter"]' },
        { id: 'stop_blr_04', name: 'Hosa Road Junction', latitude: 12.87079, longitude: 77.66602, zone: 'Hosur Rd Corridor', is_major: 0, amenities: '["shelter","seating"]' },
        { id: 'stop_blr_05', name: 'Gottigere (Bannerghatta Rd)', latitude: 12.85819, longitude: 77.58531, zone: 'Bannerghatta Corridor', is_major: 0, amenities: '["shelter","seating"]' },
        { id: 'stop_blr_06', name: 'Silk Institute (Kanakapura Rd)', latitude: 12.86242, longitude: 77.53028, zone: 'Kanakapura Corridor', is_major: 1, amenities: '["shelter","seating","display_board"]' },
        { id: 'stop_blr_07', name: 'Thalaghattapura', latitude: 12.87181, longitude: 77.53717, zone: 'Kanakapura Corridor', is_major: 0, amenities: '["shelter","seating"]' },
        { id: 'stop_blr_08', name: 'Vajrahalli', latitude: 12.88140, longitude: 77.54630, zone: 'Kanakapura Corridor', is_major: 0, amenities: '["shelter"]' },
        { id: 'stop_blr_09', name: 'Konanakunte Cross', latitude: 12.88950, longitude: 77.57381, zone: 'South Hub', is_major: 1, amenities: '["shelter","seating","display_board"]' },
        { id: 'stop_blr_10', name: 'Uttarahalli / Channasandra', latitude: 12.90500, longitude: 77.52494, zone: 'Uttarahalli Corridor', is_major: 0, amenities: '["shelter","seating"]' },
        { id: 'stop_blr_11', name: 'Rajarajeshwari Nagar Gate', latitude: 12.92891, longitude: 77.51884, zone: 'Mysore Rd Corridor', is_major: 0, amenities: '["shelter","seating"]' },
        { id: 'stop_blr_12', name: 'Bangalore University Gate', latitude: 12.91833, longitude: 77.50172, zone: 'Mysore Rd Corridor', is_major: 0, amenities: '["shelter"]' },
        { id: 'stop_blr_13', name: 'Kengeri TTMC / Bus Terminal', latitude: 12.90804, longitude: 77.48350, zone: 'West Terminal', is_major: 1, amenities: '["shelter","seating","display_board","restroom"]' },
        { id: 'stop_blr_14', name: 'Kengeri Satellite Town', latitude: 12.89858, longitude: 77.47800, zone: 'West Terminal', is_major: 0, amenities: '["shelter","seating"]' }
    ];

    store.stops = newStops;
    if (store.routes && store.routes[0]) {
        store.routes[0].description = 'Direct BMTC Route 378 connecting Electronic City to Kengeri TTMC via Gottigere, Silk Institute, Vajrahalli & Uttarahalli';
    }
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('transit_store.json updated successfully with Kanakapura corridor stops!');
}
