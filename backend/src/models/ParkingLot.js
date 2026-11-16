/**
 * PARKWISE - Parking Lot Model
 * Phase 2.2: MongoDB Database Design and Mongoose Models
 */

import mongoose from 'mongoose';

const parkingLotSchema = new mongoose.Schema(
  {
    lotName: {
      type: String,
      required: [true, 'Parking lot name is required'],
      trim: true,
      minlength: [3, 'Parking lot name must be at least 3 characters'],
      maxlength: [100, 'Parking lot name cannot exceed 100 characters']
    },
    lotCode: {
      type: String,
      required: [true, 'Parking lot code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Total parking capacity is required'],
      min: [1, 'Total capacity must be at least 1']
    },
    occupiedSpaces: {
      type: Number,
      default: 0,
      min: [0, 'Occupied spaces cannot be negative'],
      validate: {
        validator: function (val) {
          // In updates, this.totalCapacity might be on this or undefined; handle both
          const total = this.totalCapacity ?? this._update?.totalCapacity;
          if (typeof total === 'number') {
            return val <= total;
          }
          return true;
        },
        message: 'Occupied spaces ({VALUE}) cannot exceed total capacity'
      }
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    walkingDistances: {
      type: Map,
      of: Number, // Academic block identifier -> distance in meters
      default: {}
    },
    qrTokenHash: {
      type: String,
      required: [true, 'QR token verification hash is required'],
      unique: true,
      select: false // Never exposed in normal API responses
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.qrTokenHash;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.qrTokenHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

/**
 * Virtual: Available parking spaces
 * Dynamically calculated as totalCapacity minus occupiedSpaces.
 * Not stored redundantly in the database.
 */
parkingLotSchema.virtual('availableSpaces').get(function () {
  return Math.max(0, this.totalCapacity - this.occupiedSpaces);
});

/**
 * Virtual: Occupancy rate percentage (0 - 100)
 */
parkingLotSchema.virtual('occupancyPercentage').get(function () {
  if (!this.totalCapacity || this.totalCapacity <= 0) return 0;
  return Math.round((this.occupiedSpaces / this.totalCapacity) * 100);
});

/**
 * Virtual: Availability percentage (0 - 100)
 */
parkingLotSchema.virtual('availabilityPercentage').get(function () {
  if (!this.totalCapacity || this.totalCapacity <= 0) return 0;
  return Math.round((this.availableSpaces / this.totalCapacity) * 100);
});

// Indexes
parkingLotSchema.index({ isActive: 1, lotCode: 1 });

const ParkingLot = mongoose.model('ParkingLot', parkingLotSchema);

export default ParkingLot;
