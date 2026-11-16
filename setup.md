# PARKWISE - Complete First-Time Device Setup Guide

This guide is designed for a completely new, clean computer that has no developer tools, Node.js, or database services installed. Follow these step-by-step instructions in order to install all prerequisites, configure the environment, and run PARKWISE locally.

---

## Prerequisites Overview

To run PARKWISE, your system needs:
1. **Node.js** (v20.x or v22.x LTS) and **npm** (Node Package Manager).
2. **MongoDB Community Server** (v7.0+ or v8.0+) running locally on `127.0.0.1:27017`.
3. **MongoDB Compass** (Optional graphical user interface for inspecting database collections).
4. **Git** (Optional, for repository management).
5. A web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari).

---

## Step 1: Install Node.js & npm

Node.js executes the backend server, API routes, database scripts, and frontend bundling.

### 1.1 Download Node.js
1. Open your browser and navigate to the official Node.js download portal:
   https://nodejs.org/en/download/
2. Select the **LTS (Long Term Support)** installer for your operating system:
   - **Windows**: Windows Installer (.msi) 64-bit.
   - **macOS**: macOS Installer (.pkg).
   - **Linux**: Install via package manager (`apt`, `dnf`, `pacman`) or NodeSource.

### 1.2 Installation Steps (Windows)
1. Run the downloaded `.msi` setup file.
2. Accept the License Agreement and keep the default destination folder (`C:\Program Files\nodejs\`).
3. On the "Custom Setup" screen, ensure **npm package manager** and **Add to PATH** are checked (enabled by default).
4. Click **Next**, then **Install**.
5. Once complete, click **Finish**.

### 1.3 Verify Installation
Open a new Command Prompt or PowerShell window and run:
```bash
node -v
npm -v
```
You should see output similar to:
```text
v22.14.0
10.9.0
```
If the command is not recognized, restart your computer or restart your terminal window to reload your system PATH.

---

## Step 2: Install and Start MongoDB Community Server

MongoDB is the database where users, parking lots, parking sessions, and reward points are stored.

### 2.1 Download MongoDB Community Server
1. Navigate to the official MongoDB Community Download page:
   https://www.mongodb.com/try/download/community
2. Select the following options:
   - **Version**: Current LTS (e.g. 8.0.x or 7.0.x).
   - **Platform**: Windows (or your OS).
   - **Package**: MSI.
3. Click **Download**.

### 2.2 Installation Steps (Windows)
1. Run the downloaded MongoDB `.msi` file.
2. Choose **Complete** installation setup.
3. On the **Service Configuration** screen:
   - Check **"Install MongoDB as a Service"** (checked by default).
   - Select **"Run service as Network Service user"**.
   - Service Name: `MongoDB`.
   - Data Directory: `C:\Program Files\MongoDB\Server\8.0\data\` (default).
   - Log Directory: `C:\Program Files\MongoDB\Server\8.0\log\` (default).
4. On the next screen, keep **"Install MongoDB Compass"** checked so you have a graphical viewer to inspect your database.
5. Click **Next**, then click **Install**. (Grant Administrator permission if prompted).
6. Click **Finish**.

### 2.3 Verify MongoDB Service is Running
Open PowerShell as Administrator and check the MongoDB service:
```powershell
Get-Service MongoDB
```
The output should display `Status: Running`.

If the service is stopped, start it by running:
```powershell
Start-Service MongoDB
```

*(On macOS/Linux, install via Homebrew or apt and start with `brew services start mongodb-community` or `sudo systemctl start mongod`).*

---

## Step 3: Project Structure & Environment Setup

Navigate to your workspace directory in PowerShell or Terminal:
```bash
cd "C:\Users\<YourUsername>\Desktop\PROJECTS\park system"
```

Verify that the directory contains:
- `backend/` (Express API application)
- `frontend/` (Static client application, HTML, CSS, JavaScript, bundles)
- `documentation/` (Technical documentation and specifications)

---

## Step 4: Install Backend Dependencies

1. Navigate into the `backend` directory:
   ```bash
   cd backend
   ```
2. Install all required Node.js packages:
   ```bash
   npm install
   ```
   This installs Express, Mongoose, bcrypt, jsonwebtoken, Joi, cors, helmet, cookie-parser, dotenv, and express-rate-limit.

### 4.1 Verify or Create Environment File (`backend/.env`)
Ensure a `.env` file exists inside the `backend` directory. If it does not exist, create it with the following content:

```env
# Application Runtime
NODE_ENV=development
PORT=5000

# MongoDB Local Database Connection
MONGODB_URI=mongodb://127.0.0.1:27017/parkwise

# JWT Secret Keys (Replace with your own secure random strings in production)
JWT_ACCESS_SECRET=parkwise_access_token_secret_super_secure_key_12345!
JWT_REFRESH_SECRET=parkwise_refresh_token_secret_super_secure_key_67890!
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS Allowed Origin
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=20
```

---

## Step 5: Seed the Database

Before starting the server, seed the database with the default campus parking zones (Lot A, Lot B, Lot C), reward incentive rules, administrator account, and student account.

From the `backend` directory, run:
```bash
npm run seed
```

Expected output:
```text
[Seed] Starting database seeding process...
[Database] MongoDB connected successfully: 127.0.0.1/parkwise
[Seed] Seeding initial parking lots...
[Seed] ParkingLot LOT A synced
[Seed] ParkingLot LOT B synced
[Seed] ParkingLot LOT C synced
[Seed] Seeding initial reward rules...
[Seed] RewardRule "High Availability Incentive (Underutilized Lot)" synced (20 pts)
[Seed] RewardRule "Moderate Availability Incentive" synced (10 pts)
[Seed] RewardRule "Standard / Peak Zone Parking" synced (0 pts)
[Seed] Seeding default administrator and demo student...
[Seed] Database seeding completed successfully.
```

---

## Step 6: Start the Backend Server

Start the backend in development watch mode:
```bash
npm run dev
```
Or in standard start mode:
```bash
npm start
```

Expected output:
```text
[Server] ParkWise API running in development mode on port 5000
[Server] Health check: http://localhost:5000/api/v1/health
[Database] MongoDB connected successfully: 127.0.0.1/parkwise
```

You can verify the backend is active by opening `http://localhost:5000/api/v1/health` in your web browser. You will see:
```json
{
  "success": true,
  "message": "ParkWise Backend API is healthy and operational.",
  "data": {
    "status": "UP",
    "database": {
      "status": "connected"
    }
  }
}
```

Keep this terminal window running.

---

## Step 7: Launch the Frontend

Open a **second** terminal window and navigate to the project root directory:

```bash
cd "C:\Users\<YourUsername>\Desktop\PROJECTS\park system"
```

Start the built-in frontend server:
```bash
node frontend/server.js
```

Expected output:
```text
[ParkWise Frontend] Server running at http://localhost:3000
[ParkWise Frontend] Serving files from: ...\park system\frontend
```

Now open your web browser and go to:
**http://localhost:3000**

*(Alternative: You can also use the VS Code "Live Server" extension on port 5500, or directly double-click `frontend/index.html` to run via standalone browser bundles).*

---

## Step 8: Default Login Credentials

The system comes pre-configured with two default accounts:

### Campus Administrator Account
- **Portal**: http://localhost:3000/login.html
- **Email**: `admin@campus.edu`
- **Password**: `AdminPass123`
- **Role**: Administrator (Access to Admin Dashboard, Analytics, Zone Management, Simulation Triggers)
- **1-Click Login**: Click the "Admin Demo" button on the login screen.

### University Student Account
- **Portal**: http://localhost:3000/login.html
- **Email**: `alex.rivera@campus.edu`
- **Password**: `StudentPass123`
- **Student ID**: `STU-2024-8841`
- **Vehicle**: `CW-4482` (Two-wheeler)
- **Role**: Student (Access to Find Parking, Recommendations, QR Scanning, My Parking, Rewards)
- **1-Click Login**: Click the "Student Demo" button on the login screen.

---

## Step 9: Run Automated Verification Tests

To verify that the database, authentication, sessions, scoring engine, and admin APIs are operating correctly, open a terminal in the `backend` folder and run:

```bash
npm test
```

This executes all three test suites:
1. `testAuth.js` (Phase 2.4 Token Lifecycle & Reuse Detection: 22 tests)
2. `testFullBackend.js` (Phases 2.5 - 2.9 Parking, Sessions, Recommendations, Rewards, Admin: 47 tests)
3. `testFullIntegration.js` (Phase 2.10 End-to-End Full-Stack Integration: 31 tests)

Expected result:
```text
TOTAL SUITE PASSED: 100/100 TESTS (100% SUCCESS RATE)
```

To verify the frontend browser bundles and UI buttons:
```bash
node frontend/tests/verify-bundles.js
node frontend/tests/verify-all-buttons.js
```

---

## Step 10: Troubleshooting & Common Issues

### Issue 1: `connect ECONNREFUSED 127.0.0.1:27017`
- **Cause**: The local MongoDB service is not started.
- **Solution**:
  - Windows: Open PowerShell as Administrator and run `Start-Service MongoDB`, or open `services.msc` and click "Start" on MongoDB Server.
  - macOS: Run `brew services start mongodb-community`.
  - Linux: Run `sudo systemctl start mongod`.

### Issue 2: `Error: listen EADDRINUSE: address already in use :::5000`
- **Cause**: Another terminal or process is already using port 5000.
- **Solution**:
  - Windows: Find the process using `netstat -ano | findstr :5000` and terminate it using `taskkill /PID <PID> /F`.
  - Alternatively, close the duplicate terminal window running `npm run dev`.

### Issue 3: `Error: listen EADDRINUSE: address already in use :::3000`
- **Cause**: Another process is using port 3000.
- **Solution**: Close the existing node server or run `taskkill /PID <PID> /F` for that port.

### Issue 4: Registration fails with "Passwords do not match" or invalid format
- **Requirement**: Passwords must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number (e.g. `StudentPass123`).
- **Vehicle Registration**: License plates must contain alphanumeric characters, spaces, or hyphens (e.g. `CW-4482`, `PB08-AX-9941`).

---

## Step 11: Rebuilding Frontend Bundles (For Developers)

If you modify any source files in `frontend/js/`, rebuild the standalone browser bundles:
```bash
node frontend/build.js
```
This bundles all 12 page scripts into `frontend/dist/*.bundle.js` using esbuild.
