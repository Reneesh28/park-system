# PARKWISE - Frontend Integration Guide
## Phase 2.10: Full Frontend-Backend Integration

### 1. Integration Architecture
The ParkWise frontend interfaces with the Node.js/Express backend (`http://localhost:5000/api/v1`) via a centralized API client layer (`frontend/js/api/api.js`).

### 2. Key Capabilities
1. **Dual Execution Mode**:
   - Primary Mode: Full-stack HTTP communication with the live backend (`API_CONFIG.isMock = false`), transmitting Bearer tokens and HttpOnly session cookies.
   - Fallback Mode: If the live backend is offline or unreachable, the API client automatically falls back to local storage mock handlers without crashing the user interface.
2. **Automatic Token Refresh**:
   - If an API request encounters a 401 Unauthorized status, the client intercepts the failure and silently invokes `/auth/refresh` using the browser's HttpOnly cookie.
   - Upon successful rotation, the new access token is stored and the original failed request is seamlessly retried.
3. **CORS & Credentials**:
   - `credentials: 'include'` is set on all fetch requests, enabling cross-origin cookie exchange between frontend (port 3000 / 5500) and backend (port 5000).
4. **Standalone Bundle Compatibility**:
   - Built with esbuild into `frontend/dist/*.bundle.js` (IIFE format) ensuring zero CORS restrictions when evaluated directly via `file:///`.

### 3. Build & Verification Commands
- Rebuild browser bundles:
  ```bash
  node frontend/build.js
  ```
- Verify standalone bundles:
  ```bash
  node frontend/tests/verify-bundles.js
  ```
- Verify UI buttons and workflows:
  ```bash
  node frontend/tests/verify-all-buttons.js
  ```
