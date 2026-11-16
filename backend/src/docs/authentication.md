# PARKWISE — Authentication & Session Lifecycle Specification (Phase 2.4)

## 1. Architectural Overview

The **PARKWISE** authentication subsystem provides secure, stateful session rotation combined with stateless access-token verification:

- **Access Tokens**: Short-lived JWTs (default: 15 minutes) carrying `{ userId, role }` claims, verified by API middleware on protected routes.
- **Refresh Tokens**: Opaque, cryptographically random strings (32 bytes = 256 bits of entropy) stored only as SHA-256 hashes in MongoDB, transferred exclusively via `HttpOnly` cookies scoped to `/api/v1/auth`.
- **Token Rotation & Reuse Detection**: Every refresh request atomically rotates the refresh token. Presenting a previously rotated or revoked token immediately triggers token theft detection, revoking all active sessions in that token family.
- **Concurrency & Race Conditions**: Uses atomic MongoDB `findOneAndUpdate` queries ensuring simultaneous refresh requests cannot double-spend or concurrently rotate the same token.

---

## 2. API Endpoints

### 2.1. Student Registration
- **Route**: `POST /api/v1/auth/register`
- **Access**: Public
- **Rate Limit**: Standard API limiter (500 req / 15 min)
- **Behavior**: Creates student account (`role: 'student'`), hashes password with bcrypt (10 rounds), returns safe user record.

---

### 2.2. User Login & Session Issuance
- **Route**: `POST /api/v1/auth/login`
- **Access**: Public
- **Rate Limit**: Strict Auth Limiter (`20 req / 15 min per IP`)
- **Request Body**:
  ```json
  {
    "email": "student@university.edu",
    "password": "SecurePassword123"
  }
  ```
