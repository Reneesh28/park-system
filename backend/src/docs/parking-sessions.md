# PARKWISE - QR Parking Session Management Documentation
## Phase 2.6: QR Parking Sessions

### 1. Overview
The QR Parking Session lifecycle powers student check-ins, check-outs, and occupancy adjustments.

### 2. Architectural Guarantees

#### 2.1 One Active Session Per Student
Enforced at the database layer via a strict MongoDB Partial Unique Index:
```javascript
parkingSessionSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);
```
Completed sessions are excluded from this index, preserving complete historical audit records.

#### 2.2 Atomic Capacity Modifications
- **Check-In**:
  ```javascript
  await ParkingLot.findOneAndUpdate(
    { _id: lotId, isActive: true, $expr: { $lt: ['$occupiedSpaces', '$totalCapacity'] } },
    { $inc: { occupiedSpaces: 1 } },
    { new: true }
  );
  ```
- **Check-Out**:
  ```javascript
  await ParkingLot.findOneAndUpdate(
    { _id: lotId, occupiedSpaces: { $gt: 0 } },
    { $inc: { occupiedSpaces: -1 } },
    { new: true }
  );
  ```
This ensures zero race condition overbooking or negative occupancy without requiring heavy multi-document transactions.

#### 2.3 QR Verification
When a student scans or submits a QR code string, the server resolves the token using SHA-256 hash matching and normalized parking lot identifiers.

---

### 3. Session Endpoints

#### 3.1 QR Scan Handler (Check-In & Check-Out)
- **Route**: `POST /api/v1/parking-sessions/scan`
- **Access**: Authenticated Student
- **Request Body**:
```json
{
  "qrToken": "PARKWISE-LOT-B",
  "vehicleNumber": "CW-4482"
}
```
- **Behavior Matrix**:
  1. If user has no active session: Performs **Check-In** (201 Created).
  2. If user has an active session in the SAME lot: Performs **Check-Out** (200 OK), computes points, updates session, and releases space.
  3. If user has an active session in a DIFFERENT lot: Rejects with `409 Conflict` ("Active session in another lot").

#### 3.2 Get Active Session
- **Route**: `GET /api/v1/parking-sessions/active`
- **Access**: Authenticated Student
- **Response**: `200 OK` (returns active session object or `null` if not parked).

#### 3.3 Get Parking History
- **Route**: `GET /api/v1/parking-sessions/history?page=1&limit=10`
- **Access**: Authenticated Student
- **Response**: `200 OK` (paginated list of completed sessions).

#### 3.4 Get Specific Session by ID
- **Route**: `GET /api/v1/parking-sessions/:sessionId`
- **Access**: Student owner or Administrator
- **Response**: `200 OK`
