# PARKWISE - Admin Operations & Analytics API Documentation
## Phase 2.9: Admin APIs and Analytics

### 1. Overview
The Admin Operations & Analytics APIs provide campus transportation administrators with visibility, real-time activity feeds, audit logs, parking utilization trends, and reward distributions.

All endpoints under `/api/v1/admin/*` strictly require `role: 'admin'`.

---

### 2. Endpoints

#### 2.1 Dashboard Overview
- **Route**: `GET /api/v1/admin/dashboard`
- **Access**: Admin only
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalLots": 3,
      "activeLots": 3,
      "totalCapacity": 330,
      "totalOccupied": 164,
      "totalAvailable": 166,
      "overallOccupancyPercentage": 50,
      "activeSessionsCount": 12,
      "totalStudentsCount": 84,
      "todaySessionsCount": 142,
      "totalRewardsDistributed": 2840
    },
    "lots": [ ...per lot status and metrics... ]
  }
}
```

#### 2.2 Live Recent Activity Feed
- **Route**: `GET /api/v1/admin/parking-activity?limit=20`
- **Access**: Admin only
- **Response**: `200 OK` (list of recent check-ins and check-outs with student names, plates, lot codes, timestamps, points awarded).

#### 2.3 Filterable Parking Sessions Log
- **Route**: `GET /api/v1/admin/parking-sessions?status=completed&lotId=A&page=1&limit=15`
- **Access**: Admin only
- **Query Filters**: `status` ('active'|'completed'), `lotId`, `studentId`, `startDate`, `endDate`, `page`, `limit`.
- **Response**: `200 OK`

#### 2.4 Utilisation Analytics
- **Route**: `GET /api/v1/admin/analytics/utilisation`
- **Access**: Admin only
- **Response**: `200 OK` (lot breakdown, 24-hour hourly traffic histogram, average session duration in minutes).

#### 2.5 Rewards Analytics & Student Leaderboard
- **Route**: `GET /api/v1/admin/analytics/rewards`
- **Access**: Admin only
- **Response**: `200 OK` (total points distributed, incentive breakdown by rule, top 10 student leaderboard).
