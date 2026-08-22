-- ============================================
-- Smart Transit Crowd Intelligence - Schema
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    points INTEGER DEFAULT 0,
    level TEXT DEFAULT 'Commuter',
    reliability_score REAL DEFAULT 0.5,
    total_contributions INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_contribution_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    route_number TEXT NOT NULL,
    color TEXT DEFAULT '#4285F4',
    description TEXT,
    total_distance_km REAL,
    avg_duration_minutes INTEGER,
    fare_lkr REAL,
    status TEXT DEFAULT 'active'
);

-- Stops table
CREATE TABLE IF NOT EXISTS stops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    zone TEXT,
    is_major INTEGER DEFAULT 0,
    amenities TEXT -- JSON array
);

-- Route-Stop junction table (ordered stops per route)
CREATE TABLE IF NOT EXISTS route_stops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id TEXT NOT NULL,
    stop_id TEXT NOT NULL,
    sequence_order INTEGER NOT NULL,
    distance_from_start_km REAL DEFAULT 0,
    avg_time_from_start_min INTEGER DEFAULT 0,
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (stop_id) REFERENCES stops(id),
    UNIQUE(route_id, stop_id)
);

-- Buses table
CREATE TABLE IF NOT EXISTS buses (
    id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL,
    bus_number TEXT NOT NULL,
    capacity INTEGER DEFAULT 50,
    current_latitude REAL,
    current_longitude REAL,
    current_speed_kmh REAL DEFAULT 0,
    heading REAL DEFAULT 0,
    status TEXT DEFAULT 'idle', -- idle, in_service, maintenance
    driver_name TEXT,
    FOREIGN KEY (route_id) REFERENCES routes(id)
);

-- Trips table (active journeys)
CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    bus_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    direction TEXT DEFAULT 'outbound', -- outbound, inbound
    scheduled_start TEXT,
    actual_start TEXT,
    scheduled_end TEXT,
    actual_end TEXT,
    current_stop_index INTEGER DEFAULT 0,
    current_passenger_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled', -- scheduled, active, completed, cancelled
    delay_minutes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (bus_id) REFERENCES buses(id),
    FOREIGN KEY (route_id) REFERENCES routes(id)
);

-- User updates (boarding, deboarding, crowd feedback)
CREATE TABLE IF NOT EXISTS user_updates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    trip_id TEXT NOT NULL,
    stop_id TEXT,
    update_type TEXT NOT NULL, -- 'board', 'deboard', 'crowd_feedback'
    crowd_level TEXT, -- 'low', 'medium', 'high'
    latitude REAL,
    longitude REAL,
    gps_verified INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'pending', -- pending, verified, rejected
    confidence_score REAL DEFAULT 0.5,
    verification_notes TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    FOREIGN KEY (stop_id) REFERENCES stops(id)
);

-- Crowd estimates per trip per stop
CREATE TABLE IF NOT EXISTS crowd_estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id TEXT NOT NULL,
    stop_id TEXT NOT NULL,
    estimated_level TEXT NOT NULL, -- 'low', 'medium', 'high'
    estimated_count INTEGER DEFAULT 0,
    capacity_percentage REAL DEFAULT 0,
    confidence REAL DEFAULT 0.5,
    data_sources INTEGER DEFAULT 0, -- number of user reports contributing
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    FOREIGN KEY (stop_id) REFERENCES stops(id),
    UNIQUE(trip_id, stop_id)
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL, -- emoji or icon name
    category TEXT DEFAULT 'general', -- general, crowd, travel, social
    requirement_type TEXT NOT NULL, -- contributions, streak, points, special
    requirement_value INTEGER DEFAULT 1,
    rarity TEXT DEFAULT 'common' -- common, rare, epic, legendary
);

-- User badges junction
CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (badge_id) REFERENCES badges(id),
    UNIQUE(user_id, badge_id)
);

-- Complaints / Reports
CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    trip_id TEXT,
    bus_id TEXT,
    category TEXT NOT NULL, -- overcrowding, safety, cleanliness, driver_behavior, route_issue, other
    description TEXT NOT NULL,
    image_path TEXT,
    severity TEXT DEFAULT 'medium', -- low, medium, high, critical
    status TEXT DEFAULT 'submitted', -- submitted, under_review, resolved, dismissed
    admin_notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (trip_id) REFERENCES trips(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL, -- bus_approaching, delay, destination_approaching, badge_earned, points_earned, system
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON metadata
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Point transactions
CREATE TABLE IF NOT EXISTS point_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    related_update_id TEXT,
    is_verified INTEGER DEFAULT 0,
    is_permanent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    verified_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User active journeys (tracking which bus a user is currently on)
CREATE TABLE IF NOT EXISTS user_journeys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    trip_id TEXT NOT NULL,
    board_stop_id TEXT NOT NULL,
    deboard_stop_id TEXT, -- destination stop
    boarded_at TEXT DEFAULT (datetime('now')),
    deboarded_at TEXT,
    status TEXT DEFAULT 'active', -- active, completed
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    FOREIGN KEY (board_stop_id) REFERENCES stops(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_updates_trip ON user_updates(trip_id);
CREATE INDEX IF NOT EXISTS idx_user_updates_user ON user_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_crowd_estimates_trip ON crowd_estimates(trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);
