/**
 * PARKWISE - Central Mock Seed Datasets & Persistence Layer
 * Phase 1.2 & 1.10: Mock Data and Browser Persistence
 */

export const INITIAL_USERS = [
  {
    id: 'usr_001',
    role: 'student',
    studentId: 'STU-2024-8841',
    name: 'Alex Rivera',
    email: 'alex.rivera@campus.edu',
    password: 'StudentPass123',
    phone: '+1 555-0192',
    walletBalance: 350,
    vehicle: {
      vehicleNumber: 'CW-4482',
      vehicleType: 'two-wheeler',
      isPrimary: true
    }
  },
  {
    id: 'usr_999',
    role: 'admin',
    studentId: 'ADM-2020-0012',
    name: 'Campus Transport Authority',
    email: 'admin@campus.edu',
    password: 'AdminPass123',
    phone: '+1 555-0100',
    walletBalance: 0,
    vehicle: null
  }
];

export const INITIAL_PARKING_LOTS = [
  {
    id: 'lot_A',
    lotCode: 'A',
    lotName: 'Academic Block A Parking',
    location: 'North Campus, Adjacent to Engineering Hall',
    totalCapacity: 100,
    occupiedSpaces: 78, // 22 available (22% -> Highly occupied / peak)
    qrCodeId: 'QR-NG-A-01',
    isActive: true,
    walkingDistances: {
      'Engineering Hall': 60,
      'Science Complex': 380,
      'Central Library': 480,
      'Student Center': 650,
      'Humanities Courtyard': 700
    }
  },
  {
    id: 'lot_B',
    lotCode: 'B',
    lotName: 'Academic Block B Parking',
    location: 'East Campus, Near Science & Computing Complex',
    totalCapacity: 150,
    occupiedSpaces: 42, // 108 available (72% -> Underutilized / High incentive)
    qrCodeId: 'QR-EW-B-02',
    isActive: true,
    walkingDistances: {
      'Engineering Hall': 350,
      'Science Complex': 50,
      'Central Library': 220,
      'Student Center': 380,
      'Humanities Courtyard': 520
    }
  },
  {
    id: 'lot_C',
    lotCode: 'C',
    lotName: 'Academic Block C Parking',
    location: 'West Campus, Humanities & Arts Quadrangle',
    totalCapacity: 80,
    occupiedSpaces: 44, // 36 available (45% -> Moderately occupied)
    qrCodeId: 'QR-CAB-C-03',
    isActive: true,
    walkingDistances: {
      'Engineering Hall': 600,
      'Science Complex': 480,
      'Central Library': 180,
      'Student Center': 110,
      'Humanities Courtyard': 40
    }
  }
];

export const INITIAL_REWARD_RULES = [
  {
    id: 'rule_1',
    category: 'underutilized',
    title: 'High Availability / Underutilized Incentive',
    minAvailability: 60,
    maxAvailability: 100,
    points: 20,
    description: 'Earn 20 points for parking in lots with over 60% open capacity.'
  },
  {
    id: 'rule_2',
    category: 'moderate',
    title: 'Moderate Availability Incentive',
    minAvailability: 30,
    maxAvailability: 59,
    points: 10,
    description: 'Earn 10 points for parking in lots with 30% to 59% open capacity.'
  },
  {
    id: 'rule_3',
    category: 'peak',
    title: 'Peak / Congested Lot',
    minAvailability: 0,
    maxAvailability: 29,
    points: 0,
    description: 'No bonus points awarded when parking in congested lots.'
  }
];

export const INITIAL_REWARD_CATALOG = [
  {
    id: 'rew_101',
    title: 'Free Campus Cafe Espresso',
    pointsRequired: 150,
    category: 'Food & Beverage',
    description: 'Redeem for any hot or iced espresso at the Central Library Cafe.',
    icon: 'coffee'
  },
  {
    id: 'rew_102',
    title: 'University Bookstore 20% Voucher',
    pointsRequired: 300,
    category: 'Merchandise & Books',
    description: '20% off all textbooks, stationery, and university apparel.',
    icon: 'book'
  },
  {
    id: 'rew_103',
    title: 'Campus Tech Store $15 Discount',
    pointsRequired: 450,
    category: 'Electronics',
    description: 'Applicable on charging cables, peripherals, and headphones.',
    icon: 'headphones'
  },
  {
    id: 'rew_104',
    title: 'Priority Semester Maintenance Check',
    pointsRequired: 600,
    category: 'Vehicle Services',
    description: 'Free comprehensive two-wheeler tyre pressure & brake inspection.',
    icon: 'bike'
  }
];

export const INITIAL_SESSIONS = [
  {
    id: 'sess_901',
    userId: 'usr_001',
    lotId: 'lot_B',
    vehicleNumber: 'CW-4482',
    entryTime: new Date(Date.now() - 3 * 86400000).toISOString(),
    exitTime: new Date(Date.now() - 3 * 86400000 + 4 * 3600000).toISOString(),
    status: 'completed',
    pointsEarned: 20
  },
  {
    id: 'sess_902',
    userId: 'usr_001',
    lotId: 'lot_C',
    vehicleNumber: 'CW-4482',
    entryTime: new Date(Date.now() - 1 * 86400000).toISOString(),
    exitTime: new Date(Date.now() - 1 * 86400000 + 3 * 3600000).toISOString(),
    status: 'completed',
    pointsEarned: 10
  }
];

export const INITIAL_REWARD_LEDGER = [
  {
    id: 'tx_01',
    userId: 'usr_001',
    sessionId: 'sess_901',
    lotName: 'Academic Block B Parking',
    type: 'earn',
    points: 20,
    reason: 'Underutilized Lot Incentive (72% available)',
    timestamp: new Date(Date.now() - 3 * 86400000 + 4 * 3600000).toISOString()
  },
  {
    id: 'tx_02',
    userId: 'usr_001',
    sessionId: 'sess_902',
    lotName: 'Academic Block C Parking',
    type: 'earn',
    points: 10,
    reason: 'Moderate Availability Parking Incentive',
    timestamp: new Date(Date.now() - 1 * 86400000 + 3 * 3600000).toISOString()
  }
];
