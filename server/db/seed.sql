-- ============================================
-- Seed Data - Realistic Bus Routes & Stops
-- ============================================

-- Insert Stops (City area with realistic coordinates)
INSERT OR IGNORE INTO stops (id, name, latitude, longitude, zone, is_major, amenities) VALUES
('stop_01', 'Central Bus Terminal', 6.9271, 79.8612, 'Zone A', 1, '["shelter","seating","display_board","restroom"]'),
('stop_02', 'Fort Railway Station', 6.9344, 79.8428, 'Zone A', 1, '["shelter","seating","display_board"]'),
('stop_03', 'Town Hall', 6.9147, 79.8634, 'Zone A', 1, '["shelter","seating"]'),
('stop_04', 'Bambalapitiya Junction', 6.8930, 79.8560, 'Zone B', 1, '["shelter","seating"]'),
('stop_05', 'Wellawatte', 6.8748, 79.8602, 'Zone B', 0, '["shelter"]'),
('stop_06', 'Dehiwala', 6.8566, 79.8654, 'Zone B', 1, '["shelter","seating","display_board"]'),
('stop_07', 'Mount Lavinia', 6.8390, 79.8660, 'Zone C', 1, '["shelter","seating"]'),
('stop_08', 'Ratmalana', 6.8220, 79.8770, 'Zone C', 0, '["shelter"]'),
('stop_09', 'Moratuwa', 6.7980, 79.8820, 'Zone C', 1, '["shelter","seating","display_board"]'),
('stop_10', 'Panadura', 6.7130, 79.9060, 'Zone D', 1, '["shelter","seating","display_board"]'),
('stop_11', 'Maradana', 6.9286, 79.8667, 'Zone A', 1, '["shelter","seating"]'),
('stop_12', 'Borella', 6.9180, 79.8770, 'Zone A', 0, '["shelter"]'),
('stop_13', 'Rajagiriya', 6.9120, 79.8960, 'Zone B', 0, '["shelter","seating"]'),
('stop_14', 'Battaramulla', 6.9060, 79.9180, 'Zone B', 1, '["shelter","seating"]'),
('stop_15', 'Kaduwela', 6.9320, 79.9830, 'Zone C', 1, '["shelter","seating","display_board"]'),
('stop_16', 'Pettah Market', 6.9350, 79.8500, 'Zone A', 1, '["shelter","seating"]'),
('stop_17', 'Nugegoda', 6.8720, 79.8880, 'Zone B', 1, '["shelter","seating","display_board"]'),
('stop_18', 'Maharagama', 6.8480, 79.9260, 'Zone C', 1, '["shelter","seating"]'),
('stop_19', 'Kottawa', 6.8420, 79.9620, 'Zone C', 1, '["shelter","seating","display_board"]'),
('stop_20', 'Homagama', 6.8410, 79.9990, 'Zone D', 1, '["shelter","seating"]'),
('stop_21', 'Kiribathgoda', 6.9780, 79.9280, 'Zone B', 0, '["shelter"]'),
('stop_22', 'Kadawatha', 6.9930, 79.9500, 'Zone C', 1, '["shelter","seating"]'),
('stop_23', 'Ganemulla', 7.0110, 79.9680, 'Zone C', 0, '["shelter"]'),
('stop_24', 'Ja-Ela', 7.0750, 79.8920, 'Zone D', 1, '["shelter","seating","display_board"]'),
('stop_25', 'Negombo', 7.2080, 79.8390, 'Zone E', 1, '["shelter","seating","display_board","restroom"]');

-- Insert Routes
INSERT OR IGNORE INTO routes (id, name, route_number, color, description, total_distance_km, avg_duration_minutes, fare_lkr, status) VALUES
('route_01', 'Central - Mount Lavinia Coastal', '100', '#4285F4', 'Scenic coastal route via Galle Road', 15.2, 55, 80, 'active'),
('route_02', 'Central - Panadura Express', '101', '#EA4335', 'Express service to southern suburbs', 28.5, 75, 120, 'active'),
('route_03', 'Central - Kaduwela via Rajagiriya', '177', '#34A853', 'Eastern route through Rajagiriya corridor', 18.8, 50, 90, 'active'),
('route_04', 'Fort - Kottawa via Nugegoda', '138', '#FBBC04', 'Major route through Nugegoda town', 22.3, 65, 100, 'active'),
('route_05', 'Central - Negombo via Ja-Ela', '240', '#9C27B0', 'Northern coastal highway route', 35.0, 90, 150, 'active');

-- Insert Route-Stop mappings
-- Route 100: Central - Mount Lavinia Coastal
INSERT OR IGNORE INTO route_stops (route_id, stop_id, sequence_order, distance_from_start_km, avg_time_from_start_min) VALUES
('route_01', 'stop_01', 1, 0, 0),
('route_01', 'stop_03', 2, 1.8, 8),
('route_01', 'stop_04', 3, 5.2, 18),
('route_01', 'stop_05', 4, 7.8, 28),
('route_01', 'stop_06', 5, 10.5, 38),
('route_01', 'stop_07', 6, 13.0, 48),
('route_01', 'stop_08', 7, 15.2, 55);

