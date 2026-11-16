/**
 * PARKWISE - Comprehensive Authentication & Refresh Token Test Suite
 * Phase 2.4: Refresh Token Management and Session Lifecycle
 */

import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import { env } from '../config/environment.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { hashToken } from '../utils/token.js';

let server;
let baseUrl;

/**
 * Extracts cookies from 'set-cookie' header array.
 * @param {Response} res 
 * @returns {Record<string, { value: string, raw: string, httpOnly: boolean, path: string }>}
 */
function parseSetCookieHeaders(res) {
  const cookieHeaders = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean);
  const parsed = {};

  for (const raw of cookieHeaders) {
    if (!raw) continue;
    const parts = raw.split(';').map((p) => p.trim());
    const [nameVal, ...attrs] = parts;
    const [name, val] = nameVal.split('=');
    const isHttpOnly = attrs.some((a) => a.toLowerCase() === 'httponly');
    const pathAttr = attrs.find((a) => a.toLowerCase().startsWith('path='));
    const path = pathAttr ? pathAttr.split('=')[1] : '';

    parsed[name] = {
      value: val,
      raw,
      httpOnly: isHttpOnly,
      path
    };
  }
  return parsed;
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  const cookies = parseSetCookieHeaders(res);
  const data = await res.json().catch(() => null);
  return { status: res.status, data, cookies, headers: res.headers };
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('PARKWISE PHASE 2.4 AUTHENTICATION & SESSION TEST SUITE');
  console.log('======================================================\n');

  await connectDatabase();

  // Clean test accounts before starting
  await User.deleteMany({
    email: {
      $in: [
        'student.test@campus.edu',
        'inactive.student@campus.edu',
        'reneesh@university.edu',
        'student.two@university.edu'
      ]
    }
  });

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(5099, () => {
      baseUrl = 'http://localhost:5099';
      resolve();
    });
  });

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, testName, detail = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName} - ${detail}`);
    }
  }

  try {
    // ------------------------------------------------------------------------
    // 1. REGISTRATION BASELINE
    // ------------------------------------------------------------------------
    console.log('--- 1. USER REGISTRATION BASELINE ---');

    const regRes = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Reneesh Kumar',
        email: 'reneesh@university.edu',
        studentId: 'STU-2026-9001',
        password: 'Password123',
        confirmPassword: 'Password123',
        vehicleNumber: 'AP-02-AB-1234'
      })
    });
    assert(regRes.status === 201, '1.1 Student Registration succeeds (201)');

    const regUserTwo = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Second Student',
        email: 'student.two@university.edu',
        studentId: 'STU-2026-9002',
        password: 'Password123',
        confirmPassword: 'Password123',
        vehicleNumber: 'AP-02-AB-5678'
      })
    });
    assert(regUserTwo.status === 201, '1.2 Second Student Registration succeeds (201)');

    // ------------------------------------------------------------------------
    // 2. LOGIN & REFRESH TOKEN COOKIE ISSUANCE
    // ------------------------------------------------------------------------
    console.log('\n--- 2. LOGIN & REFRESH TOKEN ISSUANCE ---');

    const loginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'reneesh@university.edu',
        password: 'Password123'
      })
    });

    const initialAccessToken = loginRes.data?.data?.accessToken;
    const initialRefreshCookie = loginRes.cookies['refreshToken'];
    const initialRawRefreshToken = initialRefreshCookie?.value;

    assert(
      loginRes.status === 200 &&
      loginRes.data.success === true &&
      typeof initialAccessToken === 'string' &&
      loginRes.data.data.refreshToken === undefined &&
      loginRes.data.data.rawRefreshToken === undefined,
      '2.1 Successful login returns access token and omits raw refresh token from JSON response'
    );

    assert(
      Boolean(initialRefreshCookie) &&
      initialRefreshCookie.httpOnly === true &&
      initialRefreshCookie.path === '/api/v1/auth',
      '2.2 Login sets secure HttpOnly cookie on path /api/v1/auth'
    );

    // Verify database record stored as hash, not plaintext
    const initialHash = hashToken(initialRawRefreshToken);
    const storedTokenDoc = await RefreshToken.findOne({ tokenHash: initialHash });
    assert(
      Boolean(storedTokenDoc) &&
      storedTokenDoc.revokedAt === null &&
      storedTokenDoc.tokenHash === initialHash,
      '2.3 Refresh token stored in MongoDB as SHA-256 hash (raw token never stored)'
    );

    // ------------------------------------------------------------------------
    // 3. REFRESH & TOKEN ROTATION
    // ------------------------------------------------------------------------
    console.log('\n--- 3. REFRESH & TOKEN ROTATION ---');

    // Case 3.1: Valid refresh token produces fresh access token & rotated refresh token
    const refreshRes1 = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: `refreshToken=${initialRawRefreshToken}`
      }
    });

    const rotatedAccessToken1 = refreshRes1.data?.data?.accessToken;
    const rotatedRefreshCookie1 = refreshRes1.cookies['refreshToken'];
    const rotatedRawToken1 = rotatedRefreshCookie1?.value;

    assert(
      refreshRes1.status === 200 &&
      refreshRes1.data.success === true &&
      typeof rotatedAccessToken1 === 'string' &&
      Boolean(rotatedRawToken1) &&
      rotatedRawToken1 !== initialRawRefreshToken,
      '3.1 Refresh endpoint rotates token: issues fresh access token & distinct new refresh token cookie'
    );

    // Verify old token is marked revoked and linked to replacement in database
    const oldTokenDoc = await RefreshToken.findOne({ tokenHash: initialHash });
    const newTokenDoc = await RefreshToken.findOne({ tokenHash: hashToken(rotatedRawToken1) });

    assert(
      oldTokenDoc.revokedAt !== null &&
      String(oldTokenDoc.replacedByTokenId) === String(newTokenDoc._id),
      '3.2 Old refresh token document is revoked and linked via replacedByTokenId'
    );

    assert(
      String(oldTokenDoc.familyId) === String(newTokenDoc.familyId),
      '3.3 Rotated token inherits the same familyId lineage'
    );

    // Case 3.2: Missing refresh cookie is rejected
    const missingCookieRes = await request('/api/v1/auth/refresh', {
      method: 'POST'
    });
    assert(
      missingCookieRes.status === 401 && missingCookieRes.data.success === false,
      '3.4 Missing refresh cookie is rejected with 401'
    );

    // Case 3.3: Invalid / forged refresh token is rejected
    const invalidTokenRes = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: 'refreshToken=forged_invalid_token_12345'
      }
    });
    assert(
      invalidTokenRes.status === 401 && invalidTokenRes.data.success === false,
      '3.5 Forged or non-existent refresh token is rejected with 401'
    );

    // Case 3.4: Expired refresh token is rejected
    const expiredDoc = await RefreshToken.create({
      userId: storedTokenDoc.userId,
      tokenHash: hashToken('expired_raw_token_xyz'),
      familyId: 'family_expired_test',
      expiresAt: new Date(Date.now() - 60000) // 1 minute in the past
    });

    const expiredRes = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: 'refreshToken=expired_raw_token_xyz'
      }
    });
    assert(
      expiredRes.status === 401 && expiredRes.data.message.includes('expired'),
      '3.6 Expired refresh token is rejected with 401'
    );

    // ------------------------------------------------------------------------
    // 4. REUSE DETECTION & CASCADING REVOCATION
    // ------------------------------------------------------------------------
    console.log('\n--- 4. REUSE DETECTION & SESSION REVOCATION ---');

    // Create a parallel independent session for Student Two (Family B)
    const loginUserTwo = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'student.two@university.edu',
        password: 'Password123'
      })
    });
    const userTwoRawToken = loginUserTwo.cookies['refreshToken']?.value;
    const userTwoTokenHash = hashToken(userTwoRawToken);
    const userTwoTokenDoc = await RefreshToken.findOne({ tokenHash: userTwoTokenHash });

    // Attacker or replay attempt: Present old initialRawRefreshToken (which was already rotated in 3.1)
    const reuseAttemptRes = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: `refreshToken=${initialRawRefreshToken}`
      }
    });

    assert(
      reuseAttemptRes.status === 401 &&
      reuseAttemptRes.data.message.includes('reuse detected'),
      '4.1 Reusing a previously rotated token is rejected with reuse detection alert (401)'
    );

    // Verify all active tokens in Reneesh's family are now revoked
    const activeTokensInFamily = await RefreshToken.find({
      familyId: oldTokenDoc.familyId,
      revokedAt: null
    });
    assert(
      activeTokensInFamily.length === 0,
      '4.2 Reuse detection cascaded revocation to all active tokens in the compromised family'
    );

    // Verify Student Two's independent token family was NOT revoked
    const userTwoDocAfter = await RefreshToken.findById(userTwoTokenDoc._id);
    assert(
      userTwoDocAfter.revokedAt === null,
      '4.3 Independent token family for other users/sessions remains active and unaffected'
    );

    // Verify that the rotated token from Reneesh's compromised family is now rejected
    const compromisedTokenRes = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: `refreshToken=${rotatedRawToken1}`
      }
    });
    assert(
      compromisedTokenRes.status === 401,
      '4.4 Previously active token in compromised family is now rejected'
    );

    // ------------------------------------------------------------------------
    // 5. ATOMIC ROTATION & CONCURRENCY SAFEGUARDS
    // ------------------------------------------------------------------------
    console.log('\n--- 5. CONCURRENCY & ATOMIC ROTATION ---');

    // Login Reneesh fresh to get a clean active refresh token
    const freshLogin = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'reneesh@university.edu',
        password: 'Password123'
      })
    });
    const concurrentRawToken = freshLogin.cookies['refreshToken']?.value;

    // Simulate 2 simultaneous refresh requests using the exact same token
    const [concurrentRes1, concurrentRes2] = await Promise.all([
      request('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { Cookie: `refreshToken=${concurrentRawToken}` }
      }),
      request('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { Cookie: `refreshToken=${concurrentRawToken}` }
      })
    ]);

    const statuses = [concurrentRes1.status, concurrentRes2.status];
    const hasOneSuccess = statuses.filter((s) => s === 200).length === 1;
    const hasOneFailure = statuses.filter((s) => s === 401).length === 1;

    assert(
      hasOneSuccess && hasOneFailure,
      '5.1 Simultaneous refresh requests: exactly one request rotates successfully; the concurrent attempt is safely rejected'
    );

    // ------------------------------------------------------------------------
    // 6. LOGOUT & COOKIE CLEARING
    // ------------------------------------------------------------------------
    console.log('\n--- 6. LOGOUT & SESSION TERMINATION ---');

    // Login Student Two fresh
    const logoutLogin = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'student.two@university.edu',
        password: 'Password123'
      })
    });
    const logoutRawToken = logoutLogin.cookies['refreshToken']?.value;
    const logoutTokenHash = hashToken(logoutRawToken);

    // Execute logout
    const logoutRes = await request('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        Cookie: `refreshToken=${logoutRawToken}`
      }
    });

    const logoutClearedCookie = logoutRes.cookies['refreshToken'];
    assert(
      logoutRes.status === 200 && logoutRes.data.success === true,
      '6.1 Logout endpoint responds with 200 success'
    );

    assert(
      Boolean(logoutClearedCookie) &&
      (logoutClearedCookie.value === '' || logoutClearedCookie.raw.includes('Max-Age=0') || logoutClearedCookie.raw.includes('Expires=')),
      '6.2 Logout clears the refresh token cookie'
    );

    // Verify token marked revoked in database
    const revokedLogoutDoc = await RefreshToken.findOne({ tokenHash: logoutTokenHash });
    assert(
      Boolean(revokedLogoutDoc) && revokedLogoutDoc.revokedAt !== null,
      '6.3 Refresh token marked revoked in MongoDB upon logout'
    );

    // Attempting to refresh with the logged-out token is rejected
    const postLogoutRefresh = await request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: `refreshToken=${logoutRawToken}`
      }
    });
    assert(
      postLogoutRefresh.status === 401,
      '6.4 Attempting to refresh with a logged-out token is rejected'
    );

    // Logout with missing cookie is safe and does not error
    const noCookieLogout = await request('/api/v1/auth/logout', { method: 'POST' });
    assert(
      noCookieLogout.status === 200,
      '6.5 Logout without cookie completes cleanly without error (200)'
    );

    // ------------------------------------------------------------------------
    // 7. INACTIVE USER ACCESS & REFRESH REJECTION
    // ------------------------------------------------------------------------
    console.log('\n--- 7. INACTIVE USER CHECKS ---');

    // Deactivate Student Two in MongoDB
    await User.updateOne({ email: 'student.two@university.edu' }, { isActive: false });

    // Attempting to login with inactive user -> 403
    const inactiveLogin = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'student.two@university.edu',
        password: 'Password123'
      })
    });
    assert(
      inactiveLogin.status === 403,
      '7.1 Deactivated user cannot log in (403)'
    );

    // ------------------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------------------
    await User.deleteMany({
      email: {
        $in: [
          'reneesh@university.edu',
          'student.two@university.edu'
        ]
      }
    });
    await RefreshToken.deleteMany({});
    console.log('\n[Cleanup] Test accounts and tokens purged from database.');

  } finally {
    server.close();
    await disconnectDatabase();
  }

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('[Test Error]', err);
  process.exit(1);
});
