/**
 * PARKWISE - Parking Session Model
 * Phase 2.2: MongoDB Database Design and Mongoose Models
 */

import mongoose from 'mongoose';

const parkingSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    parkingLotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLot',
      required: [true, 'Parking lot ID is required']
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      uppercase: true,
      trim: true
    },
    entryTime: {
      type: Date,
      default: Date.now,
      required: true
    },
    exitTime: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed'],
        message: '{VALUE} is not a valid session status'
      },
      default: 'active'
    },
    rewardPointsEarned: {
      type: Number,
      default: 0,
      min: [0, 'Reward points earned cannot be negative']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Validation hook:
 * Enforces that a session with status 'completed' must have an exitTime
 * and that exitTime cannot be earlier than entryTime.
 */
parkingSessionSchema.pre('validate', function (next) {
  if (this.status === 'completed') {
    if (!this.exitTime) {
      this.invalidate('exitTime', 'Exit time is required for completed sessions');
    } else if (this.entryTime && this.exitTime < this.entryTime) {
      this.invalidate('exitTime', 'Exit time cannot precede entry time');
    }
  }
  next();
});

/**
 * Virtual: Parking session duration in minutes
 */
parkingSessionSchema.virtual('durationMinutes').get(function () {
  if (!this.entryTime) return 0;
  const end = this.exitTime ? new Date(this.exitTime).getTime() : Date.now();
  const start = new Date(this.entryTime).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
});

/* ==========================================================================
   Database Indexes
   ========================================================================== */

/**
 * Strict Partial Unique Index:
 * Enforces that a student/user can have AT MOST ONE active parking session at any time.
 * Completed sessions are excluded from this uniqueness constraint, preserving complete history.
 */
parkingSessionSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' }
  }
);

// Performance compound indexes for query execution
parkingSessionSchema.index({ parkingLotId: 1, entryTime: -1 });
parkingSessionSchema.index({ userId: 1, entryTime: -1 });
parkingSessionSchema.index({ status: 1, entryTime: -1 });

const ParkingSession = mongoose.model('ParkingSession', parkingSessionSchema);

export default ParkingSession;