- **Response Headers**:
  ```http
  Set-Cookie: refreshToken=<raw_hex_token>; Path=/api/v1/auth; HttpOnly; SameSite=Lax
  ```
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Authentication successful.",
    "data": {
      "user": {
        "id": "6afb4b386606ba28fa79966d",
        "fullName": "Reneesh Kumar",
        "email": "reneesh@university.edu",
        "studentId": "STU-2026-9001",
        "role": "student",
        "vehicles": [...],
        "rewardPoints": 0,
        "isActive": true
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
> [!IMPORTANT]
> The raw refresh token is **never** returned in the JSON response body. It is transmitted solely via the `HttpOnly` cookie.

---

### 2.3. Token Refresh & Automatic Rotation
- **Route**: `POST /api/v1/auth/refresh`
- **Access**: Public (Cookie-Authenticated)
- **Rate Limit**: Strict Auth Limiter (`20 req / 15 min per IP`)
- **Headers**:
  ```http
  Cookie: refreshToken=<raw_hex_token>
  ```
- **Response Headers**:
  ```http
  Set-Cookie: refreshToken=<new_raw_hex_token>; Path=/api/v1/auth; HttpOnly; SameSite=Lax
  ```
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Access token refreshed successfully.",
    "data": {
      "user": {
        "id": "6afb4b386606ba28fa79966d",
        "fullName": "Reneesh Kumar",
        "email": "reneesh@university.edu",
        "role": "student"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

---

### 2.4. Session Logout & Revocation
- **Route**: `POST /api/v1/auth/logout`
- **Access**: Public
- **Headers**:
  ```http
  Cookie: refreshToken=<raw_hex_token>
  ```
- **Response Headers**:
  ```http
  Set-Cookie: refreshToken=; Path=/api/v1/auth; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT
  ```
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully. Session terminated.",
    "data": null
  }
  ```

---

### 2.5. Authenticated Profile
- **Route**: `GET /api/v1/auth/me`
- **Access**: Protected (`Authorization: Bearer <accessToken>`)
- **Response (`200 OK`)**: Returns current user profile.

---

## 3. Session Lifecycle & Token Rotation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web Browser
    participant Ctrl as Auth Controller
    participant Svc as Auth Service
    participant DB as MongoDB (RefreshToken)

    Note over Client, DB: 1. Login Phase
    Client->>Ctrl: POST /login { email, password }
    Ctrl->>Svc: loginUser(credentials)
    Note over Svc: Verify bcrypt password hash
    Note over Svc: Generate JWT accessToken (15m)
    Note over Svc: Generate rawRefreshToken (32 bytes crypto)
    Note over Svc: Generate familyId (UUID) & SHA-256 tokenHash
    Svc->>DB: RefreshToken.create({ userId, tokenHash, familyId, expiresAt })
    Svc-->>Ctrl: { user, accessToken, rawRefreshToken }
    Ctrl-->>Client: 200 OK { user, accessToken } + Set-Cookie: refreshToken (HttpOnly)

    Note over Client, DB: 2. Token Refresh Phase (Rotation)
    Client->>Ctrl: POST /refresh [Cookie: refreshToken]
    Ctrl->>Svc: rotateRefreshToken(rawToken)
    Note over Svc: tokenHash = SHA-256(rawToken)
    Svc->>DB: RefreshToken.findOne({ tokenHash })
    DB-->>Svc: existingToken record

    alt Token was already revoked (Reuse Detection)
        Note over Svc: SECURITY ALERT: Token reuse detected!
        Svc->>DB: updateMany({ familyId, revokedAt: null }, { $set: { revokedAt: now } })
        Svc-->>Ctrl: 401 Unauthorized (shouldClearCookie = true)
        Ctrl-->>Client: 401 Unauthorized + Set-Cookie: refreshToken=; Max-Age=0
    else Token is active and valid
        Note over Svc: Atomic check & revoke
        Svc->>DB: findOneAndUpdate({ _id, revokedAt: null }, { $set: { revokedAt: now } })
        Note over Svc: Generate fresh accessToken
        Note over Svc: Generate new rawRefreshToken & tokenHash
        Svc->>DB: RefreshToken.create({ userId, tokenHash, familyId: sameFamily, expiresAt })
        Svc->>DB: RefreshToken.findByIdAndUpdate(oldId, { replacedByTokenId: newId })
        Svc-->>Ctrl: { user, accessToken, newRawToken }
        Ctrl-->>Client: 200 OK { user, accessToken } + Set-Cookie: refreshToken (New Token)
    end

    Note over Client, DB: 3. Logout Phase
    Client->>Ctrl: POST /logout [Cookie: refreshToken]
    Ctrl->>Svc: logoutUser(rawToken)
    Svc->>DB: RefreshToken.findOneAndUpdate({ tokenHash }, { $set: { revokedAt: now } })
    Ctrl-->>Client: 200 OK + Set-Cookie: refreshToken=; Max-Age=0
```

---

## 4. Token Reuse Detection Architecture

To defend against **replay attacks** (where an adversary steals a refresh token in transit or from memory):

1. **Token Family Grouping**: Every login assigns a unique `familyId` (UUID). All subsequent rotated tokens in that browser session retain the same `familyId`.
2. **Re-presentation Detection**: If an already-revoked refresh token is presented at `/refresh`:
   - The server concludes the token was intercepted and used by another party.
   - **Cascading Revocation**: The server immediately revokes every active refresh token in that `familyId`:
     ```javascript
     await RefreshToken.updateMany(
       { familyId: existingToken.familyId, revokedAt: null },
       { $set: { revokedAt: new Date() } }
     );
     ```
   - The cookie is immediately cleared on the client.
   - A `401 Unauthorized` response is returned.
3. **Session Isolation**: Independent sessions (e.g. user logged in on another device or tab with its own `familyId`, or other users) remain completely unaffected.

---

## 5. Concurrency Safeguards & Atomic Operations

To prevent race conditions during rapid or duplicate network refresh requests without requiring a replica set transaction:

```javascript
// Atomically claim the refresh token for rotation
const claimedToken = await RefreshToken.findOneAndUpdate(
  { _id: existingToken._id, revokedAt: null },
  { $set: { revokedAt: new Date() } },
  { new: false }
);

if (!claimedToken) {
  // A concurrent request already claimed/rotated this token milliseconds ago
  await RefreshToken.updateMany(
    { familyId: existingToken.familyId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  throw new AppError('Concurrent token refresh detected. Session terminated.', 401);
}
```

This guarantees that two simultaneous requests presenting the same refresh token **cannot both rotate successfully**.

---

## 6. Cookie & CSRF Security Policies

### 6.1. Cookie Configuration

| Option | Setting | Purpose |
|---|---|---|
| `httpOnly` | `true` | Prevents JavaScript access, mitigating XSS token theft |
| `path` | `/api/v1/auth` | Scopes cookie transmission strictly to auth endpoints, preventing exposure on asset/API routes |
| `secure` | `env.isProduction` | Requires HTTPS in production; permits HTTP in local development |
| `sameSite` | `'lax'` (dev) / `'strict'` (prod) | Mitigates Cross-Site Request Forgery (CSRF) on cross-origin requests |
| `maxAge` | 7 days (ms) | Synchronized with `REFRESH_TOKEN_EXPIRY` |

### 6.2. CSRF Defense Strategy
- **Path Isolation**: The refresh token is scoped only to `/api/v1/auth`. General data API requests use the `Authorization: Bearer <accessToken>` header, which browsers never send automatically.
- **SameSite Protection**: Browsers enforce `SameSite=Lax` / `SameSite=Strict`, preventing malicious third-party origins from triggering refresh requests.
- **CORS Whitelist**: Express `cors` middleware explicitly restricts credentials (`credentials: true`) to designated frontend origins (`http://127.0.0.1:5500`, `http://localhost:5500`).

---

## 7. Environment Variables Reference

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/parkwise
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
FRONTEND_URL=http://127.0.0.1:5500
```

---

## 8. Test Verification Summary (22/22 Automated Tests Passed)

Automated test runner: `node src/scripts/testAuth.js` (or `npm test`)

| Category | Test Case | Expected Behavior | Status |
|---|---|---|---|
| **Registration** | Student Registration Baseline | 201 Created | **PASS** |
| **Login** | Access token issued in JSON | Returns string | **PASS** |
| **Login** | Refresh token omitted from JSON | `refreshToken === undefined` | **PASS** |
| **Login** | HttpOnly cookie issued | `httpOnly: true`, path `/api/v1/auth` | **PASS** |
| **Login** | Storage integrity | Stored in MongoDB as SHA-256 hash | **PASS** |
| **Refresh** | Token rotation | Issues new access token & new cookie | **PASS** |
| **Refresh** | Old token marked revoked | `revokedAt !== null`, linked replacement | **PASS** |
| **Refresh** | Family lineage preserved | Same `familyId` maintained | **PASS** |
| **Refresh** | Missing cookie | Rejection with 401 | **PASS** |
| **Refresh** | Forged / invalid token | Rejection with 401 | **PASS** |
| **Refresh** | Expired token | Rejection with 401 | **PASS** |
| **Reuse** | Presentation of old token | Rejection with 401 | **PASS** |
| **Reuse** | Cascading revocation | All active tokens in family revoked | **PASS** |
| **Reuse** | Isolation | Other user families remain active | **PASS** |
| **Concurrency** | Simultaneous refresh requests | Exactly 1 succeeds, 1 rejected | **PASS** |
| **Logout** | Endpoint contract | 200 OK | **PASS** |
| **Logout** | Cookie cleared | Set-Cookie Max-Age 0 | **PASS** |
| **Logout** | Database revocation | Token marked revoked in MongoDB | **PASS** |
| **Logout** | Post-logout refresh | Rejection with 401 | **PASS** |
| **Logout** | Missing cookie on logout | Safe 200 response | **PASS** |
| **Inactive User** | Deactivated account login | Rejection with 403 | **PASS** |
