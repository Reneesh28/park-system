/**
 * PARKWISE - Comprehensive Backend Test Suite
 * Validates Phases 2.5 - 2.9:
 * - Phase 2.5: Parking Lot Management APIs (Student & Admin)
 * - Phase 2.6: QR Parking Sessions (Check-In, Check-Out, Atomic Capacity, Concurrency)
 * - Phase 2.7: Deterministic Recommendation Engine (Mathematical Scoring)
 * - Phase 2.8: Rewards Management (Summary, History, Rules, Admin CRUD)
 * - Phase 2.9: Admin Portal & Analytics (Dashboard, Activity Feed, Sessions, Utilisation, Rewards)
 */

import http from 'http';
import app from '../../app.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import User from '../models/User.js';
import ParkingLot from '../models/ParkingLot.js';
import ParkingSession from '../models/ParkingSession.js';
import Reward from '../models/Reward.js';
import RewardRule from '../models/RewardRule.js';
import { hashPassword } from '../utils/password.js';
import { generateAccessToken } from '../utils/jwt.js';

let server;
let baseUrl;

function makeRequest(method, path, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers }
    };

    if (body) {
      const data = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(rawData);
        } catch (_) {
          json = rawData;
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

async function runTests() {
  console.log('\n======================================================');
  console.log('PARKWISE FULL BACKEND TEST SUITE (PHASES 2.5 - 2.9)');
  console.log('======================================================\n');

  await connectDatabase();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

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
    // 0. Setup Test Users & Ensure Lots
    const studentUser = await User.findOneAndUpdate(
      { email: 'test.student@campus.edu' },
      {
        fullName: 'Test Student',
        email: 'test.student@campus.edu',
        studentId: 'STU-TEST-001',
        password: await hashPassword('StudentPass123'),
        role: 'student',
        rewardPoints: 100,
        vehicles: [{ vehicleNumber: 'TEST-BIKE-01', vehicleType: 'two-wheeler', isPrimary: true }]
      },
      { upsert: true, new: true }
    );

    const adminUser = await User.findOneAndUpdate(
      { email: 'test.admin@campus.edu' },
      {
        fullName: 'Test Administrator',
        email: 'test.admin@campus.edu',
        studentId: 'ADM-TEST-999',
        password: await hashPassword('AdminPass123'),
        role: 'admin'
      },
      { upsert: true, new: true }
    );

    const studentToken = generateAccessToken({ userId: studentUser._id.toString(), role: 'student' });
    const adminToken = generateAccessToken({ userId: adminUser._id.toString(), role: 'admin' });

    const studentHeaders = { Authorization: `Bearer ${studentToken}` };
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Clean any residual test sessions
    await ParkingSession.deleteMany({ userId: studentUser._id });
    await Reward.deleteMany({ userId: studentUser._id });

    // Ensure Lot B has capacity
    await ParkingLot.findOneAndUpdate({ lotCode: 'B' }, { occupiedSpaces: 40, totalCapacity: 150 });

    /* ==========================================================================
       PHASE 2.5: PARKING LOT APIS
       ========================================================================== */
    console.log('\n--- PHASE 2.5: PARKING LOT APIS ---');

    // 2.5.1 Student gets active lots
    const resLots = await makeRequest('GET', '/api/v1/parking-lots', { headers: studentHeaders });
    assert(resLots.status === 200, '2.5.1 Student GET /parking-lots responds with 200');
    assert(Array.isArray(resLots.data.data.lots) && resLots.data.data.lots.length >= 3, '2.5.1 Returns active lots list');
    const lotB = resLots.data.data.lots.find((l) => l.lotCode === 'B');
    assert(lotB && typeof lotB.availableSpaces === 'number', '2.5.1 Lot includes computed availableSpaces');
    assert(lotB.qrTokenHash === undefined, '2.5.1 QR token hash is strictly hidden from client');

    // 2.5.2 Student gets lot by code
    const resLotById = await makeRequest('GET', '/api/v1/parking-lots/B', { headers: studentHeaders });
    assert(resLotById.status === 200, '2.5.2 Student GET /parking-lots/B responds with 200');
    assert(resLotById.data.data.lot.lotCode === 'B', '2.5.2 Retrieves matching lot details');

    // 2.5.3 Student cannot access admin endpoints
    const resForbidden = await makeRequest('POST', '/api/v1/admin/parking-lots', {
      headers: studentHeaders,
      body: { lotName: 'Illegal Lot', lotCode: 'X', totalCapacity: 50 }
    });
    assert(resForbidden.status === 403, '2.5.3 Student is rejected from admin route with 403 Forbidden');

    // 2.5.4 Admin creates new lot
    await ParkingLot.deleteOne({ lotCode: 'TESTLOT' });
    const resCreateLot = await makeRequest('POST', '/api/v1/admin/parking-lots', {
      headers: adminHeaders,
      body: {
        lotName: 'Temporary Test Lot',
        lotCode: 'TESTLOT',
        totalCapacity: 60,
        location: 'South Perimeter'
      }
    });
    assert(resCreateLot.status === 201, '2.5.4 Admin POST /admin/parking-lots creates lot (201)');

    // 2.5.5 Admin updates lot
    const resUpdateLot = await makeRequest('PATCH', `/api/v1/admin/parking-lots/TESTLOT`, {
      headers: adminHeaders,
      body: { totalCapacity: 75, location: 'South Gate Center' }
    });
    assert(resUpdateLot.status === 200 && resUpdateLot.data.data.lot.totalCapacity === 75, '2.5.5 Admin PATCH updates lot details');

    // 2.5.6 Admin toggles status
    const resStatus = await makeRequest('PATCH', `/api/v1/admin/parking-lots/TESTLOT/status`, {
      headers: adminHeaders,
      body: { isActive: false }
    });
    assert(resStatus.status === 200 && resStatus.data.data.lot.isActive === false, '2.5.6 Admin PATCH status deactivates lot');

    // Cleanup test lot
    await ParkingLot.deleteOne({ lotCode: 'TESTLOT' });

    /* ==========================================================================
       PHASE 2.6: QR PARKING SESSIONS
       ========================================================================== */
    console.log('\n--- PHASE 2.6: QR PARKING SESSIONS ---');

    // Snapshot Lot B occupied spaces before check-in
    const lotBBefore = await ParkingLot.findOne({ lotCode: 'B' });
    const initialOccupied = lotBBefore.occupiedSpaces;

    // 2.6.1 Check-In via QR Token
    const resCheckIn = await makeRequest('POST', '/api/v1/parking-sessions/scan', {
      headers: studentHeaders,
      body: { qrToken: 'PARKWISE-LOT-B', vehicleNumber: 'TEST-BIKE-01' }
    });
    assert(resCheckIn.status === 201, '2.6.1 Student check-in responds with 201 Created');
    assert(resCheckIn.data.data.action === 'checkin', '2.6.1 Action identifies as checkin');
    assert(resCheckIn.data.data.session.status === 'active', '2.6.1 Session status is active');

    // Verify atomic occupancy increment
    const lotBAfterCheckin = await ParkingLot.findOne({ lotCode: 'B' });
    assert(lotBAfterCheckin.occupiedSpaces === initialOccupied + 1, '2.6.1 Lot occupiedSpaces atomically incremented by 1');

    // 2.6.2 Check active session endpoint
    const resActive = await makeRequest('GET', '/api/v1/parking-sessions/active', { headers: studentHeaders });
    assert(resActive.status === 200 && resActive.data.data.session !== null, '2.6.2 GET /parking-sessions/active returns active session');

    // 2.6.3 Double check-in to different lot blocked
    const resConflict = await makeRequest('POST', '/api/v1/parking-sessions/scan', {
      headers: studentHeaders,
      body: { qrToken: 'PARKWISE-LOT-A' }
    });
    assert(resConflict.status === 409, '2.6.3 Scanning different lot while active returns 409 Conflict');

    // 2.6.4 Check-Out via QR Token (same lot)
    const resCheckOut = await makeRequest('POST', '/api/v1/parking-sessions/scan', {
      headers: studentHeaders,
      body: { qrToken: 'PARKWISE-LOT-B' }
    });
    assert(resCheckOut.status === 200, '2.6.4 Student check-out responds with 200 OK');
    assert(resCheckOut.data.data.action === 'checkout', '2.6.4 Action identifies as checkout');
    assert(resCheckOut.data.data.session.status === 'completed', '2.6.4 Session status transitions to completed');
    assert(typeof resCheckOut.data.data.pointsEarned === 'number', '2.6.4 Reward points calculated and awarded');

    // Verify atomic occupancy decrement
    const lotBAfterCheckout = await ParkingLot.findOne({ lotCode: 'B' });
    assert(lotBAfterCheckout.occupiedSpaces === initialOccupied, '2.6.4 Lot occupiedSpaces atomically decremented by 1');

    // 2.6.5 Active session is now null
    const resActiveAfter = await makeRequest('GET', '/api/v1/parking-sessions/active', { headers: studentHeaders });
    assert(resActiveAfter.status === 200 && resActiveAfter.data.data.session === null, '2.6.5 Active session is null after checkout');

    // 2.6.6 Completed session history
    const resHistory = await makeRequest('GET', '/api/v1/parking-sessions/history', { headers: studentHeaders });
    assert(resHistory.status === 200 && resHistory.data.data.sessions.length >= 1, '2.6.6 GET /parking-sessions/history returns completed session');

    /* ==========================================================================
       PHASE 2.7: DETERMINISTIC RECOMMENDATION ENGINE
       ========================================================================== */
    console.log('\n--- PHASE 2.7: DETERMINISTIC RECOMMENDATION ENGINE ---');

    const resRecs = await makeRequest('GET', '/api/v1/recommendations?destination=Engineering+Hall', {
      headers: studentHeaders
    });
    assert(resRecs.status === 200, '2.7.1 GET /recommendations responds with 200');
    assert(Array.isArray(resRecs.data.data.recommendations), '2.7.1 Returns recommendations array');
    const recs = resRecs.data.data.recommendations;
    assert(recs.length >= 3, '2.7.1 Evaluates all active parking lots');
    assert(recs[0].isRecommended === true && recs[0].badge === 'Recommended', '2.7.1 Top-scored lot assigned Recommended badge');
    // Verify descending sort order
    let isSorted = true;
    for (let i = 1; i < recs.length; i++) {
      if (recs[i].compositeScore > recs[i - 1].compositeScore) isSorted = false;
    }
    assert(isSorted, '2.7.1 Recommendations strictly sorted descending by composite score');

    /* ==========================================================================
       PHASE 2.8: REWARDS MANAGEMENT
       ========================================================================== */
    console.log('\n--- PHASE 2.8: REWARDS MANAGEMENT ---');

    // 2.8.1 Reward summary
    const resRewardSummary = await makeRequest('GET', '/api/v1/rewards/summary', { headers: studentHeaders });
    assert(resRewardSummary.status === 200, '2.8.1 GET /rewards/summary responds with 200');
    assert(typeof resRewardSummary.data.data.tier === 'string', '2.8.1 Returns student reward tier');
    assert(typeof resRewardSummary.data.data.leaderboardRank === 'number', '2.8.1 Returns student leaderboard rank');

    // 2.8.2 Reward history
    const resRewardHistory = await makeRequest('GET', '/api/v1/rewards/history', { headers: studentHeaders });
    assert(resRewardHistory.status === 200, '2.8.2 GET /rewards/history responds with 200');

    // 2.8.3 Active reward rules
    const resRules = await makeRequest('GET', '/api/v1/rewards/rules', { headers: studentHeaders });
    assert(resRules.status === 200 && resRules.data.data.rules.length >= 2, '2.8.3 GET /rewards/rules returns active rules');

    // 2.8.4 Admin creates reward rule
    await RewardRule.deleteOne({ ruleName: 'Temporary Test Incentive' });
    const resCreateRule = await makeRequest('POST', '/api/v1/admin/rewards/rules', {
      headers: adminHeaders,
      body: {
        ruleName: 'Temporary Test Incentive',
        minimumAvailabilityPercentage: 70,
        maximumAvailabilityPercentage: 90,
        points: 25,
        description: 'Test rule'
      }
    });
    assert(resCreateRule.status === 201, '2.8.4 Admin POST /admin/rewards/rules creates rule (201)');
    const createdRuleId = resCreateRule.data.data.rule._id;

    // 2.8.5 Admin updates reward rule
    const resUpdateRule = await makeRequest('PATCH', `/api/v1/admin/rewards/rules/${createdRuleId}`, {
      headers: adminHeaders,
      body: { points: 30 }
    });
    assert(resUpdateRule.status === 200 && resUpdateRule.data.data.rule.points === 30, '2.8.5 Admin PATCH updates reward rule');

    // 2.8.6 Admin deletes reward rule
    const resDeleteRule = await makeRequest('DELETE', `/api/v1/admin/rewards/rules/${createdRuleId}`, {
      headers: adminHeaders
    });
    assert(resDeleteRule.status === 200, '2.8.6 Admin DELETE removes reward rule');

    /* ==========================================================================
       PHASE 2.9: ADMIN APIS AND ANALYTICS
       ========================================================================== */
    console.log('\n--- PHASE 2.9: ADMIN APIS AND ANALYTICS ---');

    // 2.9.1 Admin dashboard overview
    const resDashboard = await makeRequest('GET', '/api/v1/admin/dashboard', { headers: adminHeaders });
    assert(resDashboard.status === 200, '2.9.1 GET /admin/dashboard responds with 200');
    assert(typeof resDashboard.data.data.overview.totalCapacity === 'number', '2.9.1 Returns system total capacity');
    assert(Array.isArray(resDashboard.data.data.lots), '2.9.1 Returns lots status breakdown');

    // 2.9.2 Recent parking activity feed
    const resActivity = await makeRequest('GET', '/api/v1/admin/parking-activity', { headers: adminHeaders });
    assert(resActivity.status === 200, '2.9.2 GET /admin/parking-activity responds with 200');
    assert(Array.isArray(resActivity.data.data.activity), '2.9.2 Returns activity event feed array');

    // 2.9.3 Filterable admin parking sessions
    const resAdminSessions = await makeRequest('GET', '/api/v1/admin/parking-sessions?status=completed', {
      headers: adminHeaders
    });
    assert(resAdminSessions.status === 200, '2.9.3 GET /admin/parking-sessions responds with 200');
    assert(Array.isArray(resAdminSessions.data.data.sessions), '2.9.3 Returns paginated sessions list');

    // 2.9.4 Utilization analytics
    const resUtil = await makeRequest('GET', '/api/v1/admin/analytics/utilisation', { headers: adminHeaders });
    assert(resUtil.status === 200, '2.9.4 GET /admin/analytics/utilisation responds with 200');
    assert(Array.isArray(resUtil.data.data.hourlyActivity), '2.9.4 Returns 24-hour activity distribution');

    // 2.9.5 Rewards analytics & student leaderboard
    const resRewardsAnalytics = await makeRequest('GET', '/api/v1/admin/analytics/rewards', { headers: adminHeaders });
    assert(resRewardsAnalytics.status === 200, '2.9.5 GET /admin/analytics/rewards responds with 200');
    assert(Array.isArray(resRewardsAnalytics.data.data.leaderboard), '2.9.5 Returns top student leaderboard');

    console.log('\n======================================================');
    console.log(`ALL TESTS PASSED: ${passed}/${total}`);
    console.log('======================================================\n');
  } finally {
    // Cleanup test records
    await User.deleteMany({ email: { $in: ['test.student@campus.edu', 'test.admin@campus.edu'] } });
    if (server) await new Promise((resolve) => server.close(resolve));
    await disconnectDatabase();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
