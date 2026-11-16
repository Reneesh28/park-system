# PARKWISE - Backend Progress Tracker & Architecture Documentation
## Phases 2.1 - 2.10: Full Backend & Full-Stack Integration

### 1. Overview & Milestone Status

| Phase | Milestone Description | Status | Verification Status |
|---|---|---|---|
| **Phase 2.1** | **Backend Initialization & Core Architecture** | **COMPLETED** | Verified (Express, Helmet, Cors, Error Handling) |
| **Phase 2.2** | **MongoDB Database Design & Mongoose Models** | **COMPLETED** | Verified (6 Collections, Indexes, Hooks) |
| **Phase 2.3** | **Authentication & Registration APIs** | **COMPLETED** | Verified (Bcrypt, Joi, JWT, Profile) |
| **Phase 2.4** | **Dual-Token Lifecycle & Refresh Token Rotation** | **COMPLETED** | Verified (HttpOnly Cookie, Token Family, Reuse Detection) |
| **Phase 2.5** | **Parking-Lot Management APIs** | **COMPLETED** | Verified (Capacity Math, Dynamic Status, Admin Controls) |
| **Phase 2.6** | **QR Parking Sessions (Check-In & Check-Out)** | **COMPLETED** | Verified (Atomic Concurrency, Single Active Session, Check-Out) |
| **Phase 2.7** | **Deterministic Recommendation Engine** | **COMPLETED** | Verified (S = 0.6A + 0.4D, Algorithmic Ranking) |
| **Phase 2.8** | **Rewards Management & Points Ledger** | **COMPLETED** | Verified (Incentive Tiers, Summary, History, Admin CRUD) |
| **Phase 2.9** | **Admin APIs and Real-Time Analytics** | **COMPLETED** | Verified (Dashboard, Activity Feed, Utilisation, Leaderboard) |
| **Phase 2.10**| **Full Frontend-Backend Integration** | **COMPLETED** | Verified (Dual Mode, Auto-Refresh, E2E Tested) |

---

### 2. Architecture & Design Principles

1. **Clean Separation of Concerns**:
   - `models/`: Mongoose schemas, indexes, validation hooks, virtual properties.
   - `validators/`: Joi schema validators enforcing payload integrity before execution.
   - `services/`: Business logic, concurrency control, mathematical scoring, point derivation.
   - `controllers/`: HTTP parsing, standardized response dispatching, error delegation.
   - `routes/`: Express routers guarded by authentication and role-based authorization.
   - `middleware/`: Bearer token verification (`authenticate`), role checks (`authorize`), centralized error handling, and rate limiting.

2. **Security & Cryptography**:
   - SHA-256 hash stored for all QR tokens (`qrTokenHash`). Raw QR secrets are never exposed to clients.
   - SHA-256 hash stored for all refresh tokens (`tokenHash`). Raw refresh tokens are kept strictly in HttpOnly, SameSite cookies.
   - Passwords hashed using bcrypt with salt rounds of 10.

3. **Concurrency & Atomicity**:
   - Database Partial Unique Index (`{ userId: 1 }, { unique: true, partialFilterExpression: { status: 'active' } }`) guarantees at most one active session per student at all times.
   - Atomic Mongoose operations (`findOneAndUpdate` with `$inc: { occupiedSpaces: 1 }` and `$inc: { occupiedSpaces: -1 }`) prevent race-condition overbooking without distributed locks.

4. **Deterministic Recommendations**:
   - Algorithmic formula: $Score = \text{round}((0.6 \times A + 0.4 \times D) \times 100)$
   - Transparent, reproducible, with zero reliance on external or non-deterministic AI APIs.

---

### 3. Test Suites & Verification Results

All automated test suites execute against the local MongoDB instance:
- `npm run test:auth` (Phase 2.4): 22/22 tests passed.
- `npm run test:backend` (Phases 2.5 - 2.9): 47/47 tests passed.
- `npm run test:e2e` (Phase 2.10 Full Integration): 31/31 tests passed.
- `frontend/tests/verify-bundles.js`: 10/10 standalone page bundles verified with 0 errors.
- `frontend/tests/verify-all-buttons.js`: 100% button and interaction coverage verified.
