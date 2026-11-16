/**
 * PARKWISE - Refresh Token Model
 * Phase 2.4: Refresh Token Management and Session Lifecycle
 */

import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true
    },
    familyId: {
      type: String,
      required: [true, 'Token family identifier is required'],
      index: true
    },
    expiresAt: {
      type: Date,
      required: [true, 'Token expiration timestamp is required']
    },
    revokedAt: {
      type: Date,
      default: null
    },
    replacedByTokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RefreshToken',
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Virtual: Check whether the token is currently valid and non-revoked
 */
refreshTokenSchema.virtual('isValid').get(function () {
  return !this.revokedAt && this.expiresAt > new Date();
});

/* ==========================================================================
   Database Indexes
   ========================================================================== */

/**
 * MongoDB TTL (Time-To-Live) Index:
 * MongoDB automatically purges expired token documents when expiresAt passes.
 */
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Active user session lookup & revocation indexing
refreshTokenSchema.index({ userId: 1, revokedAt: 1 });

// Token family lookup for reuse detection & cascading revocation
refreshTokenSchema.index({ familyId: 1, revokedAt: 1 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
