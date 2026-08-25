-- ============================================
-- Seed Data - Realistic Bus Routes & Stops (Route 378: Silk Institute - Kengeri TTMC)
-- ============================================

-- Insert Stops
INSERT OR IGNORE INTO stops (id, name, latitude, longitude, zone, is_major, amenities) VALUES
('stop_blr_01', 'Silk Institute (Kanakapura Rd)', 12.8465, 77.5342, 'South Terminal', 1, '["shelter","seating","display_board","restroom"]'),
('stop_blr_02', 'Thalaghattapura', 12.8550, 77.5390, 'Kanakapura Corridor', 0, '["shelter","seating"]'),
('stop_blr_03', 'Vajrahalli', 12.8645, 77.5448, 'Kanakapura Corridor', 0, '["shelter"]'),
('stop_blr_04', 'Doddakallasandra', 12.8765, 77.5615, 'Kanakapura Corridor', 0, '["shelter","seating"]'),
('stop_blr_05', 'Konanakunte Cross', 12.8895, 77.5738, 'Kanakapura Corridor', 1, '["shelter","seating","display_board"]'),
('stop_blr_06', 'Banashankari TTMC', 12.9177, 77.5739, 'South Hub', 1, '["shelter","seating","display_board"]'),
('stop_blr_07', 'Rajarajeshwari Nagar Gate', 12.9288, 77.5188, 'Mysore Rd Corridor', 0, '["shelter","seating"]'),
('stop_blr_08', 'Bangalore University Gate', 12.9185, 77.5020, 'Mysore Rd Corridor', 0, '["shelter"]'),
('stop_blr_09', 'Kengeri TTMC / Bus Terminal', 12.9081, 77.4835, 'West Terminal', 1, '["shelter","seating","display_board","restroom"]'),
('stop_blr_10', 'Kengeri Satellite Town', 12.8985, 77.4780, 'West Terminal', 0, '["shelter","seating"]');

-- Insert Route 378
INSERT OR IGNORE INTO routes (id, name, route_number, color, description, total_distance_km, avg_duration_minutes, fare_lkr, status) VALUES
('route_blr_378', 'Silk Institute - Kengeri TTMC', '378', '#10B981', 'Direct BMTC route connecting Silk Institute to Kengeri TTMC via Kanakapura Corridor & RR Nagar', 21.5, 55, 35, 'active');

-- Insert Route-Stop mappings
INSERT OR IGNORE INTO route_stops (route_id, stop_id, sequence_order, distance_from_start_km, avg_time_from_start_min) VALUES
('route_blr_378', 'stop_blr_01', 1, 0, 0),
('route_blr_378', 'stop_blr_02', 2, 1.8, 5),
('route_blr_378', 'stop_blr_03', 3, 3.5, 10),
('route_blr_378', 'stop_blr_04', 4, 5.8, 16),
('route_blr_378', 'stop_blr_05', 5, 8.2, 23),
('route_blr_378', 'stop_blr_06', 6, 12.0, 32),
('route_blr_378', 'stop_blr_07', 7, 16.5, 42),
('route_blr_378', 'stop_blr_08', 8, 18.8, 48),
('route_blr_378', 'stop_blr_09', 9, 21.5, 55),
('route_blr_378', 'stop_blr_10', 10, 23.0, 60);

-- Insert Buses
INSERT OR IGNORE INTO buses (id, route_id, bus_number, capacity, status, driver_name) VALUES
('bus_blr_01', 'route_blr_378', 'KA-01-F-3781', 55, 'in_service', 'Manjunath Gowda'),
('bus_blr_02', 'route_blr_378', 'KA-57-F-3782', 55, 'in_service', 'Ramesh Kumar'),
('bus_blr_03', 'route_blr_378', 'KA-41-F-3783', 52, 'in_service', 'Shankarappa');

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
('badge_09', 'Transit Legend', 'Reach 5000 points', '👑', 'general', 'points', 5000, 'legendary'),
('badge_10', 'Crowd Master', 'Submit 50 crowd feedbacks', '🎯', 'crowd', 'contributions', 50, 'epic'),
('badge_11', 'Early Bird', 'Report on a bus before 7 AM', '🌅', 'travel', 'special', 1, 'rare'),
('badge_12', 'Night Owl', 'Report on a bus after 9 PM', '🦉', 'travel', 'special', 1, 'rare');

-- Insert sample trips
INSERT OR IGNORE INTO trips (id, bus_id, route_id, direction, scheduled_start, status, current_stop_index, current_passenger_count, delay_minutes) VALUES
('trip_blr_01', 'bus_blr_01', 'route_blr_378', 'outbound', datetime('now', '-15 minutes'), 'active', 2, 26, 1),
('trip_blr_02', 'bus_blr_02', 'route_blr_378', 'inbound', datetime('now', '-25 minutes'), 'active', 7, 38, 0),
('trip_blr_03', 'bus_blr_03', 'route_blr_378', 'outbound', datetime('now', '-35 minutes'), 'active', 4, 32, 2);
