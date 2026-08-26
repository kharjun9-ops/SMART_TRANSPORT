-- ============================================
-- Seed Data - Route 378: Electronic City - Kengeri TTMC
-- ============================================

-- Insert Stops
INSERT OR IGNORE INTO stops (id, name, latitude, longitude, zone, is_major, amenities) VALUES
('stop_blr_01', 'Electronic City Wipro Gate', 12.8452, 77.6602, 'Electronic City Hub', 1, '["shelter","seating","display_board","restroom"]'),
('stop_blr_02', 'Electronic City Toll Gate / Phase 1', 12.8498, 77.6705, 'Electronic City Corridor', 0, '["shelter","seating"]'),
('stop_blr_03', 'Konappana Agrahara', 12.8580, 77.6750, 'Hosur Rd Corridor', 0, '["shelter"]'),
('stop_blr_04', 'Hosa Road Junction', 12.8710, 77.6650, 'Hosur Rd Corridor', 0, '["shelter","seating"]'),
('stop_blr_05', 'Gottigere (Bannerghatta Rd)', 12.8582, 77.5850, 'NICE Corridor', 0, '["shelter","seating"]'),
('stop_blr_06', 'Silk Institute (Kanakapura Rd)', 12.8465, 77.5342, 'Kanakapura Corridor', 1, '["shelter","seating","display_board"]'),
('stop_blr_07', 'Thalaghattapura', 12.8550, 77.5390, 'Kanakapura Corridor', 0, '["shelter","seating"]'),
('stop_blr_08', 'Vajrahalli', 12.8645, 77.5448, 'Kanakapura Corridor', 0, '["shelter"]'),
('stop_blr_09', 'Konanakunte Cross', 12.8895, 77.5738, 'South Hub', 1, '["shelter","seating","display_board"]'),
('stop_blr_10', 'Uttarahalli / Channasandra', 12.9050, 77.5250, 'Uttarahalli Corridor', 0, '["shelter","seating"]'),
('stop_blr_11', 'Rajarajeshwari Nagar Gate', 12.9288, 77.5188, 'Mysore Rd Corridor', 0, '["shelter","seating"]'),
('stop_blr_12', 'Bangalore University Gate', 12.9185, 77.5020, 'Mysore Rd Corridor', 0, '["shelter"]'),
('stop_blr_13', 'Kengeri TTMC / Bus Terminal', 12.9081, 77.4835, 'West Terminal', 1, '["shelter","seating","display_board","restroom"]'),
('stop_blr_14', 'Kengeri Satellite Town', 12.8985, 77.4780, 'West Terminal', 0, '["shelter","seating"]');

-- Insert Route 378
INSERT OR IGNORE INTO routes (id, name, route_number, color, description, total_distance_km, avg_duration_minutes, fare_lkr, status) VALUES
('route_blr_378', 'Electronic City - Kengeri TTMC', '378', '#10B981', 'Direct BMTC Route 378 connecting Electronic City to Kengeri TTMC via NICE Corridor, Silk Institute & RR Nagar', 32.0, 75, 45, 'active');

-- Insert Route-Stop mappings
INSERT OR IGNORE INTO route_stops (route_id, stop_id, sequence_order, distance_from_start_km, avg_time_from_start_min) VALUES
('route_blr_378', 'stop_blr_01', 1, 0, 0),
('route_blr_378', 'stop_blr_02', 2, 2.0, 5),
('route_blr_378', 'stop_blr_03', 3, 4.2, 10),
('route_blr_378', 'stop_blr_04', 4, 6.8, 16),
('route_blr_378', 'stop_blr_05', 5, 13.5, 30),
('route_blr_378', 'stop_blr_06', 6, 19.0, 42),
('route_blr_378', 'stop_blr_07', 7, 20.8, 47),
('route_blr_378', 'stop_blr_08', 8, 22.5, 52),
('route_blr_378', 'stop_blr_09', 9, 25.0, 58),
('route_blr_378', 'stop_blr_10', 10, 27.5, 64),
('route_blr_378', 'stop_blr_11', 11, 29.5, 68),
('route_blr_378', 'stop_blr_12', 12, 30.8, 71),
('route_blr_378', 'stop_blr_13', 13, 32.0, 75),
('route_blr_378', 'stop_blr_14', 14, 33.5, 80);

-- Insert Buses
INSERT OR IGNORE INTO buses (id, route_id, bus_number, capacity, status, driver_name) VALUES
('bus_blr_01', 'route_blr_378', 'KA-01-F-3781', 55, 'in_service', 'Manjunath Gowda'),
('bus_blr_02', 'route_blr_378', 'KA-57-F-3782', 55, 'in_service', 'Ramesh Kumar'),
('bus_blr_03', 'route_blr_378', 'KA-41-F-3783', 52, 'in_service', 'Shankarappa'),
('bus_blr_04', 'route_blr_378', 'KA-05-AF-3784', 55, 'in_service', 'Venkatesh Murthy');

-- Insert Badges
INSERT OR IGNORE INTO badges (id, name, description, icon, category, requirement_type, requirement_value, rarity) VALUES
('badge_01', 'First Ride', 'Board your first bus', '🎫', 'travel', 'contributions', 1, 'common'),
('badge_02', 'Regular Commuter', 'Make 10 contributions', '🚌', 'travel', 'contributions', 10, 'common'),
('badge_03', 'Crowd Reporter', 'Submit 5 crowd feedbacks', '👥', 'crowd', 'contributions', 5, 'common'),
('badge_04', 'Weekly Warrior', 'Maintain a 7-day streak', '🔥', 'general', 'streak', 7, 'rare'),
('badge_05', 'Transit Expert', 'Reach 500 points', '⭐', 'general', 'points', 500, 'rare'),
('badge_06', 'Community Guardian', 'Submit 10 valid reports', '🛡️', 'social', 'contributions', 10, 'rare'),
('badge_07', 'Century Club', 'Make 100 contributions', '💯', 'general', 'contributions', 100, 'epic'),
('badge_08', 'Trusted Source', 'Achieve 0.9 reliability score', '✅', 'general', 'special', 90, 'epic'),
('badge_09', 'Transit Legend', 'Reach 5000 points', '👑', 'general', 'points', 5000, 'legendary');

-- Insert sample trips
INSERT OR IGNORE INTO trips (id, bus_id, route_id, direction, scheduled_start, status, current_stop_index, current_passenger_count, delay_minutes) VALUES
('trip_blr_01', 'bus_blr_01', 'route_blr_378', 'outbound', datetime('now', '-5 minutes'), 'active', 1, 24, 0),
('trip_blr_02', 'bus_blr_02', 'route_blr_378', 'outbound', datetime('now', '-28 minutes'), 'active', 5, 38, 1),
('trip_blr_03', 'bus_blr_03', 'route_blr_378', 'inbound', datetime('now', '-12 minutes'), 'active', 2, 29, 0),
('trip_blr_04', 'bus_blr_04', 'route_blr_378', 'inbound', datetime('now', '-36 minutes'), 'active', 8, 44, 2);