-- Route 101: Central - Panadura Express
INSERT OR IGNORE INTO route_stops (route_id, stop_id, sequence_order, distance_from_start_km, avg_time_from_start_min) VALUES
('route_02', 'stop_01', 1, 0, 0),
('route_02', 'stop_03', 2, 1.8, 7),
('route_02', 'stop_04', 3, 5.2, 15),
('route_02', 'stop_06', 4, 10.5, 30),
('route_02', 'stop_07', 5, 13.0, 38),
('route_02', 'stop_09', 6, 20.5, 55),
('route_02', 'stop_10', 7, 28.5, 75);

-- Route 177: Central - Kaduwela
INSERT OR IGNORE INTO route_stops (route_id, stop_id, sequence_order, distance_from_start_km, avg_time_from_start_min) VALUES
('route_03', 'stop_01', 1, 0, 0),
('route_03', 'stop_11', 2, 1.2, 5),
('route_03', 'stop_12', 3, 3.0, 12),
('route_03', 'stop_13', 4, 6.5, 20),
('route_03', 'stop_14', 5, 10.0, 30),
('route_03', 'stop_15', 6, 18.8, 50);

-- Route 138: Fort - Kottawa
INSERT OR IGNORE INTO route_stops (route_id, stop_id, sequence_order, distance_from_start_km, avg_time_from_start_min) VALUES
('route_04', 'stop_02', 1, 0, 0),
('route_04', 'stop_16', 2, 1.0, 5),
('route_04', 'stop_11', 3, 2.5, 10),
('route_04', 'stop_12', 4, 4.5, 18),
('route_04', 'stop_17', 5, 10.2, 32),
('route_04', 'stop_18', 6, 16.0, 48),
('route_04', 'stop_19', 7, 22.3, 65);

-- Route 240: Central - Negombo
INSERT OR IGNORE INTO route_stops (route_id, stop_id, sequence_order, distance_from_start_km, avg_time_from_start_min) VALUES
('route_05', 'stop_01', 1, 0, 0),
('route_05', 'stop_11', 2, 1.2, 5),
('route_05', 'stop_21', 3, 8.5, 22),
('route_05', 'stop_22', 4, 12.0, 32),
('route_05', 'stop_23', 5, 16.5, 45),
('route_05', 'stop_24', 6, 24.0, 65),
('route_05', 'stop_25', 7, 35.0, 90);

-- Insert Buses
INSERT OR IGNORE INTO buses (id, route_id, bus_number, capacity, status, driver_name) VALUES
('bus_01', 'route_01', 'NB-1234', 52, 'in_service', 'Kamal Perera'),
('bus_02', 'route_01', 'NB-5678', 52, 'in_service', 'Nimal Silva'),
('bus_03', 'route_02', 'NB-9012', 48, 'in_service', 'Sunil Fernando'),
('bus_04', 'route_02', 'NB-3456', 48, 'in_service', 'Amal Jayasinghe'),
('bus_05', 'route_03', 'NB-7890', 45, 'in_service', 'Ruwan Bandara'),
('bus_06', 'route_03', 'NB-2345', 45, 'in_service', 'Chaminda Ratnayake'),
('bus_07', 'route_04', 'NB-6789', 50, 'in_service', 'Pradeep Kumara'),
('bus_08', 'route_04', 'NB-0123', 50, 'in_service', 'Saman Weerasinghe'),
('bus_09', 'route_05', 'NB-4567', 55, 'in_service', 'Lakmal Dissanayake'),
('bus_10', 'route_05', 'NB-8901', 55, 'in_service', 'Thilanka Rajapaksha');

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

-- Insert sample trips (these will be regenerated by simulation engine)
INSERT OR IGNORE INTO trips (id, bus_id, route_id, direction, scheduled_start, status, current_stop_index, current_passenger_count, delay_minutes) VALUES
('trip_01', 'bus_01', 'route_01', 'outbound', datetime('now', '-30 minutes'), 'active', 3, 28, 2),
('trip_02', 'bus_02', 'route_01', 'inbound', datetime('now', '-15 minutes'), 'active', 2, 15, 0),
('trip_03', 'bus_03', 'route_02', 'outbound', datetime('now', '-45 minutes'), 'active', 4, 38, 5),
('trip_04', 'bus_04', 'route_02', 'outbound', datetime('now', '+10 minutes'), 'scheduled', 0, 0, 0),
('trip_05', 'bus_05', 'route_03', 'outbound', datetime('now', '-20 minutes'), 'active', 2, 22, 1),
('trip_06', 'bus_06', 'route_03', 'inbound', datetime('now', '-35 minutes'), 'active', 4, 35, 3),
('trip_07', 'bus_07', 'route_04', 'outbound', datetime('now', '-10 minutes'), 'active', 1, 12, 0),
('trip_08', 'bus_08', 'route_04', 'outbound', datetime('now', '+20 minutes'), 'scheduled', 0, 0, 0),
('trip_09', 'bus_09', 'route_05', 'outbound', datetime('now', '-50 minutes'), 'active', 4, 42, 7),
('trip_10', 'bus_10', 'route_05', 'inbound', datetime('now', '-25 minutes'), 'active', 3, 30, 2);
