# PARKWISE - Complete API Reference
## REST API Specification v1.0.0

Base URL: `http://localhost:5000/api/v1`

All responses follow the standard JSON envelope:
```json
{
  "success": true,
  "message": "Human readable status description",
  "data": { ... },
  "errors": []
}
```

---

### Route Index

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | System health, uptime, and database connectivity check |
| `POST` | `/auth/register` | Public | Register new student account |
| `POST` | `/auth/login` | Public | Authenticate user, issue access token & set HttpOnly refresh cookie |
| `POST` | `/auth/refresh` | Public (Cookie) | Rotate refresh token and issue new access token |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token and clear cookie |
| `GET` | `/auth/profile` | Authenticated | Retrieve authenticated user profile |
| `GET` | `/parking-lots` | Authenticated | List all active parking lots with dynamic occupancy metrics |
| `GET` | `/parking-lots/:lotId` | Authenticated | Retrieve single parking lot details by ID or code |
| `POST` | `/parking-sessions/scan` | Authenticated | Scan QR code to trigger atomic Check-In or Check-Out |
| `GET` | `/parking-sessions/active` | Authenticated | Retrieve current user's active session |
| `GET` | `/parking-sessions/history` | Authenticated | Retrieve current user's completed session history |
| `GET` | `/parking-sessions/:sessionId`| Authenticated | Retrieve parking session details by ID |
| `GET` | `/recommendations` | Authenticated | Calculate deterministic parking recommendations for destination |
| `GET` | `/rewards/summary` | Authenticated | Get student reward balance, tier, and rank |
| `GET` | `/rewards/history` | Authenticated | Get student reward ledger history |
| `GET` | `/rewards/rules` | Authenticated | List active reward rules |
| `GET` | `/admin/dashboard` | Admin | High-level system occupancy and operational overview |
| `GET` | `/admin/parking-activity` | Admin | Real-time check-in/out activity stream |
| `GET` | `/admin/parking-sessions` | Admin | Filterable, paginated parking sessions audit log |
| `GET` | `/admin/analytics/utilisation` | Admin | Deep lot utilization, peak hour histogram, average duration |
| `GET` | `/admin/analytics/rewards` | Admin | Points distribution metrics and student leaderboard |
| `GET` | `/admin/parking-lots` | Admin | List all parking lots including inactive |
| `POST` | `/admin/parking-lots` | Admin | Create new parking lot |
| `PATCH`| `/admin/parking-lots/:lotId` | Admin | Update parking lot details/capacity |
| `PATCH`| `/admin/parking-lots/:lotId/status` | Admin | Toggle parking lot active/inactive status |
| `GET` | `/admin/rewards/rules` | Admin | List all reward rules |
| `POST` | `/admin/rewards/rules` | Admin | Create new reward rule |
| `PATCH`| `/admin/rewards/rules/:ruleId` | Admin | Update reward rule |
| `DELETE`| `/admin/rewards/rules/:ruleId`| Admin | Delete reward rule |
