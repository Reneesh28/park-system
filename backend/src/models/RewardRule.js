/**
 * PARKWISE - Reward Rule Model
 * Phase 2.2: MongoDB Database Design and Mongoose Models
 */

import mongoose from 'mongoose';

const rewardRuleSchema = new mongoose.Schema(
  {
    ruleName: {
      type: String,
      required: [true, 'Rule name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Rule name must be at least 3 characters'],
      maxlength: [100, 'Rule name cannot exceed 100 characters']
    },
    minimumAvailabilityPercentage: {
      type: Number,
      required: [true, 'Minimum availability percentage is required'],
      min: [0, 'Minimum availability percentage cannot be less than 0'],
      max: [100, 'Minimum availability percentage cannot exceed 100']
    },
    maximumAvailabilityPercentage: {
      type: Number,
      required: [true, 'Maximum availability percentage is required'],
      min: [0, 'Maximum availability percentage cannot be less than 0'],
      max: [100, 'Maximum availability percentage cannot exceed 100']
    },
    points: {
      type: Number,
      required: [true, 'Reward points award is required'],
      min: [0, 'Points cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

/**
 * Validation hook:
 * Enforces that minimumAvailabilityPercentage does not exceed maximumAvailabilityPercentage.
 */
rewardRuleSchema.pre('validate', function (next) {
  if (
    typeof this.minimumAvailabilityPercentage === 'number' &&
    typeof this.maximumAvailabilityPercentage === 'number'
  ) {
    if (this.minimumAvailabilityPercentage > this.maximumAvailabilityPercentage) {
      this.invalidate(
        'minimumAvailabilityPercentage',
        'Minimum availability percentage cannot be greater than maximum availability percentage'
      );
    }
  }
  next();
});

// Indexes
rewardRuleSchema.index({ isActive: 1, minimumAvailabilityPercentage: 1 });

const RewardRule = mongoose.model('RewardRule', rewardRuleSchema);

export default RewardRule;
