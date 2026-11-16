# PARKWISE - Rewards Management & Points Ledger Documentation
## Phase 2.8: Rewards Management

### 1. Overview
The Rewards Management subsystem encourages students to park in underutilized campus parking lots by awarding points upon check-out based on real-time availability.

---

### 2. Tier Classification
Student tiers are dynamically assigned based on accumulated reward points:
- **Bronze**: 0 - 99 points
- **Silver**: 100 - 249 points
- **Gold**: 250 - 499 points
- **Platinum**: 500+ points

---

### 3. Reward Rules Engine
Active reward rules determine the points awarded:
1. **High Availability Incentive (Underutilized Lot)**:
   - Minimum Availability: 60%
   - Maximum Availability: 100%
   - Award: 20 points
2. **Moderate Availability Incentive**:
   - Minimum Availability: 30%
   - Maximum Availability: 59%
   - Award: 10 points
3. **Standard / Peak Zone Parking**:
   - Minimum Availability: 0%
   - Maximum Availability: 29%
   - Award: 0 points

---

### 4. Endpoints

#### 4.1 Get Student Reward Summary
- **Route**: `GET /api/v1/rewards/summary`
- **Access**: Authenticated Student
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "totalPoints": 350,
    "lifetimePointsEarned": 420,
    "currentMonthPoints": 70,
    "sessionsParked": 14,
    "tier": "Gold",
    "leaderboardRank": 2,
    "nextTierPoints": 150
  }
}
```

#### 4.2 Get Student Reward Transaction Ledger
- **Route**: `GET /api/v1/rewards/history?page=1&limit=10`
- **Access**: Authenticated Student
- **Response**: `200 OK`

#### 4.3 Get Active Reward Rules
- **Route**: `GET /api/v1/rewards/rules`
- **Access**: Authenticated Student / Admin
- **Response**: `200 OK`

#### 4.4 Admin Reward Rule CRUD
- `GET /api/v1/admin/rewards/rules` (all rules including inactive)
- `POST /api/v1/admin/rewards/rules` (create rule)
- `PATCH /api/v1/admin/rewards/rules/:ruleId` (update rule)
- `DELETE /api/v1/admin/rewards/rules/:ruleId` (delete rule)
