/**
 * PARKWISE - Reward Transaction Model
 * Phase 2.2: MongoDB Database Design and Mongoose Models
 */

import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSession',
      required: [true, 'Parking session ID is required']
    },
    points: {
      type: Number,
      required: [true, 'Reward points amount is required'],
      min: [0, 'Reward points cannot be negative']
    },
    reason: {
      type: String,
      required: [true, 'Reward reason or description is required'],
      trim: true,
      maxlength: [200, 'Reason cannot exceed 200 characters']
    },
    rewardType: {
      type: String,
      required: [true, 'Reward type is required'],
      enum: {
        values: ['underutilized_parking', 'early_bird', 'manual_adjustment', 'eco_bonus'],
        message: '{VALUE} is not a valid reward type'
      },
      default: 'underutilized_parking'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Immutable ledger
  }
);

/* ==========================================================================
   Database Indexes
   ========================================================================== */

/**
 * Idempotency Compound Index:
 * Prevents granting duplicate reward points for the same parking session and reward type.
 */
rewardSchema.index({ sessionId: 1, rewardType: 1 }, { unique: true });

// User reward ledger history queries
rewardSchema.index({ userId: 1, createdAt: -1 });

const Reward = mongoose.model('Reward', rewardSchema);

export default Reward;
