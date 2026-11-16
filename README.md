# PARKWISE - Smart Campus Two-Wheeler Parking Management System

## Project Overview
PARKWISE is a full-stack, QR-based smart campus two-wheeler parking management and incentive system. It connects university students, campus transportation authorities, and physical parking zones into an integrated, real-time ecosystem.

### Core Capabilities
- **Real-Time Parking Visibility**: Dynamic lot capacity tracking across campus zones (Lot A, Lot B, Lot C).
- **Deterministic Recommendations**: Multi-factor scoring ($Score = 0.6 \times \text{Availability} + 0.4 \times \text{Distance}$) guiding students to open lots.
- **Incentive Engine**: Automatic reward point accrual for parking in underutilized parking lots.
- **Touchless QR Sessions**: Instant check-in and check-out via parking lot QR codes with atomic capacity updates and single active session enforcement.
- **Interactive Campus Map**: Navigable campus layout with real-time zone occupancy and walking directions.
- **Admin Intelligence Portal**: Real-time traffic feeds, occupancy analytics, peak-hour histograms, and student reward leaderboards.

---

## Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES Modules), esbuild for standalone IIFE browser bundles.
- **Backend**: Node.js (v22+), Express.js (v4.21+), ES Modules.
- **Database**: MongoDB with Mongoose ODM (v8.9+).
- **Security & Session**: JWT (Access Token), HttpOnly SameSite Cookies (Refresh Token Rotation with Family Reuse Detection), Bcrypt, Helmet, CORS, Express Rate Limit, Joi.

---

## Directory Layout
```text
park-system/
├── backend/
│   ├── server.js               # Backend entrypoint (port 5000)
│   ├── app.js                  # Express middleware pipeline and route mounting
│   ├── package.json            # Node.js manifest with dependencies and test scripts
│   ├── src/
│   │   ├── config/             # Database, CORS, and environment configuration
│   │   ├── constants/          # Auth and token policies
│   │   ├── controllers/        # Express route controllers
│   │   ├── docs/               # Technical API documentation
│   │   ├── middleware/         # Auth, RBAC, error handlers, rate limiters
│   │   ├── models/             # Mongoose database models
│   │   ├── routes/             # REST API routes (/api/v1)
│   │   ├── scripts/            # Database seed and automated test suites
│   │   ├── services/           # Core business logic and scoring algorithms
│   │   ├── utils/              # Cryptography, JWT, and password hashing
│   │   └── validators/         # Joi schema validation
├── frontend/
│   ├── index.html              # Landing portal and verification hub
│   ├── login.html              # Student and administrator sign-in
│   ├── register.html           # Student registration
│   ├── build.js                # esbuild bundle builder
│   ├── server.js               # Static frontend server (port 3000)
│   ├── dist/                   # Standalone browser IIFE bundles
│   ├── js/                     # Client application source code
│   │   ├── api/                # API client with token auto-refresh
│   │   ├── components/         # Reusable UI widgets and navigation
│   │   ├── pages/              # Page controllers
│   │   └── services/           # Recommendation and storage services
│   └── tests/                  # Automated UI and bundle verification suites
└── documentation/              # Technical guides and progress tracking
```

---

## Getting Started

### 1. Start MongoDB
Ensure MongoDB is running locally:
```bash
mongod
```

### 2. Seed Database
Initialize campus parking lots, default reward rules, admin, and demo student:
```bash
npm --prefix backend run seed
```

### 3. Start Backend Server
```bash
npm --prefix backend start
```
The REST API runs on `http://localhost:5000/api/v1`.

### 4. Start Frontend
```bash
node frontend/server.js
```
Open `http://localhost:3000` in your web browser.

---

## Automated Test Suites
Run all backend and integration test suites:
```bash
npm --prefix backend test
```

Individual test suites:
- Authentication & Session Lifecycle: `npm --prefix backend run test:auth`
- Full Backend Services (Phases 2.5 - 2.9): `npm --prefix backend run test:backend`
- End-to-End Full-Stack Integration: `npm --prefix backend run test:e2e`
- Frontend Standalone Bundles: `node frontend/tests/verify-bundles.js`
- UI Buttons & Workflows: `node frontend/tests/verify-all-buttons.js`
