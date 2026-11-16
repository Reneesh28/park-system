/**
 * PARKWISE - Authentication Business Service
 * Phase 2.4: Refresh Token Management and Session Lifecycle
 */

import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken } from '../utils/jwt.js';
import { generateRefreshToken, hashToken, generateFamilyId } from '../utils/token.js';
import { REFRESH_TOKEN_EXPIRY_MS } from '../constants/auth.js';

/**
 * Format a user document into a safe response object,
 * ensuring no sensitive data or internal attributes are exposed.
 * @param {Object} user 
 * @returns {Object}
 */
export function formatSafeUser(user) {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.__v;

  return {
    id: userObj._id ? userObj._id.toString() : userObj.id,
    fullName: userObj.fullName,
    email: userObj.email,
    studentId: userObj.studentId,
    role: userObj.role,
    vehicles: userObj.vehicles || [],
    rewardPoints: userObj.rewardPoints ?? 0,
    isActive: userObj.isActive ?? true,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt
  };
}

/**
 * Custom error helper for application-level HTTP errors.
 */
export class AppError extends Error {
  constructor(message, statusCode, errors = [], shouldClearCookie = false) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.shouldClearCookie = shouldClearCookie;
  }
}

/**
 * Register a new student account.
 * 
 * @param {Object} registrationData
 * @returns {Promise<Object>} Safe user record
 */
export async function registerUser({ fullName, email, studentId, password, vehicleNumber }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedStudentId = studentId.trim().toUpperCase();

  // 1. Check for existing email
  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    throw new AppError('An account with this email address already exists.', 409, [
      { field: 'email', reason: 'Email already registered' }
    ]);
  }

  // 2. Check for existing studentId
  const existingStudent = await User.findOne({ studentId: normalizedStudentId });
  if (existingStudent) {
    throw new AppError('An account with this Student ID already exists.', 409, [
      { field: 'studentId', reason: 'Student ID already registered' }
    ]);
  }

  // 3. Hash password using bcrypt
  const hashedPassword = await hashPassword(password);

  // 4. Construct user document with strictly enforced defaults
  // Role is IMMUTABLY set to 'student'; public registration cannot elevate permissions.
  const newUser = new User({
    fullName: fullName.trim(),
    email: normalizedEmail,
    studentId: normalizedStudentId,
    password: hashedPassword,
    role: 'student',
    rewardPoints: 0,
    isActive: true,
    vehicles: [
      {
        vehicleNumber,
        vehicleType: 'two-wheeler',
        isPrimary: true
      }
    ]
  });

  try {
    const savedUser = await newUser.save();
    return formatSafeUser(savedUser);
  } catch (dbError) {
    if (dbError.code === 11000) {
      const duplicateField = Object.keys(dbError.keyPattern || {})[0] || 'account';
      throw new AppError(
        `An account with this ${duplicateField} already exists.`,
        409,
        [{ field: duplicateField, reason: 'Duplicate entry detected' }]
      );
    }
    throw dbError;
  }
}

/**
 * Authenticate student or administrator with credentials.
 * Generates both an access token and a persisted refresh token.
 * 
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<Object>} { user: SafeUser, accessToken: string, rawRefreshToken: string, refreshExpiryMs: number }
 */
export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Fetch user by email, explicitly including password field (select: false in schema)
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  // Generic authentication failure message to protect against user enumeration
  const invalidCredentialsError = new AppError('Invalid email or password.', 401, [
    { field: 'credentials', reason: 'Authentication failed' }
  ]);

  if (!user) {
    throw invalidCredentialsError;
  }

  // 2. Verify account is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact campus administration.', 403, [
      { field: 'account', reason: 'Account suspended or deactivated' }
    ]);
  }

  // 3. Compare password with bcrypt hash
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw invalidCredentialsError;
  }

  // 4. Generate short-lived JWT access token
  const accessToken = generateAccessToken(user);

  // 5. Generate cryptographically secure refresh token & family lineage
  const { rawToken: rawRefreshToken, tokenHash } = generateRefreshToken();
  const familyId = generateFamilyId();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  // 6. Persist refresh token hash to MongoDB
  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    familyId,
    expiresAt
  });

  return {
    user: formatSafeUser(user),
    accessToken,
    rawRefreshToken,
    refreshExpiryMs: REFRESH_TOKEN_EXPIRY_MS
  };
}

