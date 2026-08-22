const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

const { initializeDatabase } = require('./db/database');
const { JWT_SECRET } = require('./middleware/auth');
const NotificationEngine = require('./engines/notifications');
const SimulationEngine = require('./engines/simulation');

// Initialize Express
const app = express();
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
    // Extract token from query string
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            ws.userId = decoded.id;
            NotificationEngine.registerClient(decoded.id, ws);
            ws.send(JSON.stringify({ event: 'connected', message: 'WebSocket connected' }));
        } catch (err) {
            ws.send(JSON.stringify({ event: 'error', message: 'Invalid token' }));
        }
    }

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'ping') {
                ws.send(JSON.stringify({ event: 'pong' }));
            }
        } catch (e) {}
    });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files with no-cache for instant development updates
app.use(express.static(path.join(__dirname, '..', 'public'), {
    setHeaders: (res, path) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));
app.use('/uploads', express.static(path.join(__dirname, '..', 'data', 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/updates', require('./routes/updates'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start
const PORT = process.env.PORT || 3000;

try {
    // Initialize database
    initializeDatabase();

    // Start simulation engine
    SimulationEngine.start(5000); // Tick every 5 seconds

    server.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║   🚌 Smart Transit Crowd Intelligence System             ║
║   ────────────────────────────────────────────────        ║
║   Server running at http://localhost:${PORT}               ║
║   WebSocket at ws://localhost:${PORT}/ws                   ║
║   Simulation engine: ACTIVE                               ║
╚═══════════════════════════════════════════════════════════╝
        `);
    });
} catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
}

// Graceful shutdown
process.on('SIGINT', () => {
    SimulationEngine.stop();
    process.exit(0);
});
