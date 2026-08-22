# 🚌 Lumina Transit — Smart Public Transport Crowd Intelligence & Passenger Assistance System

> **Real-Time Crowd Intelligence, Predictive ETA & Commuter Gamification for Bengaluru (BMTC) Transit Network**

---

## 🌟 Overview
**Lumina Transit** is a smart urban transit intelligence platform designed to eliminate overcrowding, delays, and unpredictability in public bus transit systems. Built with a high-contrast Glassmorphism HUD design system, it combines real-time GPS telemetry, crowd-sourced intelligence, multi-factor verification, predictive arrival estimates, and commuter gamification.

---

## 🚀 Key Features

### 1. 🔐 Commuter Onboarding & Instant Demo Access
- Secure JWT authentication with persistent session state.
- **1-Click Quick Demo Login** (`karthik@demo.in`) pre-loaded with contributor badges and points.
- Instant fallback validation preventing stale token lockouts.

### 2. 🗺️ Intelligent Route Search & Live Bengaluru Map
- Interactive Leaflet dark-matter HUD map centered on Bengaluru's transit hub (Majestic).
- Real-time GPS location detection.
- One-tap quick destinations (Silk Institute, Kengeri TTMC, Yeshwanthpur TTMC, Electronic City, Whitefield, etc.).
- Dynamic route polyline rendering with arrival ETAs, fares, and crowd level indicators:
  - 🟢 **Low Crowd** (Plenty of Seats)
  - 🟡 **Medium Crowd** (Standing Room)
  - 🔴 **High Crowd** (Very Crowded)

### 3. ⏱️ Live Journey Tracking & Telemetry Drawer
- Live bus location simulation updating every 5 seconds.
- Interactive expandable bottom sheet tracking upcoming stops, real-time delays, and remaining distances.
- Proactive destination proximity alerts and sound/haptic notifications.

### 4. 👥 Crowd-Sourced Intelligence & Feedback
- Commuters can report boarding, de-boarding, and crowd density.
- Confidence scoring algorithm to eliminate spam and verify data points.

### 5. 🏆 Gamification, Badges & Leaderboard
- Contributor points, streak counters, and tier levels (Commuter → Contributor → Expert → Legend).
- Unlockable badges (e.g., *First Ride*, *Namma Commuter*, *Weekly Warrior*, *Century Club*).
- Live commuter rankings leaderboard.

### 6. 🚨 Incident & Complaint Reporting
- Category-based report submission (Overcrowding, Safety, Driver Behavior, Cleanliness, Delay).
- Image upload support with severity triage.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS (High-Contrast Glassmorphism HUD design system), Tailwind CSS utility tokens, Material Symbols, Leaflet.js Maps.
- **Backend**: Node.js, Express.js, WebSocket (`ws`) for real-time proactive alerts.
- **Data & Storage**: Persistent In-Memory Database engine with JSON store, bcrypt password hashing, JWT authentication.
- **Simulation**: Background real-time vehicle movement and telemetry simulation engine.

---

## 📦 Getting Started (Run Locally)

### 1. Prerequisites
- **Node.js** (v16+ recommended)
- **npm**

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/kharjun9-ops/smart-transport.git
cd smart-transport
npm install
```

### 3. Start the Server
```bash
npm start
```
Or with auto-reload:
```bash
npm run dev
```

### 4. Open in Browser
Visit **`http://localhost:3000`** in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Demo Contributor** | `karthik@demo.in` | `password123` |
| **Quick Access** | Click **"Quick Demo Login (Karthik R.)"** on the sign-in screen |

---

## 📁 Project Structure

```
├── public/
│   ├── css/
│   │   └── index.css             # Glassmorphism HUD theme & styling
│   ├── js/
│   │   ├── app.js                # Main router & state controller
│   │   ├── utils/
│   │   │   ├── api.js            # API client
│   │   │   ├── map.js            # Leaflet map helpers
│   │   │   └── notifications.js  # WebSocket & toast notification client
│   │   └── views/
│   │       ├── auth.js           # Login & Register views
│   │       ├── home.js           # Bengaluru Map & destination search
│   │       ├── trips.js          # Live trip telemetry & drawer
│   │       ├── gamification.js   # Leaderboard & badges
│   │       ├── complaints.js     # Incident reporting
│   │       └── profile.js        # Passenger profile
│   └── index.html                # App shell
├── server/
│   ├── db/
│   │   ├── database.js           # In-memory DB with disk persistence
│   │   ├── schema.sql            # Schema definitions
│   │   └── seed.sql              # Bengaluru BMTC seed routes & stops
│   ├── engines/
│   │   ├── crowdIntelligence.js  # Crowd estimation algorithms
│   │   ├── eta.js                # ETA & delay calculation engine
│   │   ├── gamification.js       # Points & badge rules
│   │   ├── notifications.js      # WebSocket notification dispatcher
│   │   ├── simulation.js         # Real-time transit simulation
│   │   └── verification.js       # Crowd report verification logic
│   ├── middleware/
│   │   └── auth.js               # JWT verification
│   ├── routes/                   # REST API endpoints
│   └── index.js                  # Server entrypoint
├── .gitignore
├── package.json
└── README.md
```

---

## 👥 Contributors
Developed for **Omni Hackathon** by **kharjun9-ops**.