/**
 * Rotate an existing refresh token and issue a fresh access token & refresh token.
 * Detects token reuse (compromise) and cascades revocation across the family.
 * 
 * @param {string} rawToken - Plaintext refresh token from HttpOnly cookie
 * @returns {Promise<Object>} { user: SafeUser, accessToken, rawRefreshToken, refreshExpiryMs }
 */
export async function rotateRefreshToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new AppError('Refresh token is required. Please log in.', 401, [
      { field: 'refreshToken', reason: 'Missing refresh token cookie' }
    ]);
  }

  const tokenHash = hashToken(rawToken);

  // 1. Locate the token record in MongoDB
  const existingToken = await RefreshToken.findOne({ tokenHash });

  if (!existingToken) {
    throw new AppError(
      'Invalid or expired refresh token. Please log in again.',
      401,
      [{ field: 'refreshToken', reason: 'Token record not found' }],
      true
    );
  }

  // 2. REUSE DETECTION:
  // If an already-revoked refresh token is presented, suspect token theft/replay attack.
  // Immediately revoke ALL active tokens in this family lineage!
  if (existingToken.revokedAt) {
    await RefreshToken.updateMany(
      { familyId: existingToken.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    throw new AppError(
      'Invalid refresh token reuse detected. All sessions in this lineage have been terminated for security. Please log in again.',
      401,
      [{ field: 'refreshToken', reason: 'Revoked token presented again (reuse attack detected)' }],
      true
    );
  }

  // 3. Expiration Check
  if (existingToken.expiresAt <= new Date()) {
    throw new AppError(
      'Refresh token has expired. Please log in again.',
      401,
      [{ field: 'refreshToken', reason: 'Token expired' }],
      true
    );
  }

  // 4. Validate associated user account
  const user = await User.findById(existingToken.userId);
  if (!user) {
    throw new AppError(
      'User account associated with this session no longer exists.',
      401,
      [{ field: 'user', reason: 'User not found' }],
      true
    );
  }

  if (!user.isActive) {
    throw new AppError(
      'Your account has been deactivated. Please contact campus administration.',
      403,
      [{ field: 'account', reason: 'Account deactivated' }],
      true
    );
  }

  // 5. ATOMIC ROTATION SAFEGUARD:
  // Concurrently claim/revoke this token atomically. If another request already rotated it,
  // findOneAndUpdate with revokedAt: null will return null, preventing race conditions.
  const rotationTime = new Date();
  const claimedToken = await RefreshToken.findOneAndUpdate(
    { _id: existingToken._id, revokedAt: null },
    { $set: { revokedAt: rotationTime } },
    { new: false }
  );

  if (!claimedToken) {
    // Another concurrent request beat us to rotating this token. Trigger family revocation.
    await RefreshToken.updateMany(
      { familyId: existingToken.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    throw new AppError(
      'Concurrent token refresh detected. Session terminated.',
      401,
      [{ field: 'refreshToken', reason: 'Concurrent rotation conflict' }],
      true
    );
  }

  // 6. Generate new access token
  const newAccessToken = generateAccessToken(user);

  // 7. Generate new refresh token in the SAME family
  const { rawToken: newRawToken, tokenHash: newTokenHash } = generateRefreshToken();
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  const newRefreshTokenDoc = await RefreshToken.create({
    userId: user._id,
    tokenHash: newTokenHash,
    familyId: existingToken.familyId,
    expiresAt: newExpiresAt
  });

  // 8. Link old token to the new replacement
  await RefreshToken.findByIdAndUpdate(existingToken._id, {
    replacedByTokenId: newRefreshTokenDoc._id
  });

  return {
    user: formatSafeUser(user),
    accessToken: newAccessToken,
    rawRefreshToken: newRawToken,
    refreshExpiryMs: REFRESH_TOKEN_EXPIRY_MS
  };
}

/**
 * Revoke a refresh token on logout.
 * 
 * @param {string} rawToken - Plaintext refresh token from HttpOnly cookie
 * @returns {Promise<boolean>}
 */
export async function logoutUser(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    return true; // Safe if cookie was absent
  }

  const tokenHash = hashToken(rawToken);
  await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  return true;
}

/**
 * Retrieve authenticated profile information.
 * 
 * @param {string} userId - User identifier from verified token
 * @returns {Promise<Object>} Safe user record
 */
export async function getUserProfile(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User profile not found.', 404, [
      { field: 'userId', reason: 'User does not exist' }
    ]);
  }

  if (!user.isActive) {
    throw new AppError('Account is inactive.', 403, [
      { field: 'account', reason: 'Account deactivated' }
    ]);
  }

  return formatSafeUser(user);
}
