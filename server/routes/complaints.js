const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const GamificationEngine = require('../engines/gamification');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', '..', 'data', 'uploads');
        const fs = require('fs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `complaint-${uuidv4()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

const router = express.Router();

// POST /api/complaints - Submit a complaint
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
    try {
        const { tripId, busId, category, description, severity } = req.body;
        const userId = req.user.id;

        if (!category || !description) {
            return res.status(400).json({ error: 'Category and description are required' });
        }

        const validCategories = ['overcrowding', 'safety', 'cleanliness', 'driver_behavior', 'route_issue', 'other'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const db = getDb();
        const id = uuidv4();
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        db.prepare(`
            INSERT INTO complaints (id, user_id, trip_id, bus_id, category, description, image_path, severity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, userId, tripId || null, busId || null, category, description, imagePath, severity || 'medium');

        // Award points
        GamificationEngine.awardPoints(userId, 'complaint');

        res.status(201).json({
            message: 'Complaint submitted successfully',
            complaint: { id, category, description, image_path: imagePath, status: 'submitted' }
        });
    } catch (err) {
        console.error('Complaint error:', err);
        res.status(500).json({ error: 'Failed to submit complaint' });
    }
});

// GET /api/complaints - Get user's complaints
router.get('/', authenticateToken, (req, res) => {
    const db = getDb();
    const complaints = db.prepare(`
        SELECT c.*, r.name as route_name, r.route_number
        FROM complaints c
        LEFT JOIN trips t ON c.trip_id = t.id
        LEFT JOIN routes r ON t.route_id = r.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
    `).all(req.user.id);

    res.json({ complaints });
});

// GET /api/complaints/:id - Get complaint details
router.get('/:id', authenticateToken, (req, res) => {
    const db = getDb();
    const complaint = db.prepare(`
        SELECT c.*, r.name as route_name, r.route_number, b.bus_number
        FROM complaints c
        LEFT JOIN trips t ON c.trip_id = t.id
        LEFT JOIN routes r ON t.route_id = r.id
        LEFT JOIN buses b ON c.bus_id = b.id
        WHERE c.id = ? AND c.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({ complaint });
});

// GET /api/complaints/categories/list - Get complaint categories
router.get('/categories/list', (req, res) => {
    res.json({
        categories: [
            { id: 'overcrowding', label: 'Overcrowding', icon: '👥', description: 'Bus is overcrowded beyond safe limits' },
            { id: 'safety', label: 'Safety Concern', icon: '⚠️', description: 'Safety hazard or dangerous situation' },
            { id: 'cleanliness', label: 'Cleanliness', icon: '🧹', description: 'Bus is dirty or unhygienic' },
            { id: 'driver_behavior', label: 'Driver Behavior', icon: '🚗', description: 'Reckless driving or unprofessional conduct' },
            { id: 'route_issue', label: 'Route Issue', icon: '🗺️', description: 'Bus not following the designated route' },
            { id: 'other', label: 'Other', icon: '📝', description: 'Any other issue not listed above' }
        ]
    });
});

module.exports = router;
