/**
 * PARKWISE - End-to-End Full-Stack Integration Test
 * Phase 2.10: Full Frontend-Backend Integration Verification
 *
 * Boots the Express server on port 5000 and tests the complete
 * API client lifecycle as invoked from the frontend interface:
 * 1. Admin login & session cookie issuance
 * 2. Student login & Bearer token authorization
 * 3. Fetching real-time parking lots from MongoDB
 * 4. Checking in student via QR scan (POST /parking-sessions/scan)
 * 5. Verifying active session and capacity updates in DB
 * 6. Checking out student, calculating reward points, and verifying reward ledger
 * 7. Querying deterministic recommendations for academic destination blocks
 * 8. Retrieving admin dashboard and analytics feeds
 */

import http from 'http';
import app from '../../app.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import User from '../models/User.js';
import ParkingLot from '../models/ParkingLot.js';
import ParkingSession from '../models/ParkingSession.js';
import Reward from '../models/Reward.js';
import { hashPassword } from '../utils/password.js';

let server;
const BACKEND_PORT = 5000;

function request(method, path, { headers = {}, body = null, cookie = null } = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: BACKEND_PORT,
      path: `/api/v1${path}`,
      method,
      headers: { ...headers }
    };

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    if (body) {
      const payload = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(raw);
        } catch (_) {
          json = raw;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runE2ETests() {
  console.log('\n======================================================');
  console.log('PARKWISE FULL-STACK INTEGRATION TEST (PHASE 2.10)');
  console.log('======================================================\n');

  await connectDatabase();

  let serverStarted = false;
  server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Test Server] Server already running on port ${BACKEND_PORT}; testing against live instance.`);
        resolve();
      } else {
        reject(err);
      }
    });
    server.listen(BACKEND_PORT, () => {
      serverStarted = true;
      console.log(`[Test Server] Live Express backend listening on http://127.0.0.1:${BACKEND_PORT}`);
      resolve();
    });
  });

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Ensure test student and admin exist
    await User.deleteMany({ email: { $in: ['e2e.student@campus.edu', 'e2e.admin@campus.edu'] } });

    await User.create({
      fullName: 'E2E Test Student',
      email: 'e2e.student@campus.edu',
      studentId: 'STU-E2E-001',
      password: await hashPassword('StudentPass123'),
      role: 'student',
      rewardPoints: 50,
      vehicles: [{ vehicleNumber: 'PB08-E2E-1234', vehicleType: 'two-wheeler', isPrimary: true }]
    });

    await User.create({
      fullName: 'E2E Transport Administrator',
      email: 'e2e.admin@campus.edu',
      studentId: 'ADM-E2E-001',
      password: await hashPassword('AdminPass123'),
      role: 'admin'
    });

    // Reset Lot C to known capacity
    await ParkingLot.findOneAndUpdate(
      { lotCode: 'C' },
      { totalCapacity: 80, occupiedSpaces: 40, isActive: true }
    );

    // TEST 1: Student Login & Token Receipt
    console.log('\n--- 1. AUTHENTICATION INTEGRATION ---');
    const loginRes = await request('POST', '/auth/login', {
      body: { email: 'e2e.student@campus.edu', password: 'StudentPass123' }
    });
    assert(loginRes.status === 200, 'Student login returns 200');
    assert(loginRes.data.success === true, 'Login response envelopes success: true');
    assert(typeof loginRes.data.data.accessToken === 'string', 'Login returns JWT access token');
    const setCookie = loginRes.headers['set-cookie'] || [];
    assert(setCookie.some((c) => c.includes('refreshToken=')), 'Login sets HttpOnly refresh cookie');

    const studentToken = loginRes.data.data.accessToken;
    const studentAuthHeader = { Authorization: `Bearer ${studentToken}` };

    // TEST 2: Admin Login
    const adminLoginRes = await request('POST', '/auth/login', {
      body: { email: 'e2e.admin@campus.edu', password: 'AdminPass123' }
    });
    assert(adminLoginRes.status === 200, 'Admin login returns 200');
    const adminToken = adminLoginRes.data.data.accessToken;
    const adminAuthHeader = { Authorization: `Bearer ${adminToken}` };

    // TEST 3: Fetch Parking Lots
    console.log('\n--- 2. REAL-TIME PARKING LOTS INTEGRATION ---');
    const lotsRes = await request('GET', '/parking-lots', { headers: studentAuthHeader });
    assert(lotsRes.status === 200, 'GET /parking-lots returns 200');
    assert(lotsRes.data.data.lots.length >= 3, 'Lots collection contains at least 3 university lots');
    const lotC = lotsRes.data.data.lots.find((l) => l.lotCode === 'C');
    assert(lotC.occupiedSpaces === 40, 'Lot C has 40 occupied spaces');
    assert(lotC.availableSpaces === 40, 'Lot C has 40 available spaces (dynamically computed)');
    assert(lotC.availabilityPercentage === 50, 'Lot C availability is 50%');

    // TEST 4: Student QR Check-In Workflow
    console.log('\n--- 3. QR SESSION CHECK-IN & CAPACITY UPDATES ---');
    const checkinRes = await request('POST', '/parking-sessions/scan', {
      headers: studentAuthHeader,
      body: { qrToken: 'PARKWISE-LOT-C', vehicleNumber: 'PB08-E2E-1234' }
    });
    assert(checkinRes.status === 201, 'Check-in responds with 201 Created');
    assert(checkinRes.data.data.action === 'checkin', 'Identified as checkin action');
    assert(checkinRes.data.data.session.status === 'active', 'Created active session');

    // Verify DB update
    const lotCAfterCheckin = await ParkingLot.findOne({ lotCode: 'C' });
    assert(lotCAfterCheckin.occupiedSpaces === 41, 'Lot C occupancy atomically incremented to 41');

    // TEST 5: Active Session Retrieval
    const activeSessionRes = await request('GET', '/parking-sessions/active', { headers: studentAuthHeader });
    assert(activeSessionRes.status === 200, 'GET /parking-sessions/active returns 200');
    assert(activeSessionRes.data.data.session !== null, 'Active session found');
    assert(activeSessionRes.data.data.session.vehicleNumber === 'PB08-E2E-1234', 'Vehicle number recorded correctly');

    // TEST 6: Student QR Check-Out Workflow
    console.log('\n--- 4. QR SESSION CHECK-OUT & REWARD ACCRUAL ---');
    const checkoutRes = await request('POST', '/parking-sessions/scan', {
      headers: studentAuthHeader,
      body: { qrToken: 'PARKWISE-LOT-C' }
    });
    assert(checkoutRes.status === 200, 'Check-out responds with 200 OK');
    assert(checkoutRes.data.data.action === 'checkout', 'Identified as checkout action');
    assert(checkoutRes.data.data.session.status === 'completed', 'Session status marked completed');
    assert(typeof checkoutRes.data.data.pointsEarned === 'number', 'Reward points calculated');

    // Verify lot occupancy returned to 40
    const lotCAfterCheckout = await ParkingLot.findOne({ lotCode: 'C' });
    assert(lotCAfterCheckout.occupiedSpaces === 40, 'Lot C occupancy atomically decremented back to 40');

    // TEST 7: Deterministic Recommendations
    console.log('\n--- 5. DETERMINISTIC RECOMMENDATION ENGINE ---');
    const recRes = await request('GET', '/recommendations?destination=Central+Library', { headers: studentAuthHeader });
    assert(recRes.status === 200, 'GET /recommendations returns 200');
    assert(recRes.data.data.recommendations.length >= 3, 'All lots ranked');
    assert(recRes.data.data.recommendations[0].isRecommended === true, 'Top lot flagged isRecommended');

    // TEST 8: Rewards Summary & Ledger
    console.log('\n--- 6. REWARDS SUMMARY & LEDGER ---');
    const rewardsSummaryRes = await request('GET', '/rewards/summary', { headers: studentAuthHeader });
    assert(rewardsSummaryRes.status === 200, 'GET /rewards/summary returns 200');
    assert(rewardsSummaryRes.data.data.sessionsParked >= 1, 'Records at least 1 completed parking session');

    // TEST 9: Admin Dashboard & Analytics
    console.log('\n--- 7. ADMIN DASHBOARD & ANALYTICS ---');
    const dashRes = await request('GET', '/admin/dashboard', { headers: adminAuthHeader });
    assert(dashRes.status === 200, 'GET /admin/dashboard returns 200');
    assert(dashRes.data.data.overview.totalLots >= 3, 'Overview reports active campus lots');

    const activityRes = await request('GET', '/admin/parking-activity', { headers: adminAuthHeader });
    assert(activityRes.status === 200, 'GET /admin/parking-activity returns 200');
    assert(activityRes.data.data.activity.length >= 1, 'Activity feed records recent check-in/out');

    console.log('\n======================================================');
    console.log(`FULL-STACK E2E INTEGRATION VERIFIED: ${passed}/${total} TESTS PASSED`);
    console.log('======================================================\n');
  } finally {
    await User.deleteMany({ email: { $in: ['e2e.student@campus.edu', 'e2e.admin@campus.edu'] } });
    if (serverStarted && server) await new Promise((r) => server.close(r));
    await disconnectDatabase();
  }
}

runE2ETests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('E2E Test failure:', e);
    process.exit(1);
  });
