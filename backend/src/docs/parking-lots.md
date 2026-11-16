# PARKWISE - Parking Lot Management API Documentation
## Phase 2.5: Parking-Lot Management APIs

### 1. Overview
The Parking Lot Management APIs provide endpoints for students and administrators to view, inspect, and manage university campus two-wheeler parking lots.

Parking lot availability is computed dynamically on the server:
- `availableSpaces` = `totalCapacity - occupiedSpaces`
- `occupancyPercentage` = `Math.round((occupiedSpaces / totalCapacity) * 100)`
- `availabilityPercentage` = `Math.round((availableSpaces / totalCapacity) * 100)`
- `status` classification:
  - `available`: >= 60% open capacity
  - `limited`: 30% to 59% open capacity
  - `full`: < 30% open capacity or 0 available spaces

QR token verification hashes (`qrTokenHash`) are strictly excluded from all public API outputs via Mongoose projection and JSON transformation hooks.

---

### 2. Endpoints

#### 2.1 Get Active Parking Lots
- **Route**: `GET /api/v1/parking-lots`
- **Access**: Authenticated (Student / Admin)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Active parking lots retrieved successfully",
  "data": {
    "lots": [
      {
        "id": "67375bf...",
        "lotName": "Academic Block A Parking",
        "lotCode": "A",
        "totalCapacity": 100,
        "occupiedSpaces": 78,
        "availableSpaces": 22,
        "occupancyPercentage": 78,
        "availabilityPercentage": 22,
        "status": "full",
        "location": "North Campus, Adjacent to Engineering Hall",
        "walkingDistances": {
          "Engineering Hall": 60,
          "Science Complex": 380,
          "Central Library": 480
        },
        "isActive": true
      }
    ]
  }
}
```

#### 2.2 Get Parking Lot Details
- **Route**: `GET /api/v1/parking-lots/:lotId`
- **Access**: Authenticated (Student / Admin)
- **Parameters**: `lotId` (MongoDB ObjectId or lotCode such as "A", "B", "C")
- **Response**: `200 OK`

#### 2.3 Create Parking Lot (Admin)
- **Route**: `POST /api/v1/admin/parking-lots`
- **Access**: Admin only (`role: 'admin'`)
- **Headers**: `Authorization: Bearer <adminAccessToken>`
- **Request Body**:
```json
{
  "lotName": "Academic Block D Parking",
  "lotCode": "D",
  "totalCapacity": 90,
  "location": "South Perimeter, Near Sports Arena",
  "walkingDistances": {
    "Engineering Hall": 400,
    "Science Complex": 300
  },
  "qrToken": "PARKWISE-LOT-D"
}
```
- **Response**: `201 Created`

#### 2.4 Update Parking Lot Details (Admin)
- **Route**: `PATCH /api/v1/admin/parking-lots/:lotId`
- **Access**: Admin only
- **Validation**: Cannot reduce totalCapacity below current occupiedSpaces.
- **Response**: `200 OK`

#### 2.5 Update Parking Lot Operational Status (Admin)
- **Route**: `PATCH /api/v1/admin/parking-lots/:lotId/status`
- **Access**: Admin only
- **Request Body**:
```json
{
  "isActive": false
}
```
- **Response**: `200 OK`
