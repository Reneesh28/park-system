/**
 * PARKWISE - User Model
 * Phase 2.2: MongoDB Database Design and Mongoose Models
 */

import mongoose from 'mongoose';

/**
 * Normalizes vehicle registration strings.
 * Removes extraneous whitespace and converts to uppercase.
 * @param {string} val 
 * @returns {string}
 */
const normalizeVehicleNumber = (val) => {
  if (!val || typeof val !== 'string') return val;
  return val.trim().toUpperCase().replace(/\s+/g, '-');
};

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle registration number is required'],
      trim: true,
      uppercase: true,
      set: normalizeVehicleNumber
    },
    vehicleType: {
      type: String,
      enum: {
        values: ['two-wheeler', 'bicycle', 'other'],
        message: '{VALUE} is not a supported vehicle type'
      },
      default: 'two-wheeler'
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address'
      ]
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, 'Student ID must be at least 3 characters long'],
      maxlength: [30, 'Student ID cannot exceed 30 characters']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false // Excluded from default queries to protect password hash
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'admin'],
        message: '{VALUE} is not a valid user role'
      },
      default: 'student',
      index: true
    },
    vehicles: {
      type: [vehicleSchema],
      default: []
    },
    rewardPoints: {
      type: Number,
      default: 0,
      min: [0, 'Reward points cannot be negative']
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
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Explicit compound / single indexes
userSchema.index({ role: 1, isActive: 1 });

const User = mongoose.model('User', userSchema);

export default User;
