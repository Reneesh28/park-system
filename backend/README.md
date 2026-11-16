# PARKWISE — Backend API

Backend REST API for the **PARKWISE** QR-Based Smart Campus Two-Wheeler Parking Management System.

## Technology Stack
- **Runtime**: Node.js (v22+)
- **Framework**: Express.js (v4.21+)
- **Database**: MongoDB with Mongoose (v8.9+)
- **Module System**: ECMAScript Modules (`"type": "module"`)
- **Security & Utilities**: Helmet, CORS, Cookie-Parser, Express-Rate-Limit, Dotenv, Joi, Bcrypt, JsonWebToken

## Directory Layout
```text
backend/
├── server.js               # Server entry point & graceful shutdown
├── app.js                  # Express middleware & route mounting
├── package.json            # Node.js manifest
├── .env                    # Environment variables (git-ignored)
├── .env.example            # Environment template
└── src/
    ├── config/             # Environment, Database, and CORS configs
    ├── models/             # Mongoose schemas (Phase 2.2)
    ├── controllers/        # Route controllers (Phase 2.3+)
    ├── routes/             # Express API route modules
    ├── services/           # Business logic layer (Phase 2.3+)
    ├── middleware/         # Error handler, 404, and Rate limiting
    ├── validators/         # Joi validation schemas (Phase 2.3+)
    ├── utils/              # Helper utilities
    ├── constants/          # Application constants
    └── docs/               # API documentation
```

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Verify or update `.env` using `.env.example` as a template:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/parkwise
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
FRONTEND_URL=http://127.0.0.1:5500
```

### 3. Run the Server
- Development mode (with file watcher):
  ```bash
  npm run dev
  ```
- Production mode:
  ```bash
  npm start
  ```

### 4. Health Check
Open your browser or HTTP client:
```text
GET http://localhost:5000/api/v1/health
```
Response:
```json
{
  "success": true,
  "message": "ParkWise API is running",
  "data": {
    "status": "healthy"
  }
}
```
