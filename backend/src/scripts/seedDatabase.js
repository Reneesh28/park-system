/**
 * PARKWISE - Idempotent Database Seeding Script
 * Complete Database Seeding: Phases 2.1 - 2.10
 *
 * Populates initial campus parking lots, reward rules, admin, and demo student.
 */

import crypto from 'crypto';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import ParkingLot from '../models/ParkingLot.js';
import RewardRule from '../models/RewardRule.js';
import User from '../models/User.js';
import { hashPassword } from '../utils/password.js';

export const hashQrToken = (token) => {
  return crypto.createHash('sha256').update(String(token).trim().toUpperCase()).digest('hex');
};

const initialParkingLots = [
  {
    lotName: 'Academic Block A Parking',
    lotCode: 'A',
    totalCapacity: 100,
    occupiedSpaces: 78,
    location: 'North Campus, Adjacent to Engineering Hall',
    walkingDistances: {
      'Block-A': 50,
      'Block-B': 300,
      'Engineering Hall': 60,
      'Science Complex': 380,
      'Central Library': 480,
      'Student Center': 650,
      'Humanities Courtyard': 700
    },
    qrTokenHash: hashQrToken('PARKWISE-LOT-A'),
    isActive: true
  },
  {
    lotName: 'Academic Block B Parking',
    lotCode: 'B',
    totalCapacity: 150,
    occupiedSpaces: 42,
    location: 'East Campus, Near Science & Computing Complex',
    walkingDistances: {
      'Block-A': 320,
      'Block-B': 40,
      'Engineering Hall': 350,
      'Science Complex': 50,
      'Central Library': 220,
      'Student Center': 380,
      'Humanities Courtyard': 520
    },
    qrTokenHash: hashQrToken('PARKWISE-LOT-B'),
    isActive: true
  },
  {
    lotName: 'Academic Block C Parking',
    lotCode: 'C',
    totalCapacity: 80,
    occupiedSpaces: 44,
    location: 'West Campus, Humanities & Arts Courtyard',
    walkingDistances: {
      'Block-A': 550,
      'Block-B': 400,
      'Engineering Hall': 600,
      'Science Complex': 480,
      'Central Library': 180,
      'Student Center': 110,
      'Humanities Courtyard': 40
    },
    qrTokenHash: hashQrToken('PARKWISE-LOT-C'),
    isActive: true
  }
];

const initialRewardRules = [
  {
    ruleName: 'High Availability Incentive (Underutilized Lot)',
    minimumAvailabilityPercentage: 60,
    maximumAvailabilityPercentage: 100,
    points: 20,
    isActive: true,
    description: 'Earn 20 points for choosing lots with 60% or higher open capacity to reduce campus congestion.'
  },
  {
    ruleName: 'Moderate Availability Incentive',
    minimumAvailabilityPercentage: 30,
    maximumAvailabilityPercentage: 59,
    points: 10,
    isActive: true,
    description: 'Earn 10 points for choosing moderately open parking zones (30% to 59% available).'
  },
  {
    ruleName: 'Standard / Peak Zone Parking',
    minimumAvailabilityPercentage: 0,
    maximumAvailabilityPercentage: 29,
    points: 0,
    isActive: true,
    description: 'No bonus points awarded when parking in congested or near-capacity lots (less than 30% available).'
  }
];

export async function seedDatabase() {
  console.log('[Seed] Starting database seeding process...');

  try {
    await connectDatabase();

    // 1. Seed Parking Lots
    console.log('[Seed] Seeding initial parking lots...');
    for (const lot of initialParkingLots) {
      const existing = await ParkingLot.findOne({ lotCode: lot.lotCode });
      if (!existing) {
        await ParkingLot.create(lot);
        console.log(`[Seed] ParkingLot LOT ${lot.lotCode} created (Capacity: ${lot.totalCapacity}, Occupied: ${lot.occupiedSpaces})`);
      } else {
        existing.lotName = lot.lotName;
        existing.totalCapacity = lot.totalCapacity;
        existing.location = lot.location;
        existing.walkingDistances = lot.walkingDistances;
        existing.qrTokenHash = lot.qrTokenHash;
        existing.isActive = lot.isActive;
        await existing.save();
        console.log(`[Seed] ParkingLot LOT ${lot.lotCode} synced`);
      }
    }

    // 2. Seed Reward Rules
    console.log('[Seed] Seeding initial reward rules...');
    for (const rule of initialRewardRules) {
      await RewardRule.findOneAndUpdate(
        { ruleName: rule.ruleName },
        {
          $set: {
            minimumAvailabilityPercentage: rule.minimumAvailabilityPercentage,
            maximumAvailabilityPercentage: rule.maximumAvailabilityPercentage,
            points: rule.points,
            isActive: rule.isActive,
            description: rule.description
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[Seed] RewardRule "${rule.ruleName}" synced (${rule.points} pts)`);
    }

    // 3. Seed Default Users (Admin & Student)
    console.log('[Seed] Seeding default administrator and demo student...');
    const adminEmail = 'admin@campus.edu';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hashedAdminPassword = await hashPassword('AdminPass123');
      admin = await User.create({
        fullName: 'Campus Transport Authority',
        email: adminEmail,
        studentId: 'ADM-2020-0012',
        password: hashedAdminPassword,
        role: 'admin',
        isActive: true,
        rewardPoints: 0
      });
      console.log('[Seed] Admin account created (admin@campus.edu / AdminPass123)');
    }

    const studentEmail = 'alex.rivera@campus.edu';
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      const hashedStudentPassword = await hashPassword('StudentPass123');
      student = await User.create({
        fullName: 'Alex Rivera',
        email: studentEmail,
        studentId: 'STU-2024-8841',
        password: hashedStudentPassword,
        role: 'student',
        isActive: true,
        rewardPoints: 350,
        vehicles: [
          {
            vehicleNumber: 'CW-4482',
            vehicleType: 'two-wheeler',
            isPrimary: true
          }
        ]
      });
      console.log('[Seed] Demo student account created (alex.rivera@campus.edu / StudentPass123)');
    }

    console.log('[Seed] Database seeding completed successfully.');
  } catch (error) {
    console.error('[Seed Error] Database seeding failed:', error);
    throw error;
  } finally {
    await disconnectDatabase();
  }
}

// Direct execution check for CLI usage (node src/scripts/seedDatabase.js)
if (process.argv[1] && process.argv[1].endsWith('seedDatabase.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
