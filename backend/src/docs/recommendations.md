# PARKWISE - Deterministic Recommendation Engine Documentation
## Phase 2.7: Deterministic Recommendation Engine

### 1. Overview
The recommendation engine evaluates all active campus parking lots against a student's destination academic block to suggest optimal parking choices. It is strictly algorithmic, deterministic, reproducible, and has zero external AI or machine learning dependencies.

---

### 2. Scoring Formula
The recommendation score $S \in [0, 100]$ is computed as:
$$S = 0.6 \times A + 0.4 \times D$$

Where:
- **Availability Factor ($A$)**:
  $$A = \frac{\text{availableSpaces}}{\text{totalCapacity}}$$
  Measures open parking lot capacity.
- **Normalized Distance Factor ($D$)**:
  $$D = 1.0 - \frac{\text{distance} - \text{minDistance}}{\text{maxDistance} - \text{minDistance}}$$
  Where distance is walking distance in meters from the lot to the destination academic building. If all lots share the same distance, $D = 1.0$.

Lots with zero available spaces receive a composite score of 0 and the badge `"Full"`.

The top-scoring lot with available capacity is awarded:
- `isRecommended: true`
- `badge: "Recommended"`

Alternative active lots with spaces are awarded `badge: "Alternative"`.

---

### 3. API Endpoint

#### 3.1 Get Recommendations
- **Route**: `GET /api/v1/recommendations?destination=<academicBlock>`
- **Access**: Authenticated Student / Admin
- **Parameters**: `destination` (e.g. `Engineering Hall`, `Science Complex`, `Central Library`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Recommendations computed successfully",
  "data": {
    "destination": "Engineering Hall",
    "formula": "Score = 0.6 * (Available/Total) + 0.4 * (1 - (Dist - MinDist)/(MaxDist - MinDist))",
    "recommendations": [
      {
        "lotId": "67375bf...",
        "lotCode": "B",
        "lotName": "Academic Block B Parking",
        "location": "East Campus, Near Science & Computing Complex",
        "totalCapacity": 150,
        "occupiedSpaces": 42,
        "availableSpaces": 108,
        "occupancyPercentage": 28,
        "availabilityPercentage": 72,
        "distanceMeters": 350,
        "availabilityFactor": 0.72,
        "distanceFactor": 0.46,
        "compositeScore": 62,
        "estimatedRewardPoints": 20,
        "isRecommended": true,
        "badge": "Recommended"
      }
    ]
  }
}
```
