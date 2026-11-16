(() => {
  // frontend/js/data/mock-data.js
  var INITIAL_USERS = [
    {
      id: "usr_001",
      role: "student",
      studentId: "STU-2024-8841",
      name: "Alex Rivera",
      email: "alex.rivera@campus.edu",
      password: "StudentPass123",
      phone: "+1 555-0192",
      walletBalance: 350,
      vehicle: {
        vehicleNumber: "CW-4482",
        vehicleType: "two-wheeler",
        isPrimary: true
      }
    },
    {
      id: "usr_999",
      role: "admin",
      studentId: "ADM-2020-0012",
      name: "Campus Transport Authority",
      email: "admin@campus.edu",
      password: "AdminPass123",
      phone: "+1 555-0100",
      walletBalance: 0,
      vehicle: null
    }
  ];
  var INITIAL_PARKING_LOTS = [
    {
      id: "lot_A",
      lotCode: "A",
      lotName: "Academic Block A Parking",
      location: "North Campus, Adjacent to Engineering Hall",
      totalCapacity: 100,
      occupiedSpaces: 78,
      // 22 available (22% -> Highly occupied / peak)
      qrCodeId: "QR-NG-A-01",
      isActive: true,
      walkingDistances: {
        "Engineering Hall": 60,
        "Science Complex": 380,
        "Central Library": 480,
        "Student Center": 650,
        "Humanities Courtyard": 700
      }
    },
    {
      id: "lot_B",
      lotCode: "B",
      lotName: "Academic Block B Parking",
      location: "East Campus, Near Science & Computing Complex",
      totalCapacity: 150,
      occupiedSpaces: 42,
      // 108 available (72% -> Underutilized / High incentive)
      qrCodeId: "QR-EW-B-02",
      isActive: true,
      walkingDistances: {
        "Engineering Hall": 350,
        "Science Complex": 50,
        "Central Library": 220,
        "Student Center": 380,
        "Humanities Courtyard": 520
      }
    },
    {
      id: "lot_C",
      lotCode: "C",
      lotName: "Academic Block C Parking",
      location: "West Campus, Humanities & Arts Quadrangle",
      totalCapacity: 80,
      occupiedSpaces: 44,
      // 36 available (45% -> Moderately occupied)
      qrCodeId: "QR-CAB-C-03",
      isActive: true,
      walkingDistances: {
        "Engineering Hall": 600,
        "Science Complex": 480,
        "Central Library": 180,
        "Student Center": 110,
        "Humanities Courtyard": 40
      }
    }
  ];
  var INITIAL_REWARD_RULES = [
    {
      id: "rule_1",
      category: "underutilized",
      title: "High Availability / Underutilized Incentive",
      minAvailability: 60,
      maxAvailability: 100,
      points: 20,
      description: "Earn 20 points for parking in lots with over 60% open capacity."
    },
    {
      id: "rule_2",
      category: "moderate",
      title: "Moderate Availability Incentive",
      minAvailability: 30,
      maxAvailability: 59,
      points: 10,
      description: "Earn 10 points for parking in lots with 30% to 59% open capacity."
    },
    {
      id: "rule_3",
      category: "peak",
      title: "Peak / Congested Lot",
      minAvailability: 0,
      maxAvailability: 29,
      points: 0,
      description: "No bonus points awarded when parking in congested lots."
    }
  ];
  var INITIAL_REWARD_CATALOG = [
    {
      id: "rew_101",
      title: "Free Campus Cafe Espresso",
      pointsRequired: 150,
      category: "Food & Beverage",
      description: "Redeem for any hot or iced espresso at the Central Library Cafe.",
      icon: "coffee"
    },
    {
      id: "rew_102",
      title: "University Bookstore 20% Voucher",
      pointsRequired: 300,
      category: "Merchandise & Books",
      description: "20% off all textbooks, stationery, and university apparel.",
      icon: "book"
    },
    {
      id: "rew_103",
      title: "Campus Tech Store $15 Discount",
      pointsRequired: 450,
      category: "Electronics",
      description: "Applicable on charging cables, peripherals, and headphones.",
      icon: "headphones"
    },
    {
      id: "rew_104",
      title: "Priority Semester Maintenance Check",
      pointsRequired: 600,
      category: "Vehicle Services",
      description: "Free comprehensive two-wheeler tyre pressure & brake inspection.",
      icon: "bike"
    }
  ];
  var INITIAL_SESSIONS = [
    {
      id: "sess_901",
      userId: "usr_001",
      lotId: "lot_B",
      vehicleNumber: "CW-4482",
      entryTime: new Date(Date.now() - 3 * 864e5).toISOString(),
      exitTime: new Date(Date.now() - 3 * 864e5 + 4 * 36e5).toISOString(),
      status: "completed",
      pointsEarned: 20
    },
    {
      id: "sess_902",
      userId: "usr_001",
      lotId: "lot_C",
      vehicleNumber: "CW-4482",
      entryTime: new Date(Date.now() - 1 * 864e5).toISOString(),
      exitTime: new Date(Date.now() - 1 * 864e5 + 3 * 36e5).toISOString(),
      status: "completed",
      pointsEarned: 10
    }
  ];
  var INITIAL_REWARD_LEDGER = [
    {
      id: "tx_01",
      userId: "usr_001",
      sessionId: "sess_901",
      lotName: "Academic Block B Parking",
      type: "earn",
      points: 20,
      reason: "Underutilized Lot Incentive (72% available)",
      timestamp: new Date(Date.now() - 3 * 864e5 + 4 * 36e5).toISOString()
    },
    {
      id: "tx_02",
      userId: "usr_001",
      sessionId: "sess_902",
      lotName: "Academic Block C Parking",
      type: "earn",
      points: 10,
      reason: "Moderate Availability Parking Incentive",
      timestamp: new Date(Date.now() - 1 * 864e5 + 3 * 36e5).toISOString()
    }
  ];

  // frontend/js/services/storage.service.js
  var PREFIX = "parkwise_";
  var storageService = {
    /**
     * Write serialized item to localStorage.
     */
    set(key, value) {
      try {
        localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn("[Storage Error] Could not write to localStorage:", e);
        return false;
      }
    },
    /**
     * Read item from localStorage with fallback.
     */
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(`${PREFIX}${key}`);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.warn("[Storage Error] Could not read from localStorage:", e);
        return defaultValue;
      }
    },
    /**
     * Remove item from localStorage.
     */
    remove(key) {
      try {
        localStorage.removeItem(`${PREFIX}${key}`);
        return true;
      } catch (e) {
        console.warn("[Storage Error] Could not remove key:", e);
        return false;
      }
    },
    /**
     * Resets all demo data in localStorage back to original clean seed values.
     */
    resetToFactoryDefaults() {
      this.set("users", INITIAL_USERS);
      this.set("lots", INITIAL_PARKING_LOTS);
      this.set("reward_rules", INITIAL_REWARD_RULES);
      this.set("reward_catalog", INITIAL_REWARD_CATALOG);
      this.set("sessions", INITIAL_SESSIONS);
      this.set("reward_ledger", INITIAL_REWARD_LEDGER);
      console.log("[Storage] Initialized/Reset demo data state.");
    },
    /**
     * Ensures mock data collections are present; seeds if empty.
     */
    ensureHydrated() {
      if (!this.get("users")) this.set("users", INITIAL_USERS);
      if (!this.get("lots")) this.set("lots", INITIAL_PARKING_LOTS);
      if (!this.get("reward_rules")) this.set("reward_rules", INITIAL_REWARD_RULES);
      if (!this.get("reward_catalog")) this.set("reward_catalog", INITIAL_REWARD_CATALOG);
      if (!this.get("sessions")) this.set("sessions", INITIAL_SESSIONS);
      if (!this.get("reward_ledger")) this.set("reward_ledger", INITIAL_REWARD_LEDGER);
    }
  };
  storageService.ensureHydrated();

  // frontend/js/middleware/auth.middleware.js
  var authMiddleware = {
    /**
     * Check if a valid session exists in storage.
     * @returns {boolean}
     */
    isAuthenticated() {
      return Boolean(storageService.get("current_user") && storageService.get("auth_token"));
    },
    /**
     * Returns authenticated user profile.
     * @returns {Object|null}
     */
    getUser() {
      return storageService.get("current_user");
    },
    /**
     * Guards a page, redirecting unauthenticated or unauthorized users.
     * In standalone demo mode, it automatically initializes and authenticates the default user
     * for the allowed role so that direct file opens (e.g. file:///.../admin-dashboard.html)
     * work immediately without being blocked.
     * @param {Object} options
     * @param {string[]} [options.allowedRoles=['student', 'admin']]
     * @param {string} [options.redirectUrl='../login.html']
     * @param {string} [options.basePath='../']
     * @returns {Object|null} Authenticated user if allowed; otherwise redirects and returns null.
     */
    requireAuth({
      allowedRoles = ["student", "admin"],
      redirectUrl = "../login.html",
      basePath = "../"
    } = {}) {
      storageService.ensureHydrated();
      const existingUser = this.getUser();
      if (existingUser && allowedRoles.includes(existingUser.role)) {
        if (!storageService.get("auth_token")) {
          storageService.set("auth_token", `demo-token-${existingUser.id}`);
        }
        return existingUser;
      }
      if (!this.isAuthenticated()) {
        const users = storageService.get("users", []);
        const fallbackUser = users.find((u) => allowedRoles.includes(u.role)) || users[0];
        if (fallbackUser && allowedRoles.includes(fallbackUser.role)) {
          storageService.set("current_user", fallbackUser);
          storageService.set("auth_token", `demo-token-${fallbackUser.id}`);
          return fallbackUser;
        }
        window.location.href = redirectUrl;
        return null;
      }
      const user = this.getUser();
      if (!allowedRoles.includes(user.role)) {
        if (user.role === "student") {
          window.location.href = `${basePath}pages/student-dashboard.html`;
        } else {
          window.location.href = `${basePath}pages/admin-dashboard.html`;
        }
        return null;
      }
      return user;
    }
  };

  // frontend/js/api/api.js
  var API_CONFIG = {
    baseURL: "http://localhost:5000/api/v1",
    isMock: false,
    mockDelayMs: 150,
    timeoutMs: 6e3,
    version: "v1"
  };
  var delay = (ms = API_CONFIG.mockDelayMs) => new Promise((resolve) => setTimeout(resolve, ms));
  function createApiResponse(success, data, message = "", status = 200) {
    return {
      success,
      status,
      message,
      data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async function apiRequest(endpoint, options = {}, mockHandler = null) {
    if (API_CONFIG.isMock && typeof mockHandler === "function") {
      await delay();
      return mockHandler();
    }
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    let token = null;
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("parkwise_auth_token");
      if (raw) {
        try {
          token = JSON.parse(raw);
        } catch (_) {
          token = raw;
        }
      }
    }
    const headers = {
      "Content-Type": "application/json",
      ...token ? { Authorization: `Bearer ${token}` } : {},
      ...options.headers || {}
    };
    const isFileProtocol = typeof window !== "undefined" && window.location && window.location.protocol === "file:";
    const fetchOptions = {
      ...options,
      headers,
      credentials: isFileProtocol ? "omit" : "include"
      // In file:/// mode, cookies are omitted to comply with CORS spec
    };
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);
      fetchOptions.signal = controller.signal;
      let response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
        try {
          const refreshRes = await fetch(`${API_CONFIG.baseURL}/auth/refresh`, {
            method: "POST",
            credentials: isFileProtocol ? "omit" : "include",
            headers: { "Content-Type": "application/json" }
          });
          if (refreshRes.ok) {
            const refreshJson = await refreshRes.json();
            if (refreshJson.success && refreshJson.data?.accessToken) {
              token = refreshJson.data.accessToken;
              if (window.localStorage) {
                window.localStorage.setItem("parkwise_auth_token", JSON.stringify(token));
              }
              fetchOptions.headers["Authorization"] = `Bearer ${token}`;
              response = await fetch(url, fetchOptions);
            }
          }
        } catch (_) {
        }
      }
      const json = await response.json();
      return json;
    } catch (error) {
      if (typeof mockHandler === "function") {
        console.warn(`[ParkWise API] Live backend unavailable (${url}). Falling back to local state.`);
        await delay(80);
        return mockHandler();
      }
      return createApiResponse(false, null, error.message || "Network error occurred", 500);
    }
  }

  // frontend/js/api/parking.api.js
  var parkingApi = {
    /**
     * Fetch all campus parking lots with dynamically computed availability.
     */
    async getLots() {
      const mockFallback = () => {
        const lots = storageService.get("lots", []);
        const computed = lots.map((lot) => {
          const total = Number(lot.totalCapacity) || 1;
          const occupied = Math.max(0, Number(lot.occupiedSpaces) || 0);
          const available = Math.max(0, total - occupied);
          return {
            ...lot,
            id: lot._id || lot.id,
            totalCapacity: total,
            occupiedSpaces: occupied,
            availableSpaces: available,
            occupancyPercentage: Math.round(occupied / total * 100),
            availabilityPercentage: Math.round(available / total * 100)
          };
        });
        return createApiResponse(true, computed, "Fetched parking lots");
      };
      const res = await apiRequest("/parking-lots", { method: "GET" }, mockFallback);
      if (res.success && res.data?.lots) {
        const formatted = res.data.lots.map((lot) => ({
          ...lot,
          id: lot._id || lot.id
        }));
        storageService.set("lots", formatted);
        return createApiResponse(true, formatted, res.message || "Fetched parking lots");
      }
      return res;
    },
    /**
     * Fetch a parking lot by its unique identifier or lotCode.
     */
    async getLotById(lotId) {
      const res = await this.getLots();
      const lot = (res.data || []).find((l) => l.id === lotId || l.lotCode === lotId);
      if (!lot) {
        return createApiResponse(false, null, "Parking lot not found", 404);
      }
      return createApiResponse(true, lot, "Parking lot details retrieved");
    },
    /**
     * Match parking lot by scanned QR code identifier.
     */
    async getLotByQr(qrCodeId) {
      const res = await this.getLots();
      const normalizedQr = (qrCodeId || "").trim().toUpperCase();
      const lot = (res.data || []).find(
        (l) => (l.qrCodeId || "").toUpperCase() === normalizedQr || l.lotCode === normalizedQr || `PARKWISE-LOT-${l.lotCode}` === normalizedQr
      );
      if (!lot) {
        return createApiResponse(false, null, `Invalid or unrecognized parking QR code: "${qrCodeId}"`, 404);
      }
      return createApiResponse(true, lot, "QR code successfully verified");
    },
    /**
     * Start parking session via QR code check-in.
     */
    async checkIn({ lotId, lotCode, vehicleNumber, userId }) {
      let code = lotCode;
      if (!code) {
        const lotsRes = await this.getLots();
        const matched = (lotsRes.data || []).find((l) => l.id === lotId || l.lotCode === lotId);
        code = matched ? matched.lotCode : "A";
      }
      const qrToken = `PARKWISE-LOT-${code}`;
      const mockFallback = () => {
        const sessions = storageService.get("sessions", []);
        const lots = storageService.get("lots", []);
        const lotIndex = lots.findIndex((l) => l.lotCode === code || l.id === lotId);
        if (lotIndex === -1) return createApiResponse(false, null, "Lot not found", 404);
        const lot = lots[lotIndex];
        lot.occupiedSpaces = (lot.occupiedSpaces || 0) + 1;
        lots[lotIndex] = lot;
        storageService.set("lots", lots);
        const newSession = {
          id: `sess_${Date.now()}`,
          userId,
          lotId: lot.id || lot._id,
          lotName: lot.lotName,
          lotCode: lot.lotCode,
          vehicleNumber: vehicleNumber || "CW-4482",
          entryTime: (/* @__PURE__ */ new Date()).toISOString(),
          exitTime: null,
          status: "active",
          pointsEarned: 0
        };
        sessions.unshift(newSession);
        storageService.set("sessions", sessions);
        return createApiResponse(true, { session: newSession, lot }, "Check-in successful", 201);
      };
      const res = await apiRequest(
        "/parking-sessions/scan",
        {
          method: "POST",
          body: JSON.stringify({ qrToken, vehicleNumber })
        },
        mockFallback
      );
      if (res.success && res.data?.action === "checkin") {
        const rawSession = res.data.session;
        const lot = res.data.lot;
        const session = {
          ...rawSession,
          id: rawSession._id || rawSession.id,
          lotId: lot?._id || lot?.id || rawSession.parkingLotId?._id || rawSession.parkingLotId,
          lotName: lot?.lotName || rawSession.parkingLotId?.lotName || `Lot ${code}`,
          lotCode: lot?.lotCode || rawSession.parkingLotId?.lotCode || code,
          pointsEarned: 0
        };
        const sessions = storageService.get("sessions", []);
        sessions.unshift(session);
        storageService.set("sessions", sessions);
        return createApiResponse(true, { session, lot }, res.message || "Check-in successful!", 201);
      }
      return res;
    },
    /**
     * End active parking session via checkout.
     */
    async checkOut({ sessionId, lotId, lotCode, userId }) {
      let code = lotCode;
      if (!code) {
        const activeRes = await this.getActiveSession(userId);
        if (activeRes.data?.lot?.lotCode) {
          code = activeRes.data.lot.lotCode;
        } else if (activeRes.data?.lotCode) {
          code = activeRes.data.lotCode;
        } else {
          code = "A";
        }
      }
      const qrToken = `PARKWISE-LOT-${code}`;
      const mockFallback = () => {
        const sessions = storageService.get("sessions", []);
        const lots = storageService.get("lots", []);
        const sessionIndex = sessions.findIndex((s) => s.status === "active");
        if (sessionIndex === -1) return createApiResponse(false, null, "No active session", 404);
        const session = sessions[sessionIndex];
        session.status = "completed";
        session.exitTime = (/* @__PURE__ */ new Date()).toISOString();
        session.pointsEarned = 20;
        sessions[sessionIndex] = session;
        storageService.set("sessions", sessions);
        return createApiResponse(true, { session, pointsEarned: 20, lot: lots[0] }, "Check-out successful!");
      };
      const res = await apiRequest(
        "/parking-sessions/scan",
        {
          method: "POST",
          body: JSON.stringify({ qrToken })
        },
        mockFallback
      );
      if (res.success && res.data?.action === "checkout") {
        const session = res.data.session;
        const lot = res.data.lot;
        const pointsEarned = res.data.pointsEarned || 0;
        const sessions = storageService.get("sessions", []);
        const idx = sessions.findIndex((s) => s.status === "active");
        if (idx !== -1) {
          sessions[idx].status = "completed";
          sessions[idx].exitTime = session.exitTime || (/* @__PURE__ */ new Date()).toISOString();
          sessions[idx].pointsEarned = pointsEarned;
          storageService.set("sessions", sessions);
        }
        const user = storageService.get("current_user");
        if (user) {
          user.walletBalance = (user.walletBalance || 0) + pointsEarned;
          user.rewardPoints = (user.rewardPoints || 0) + pointsEarned;
          storageService.set("current_user", user);
        }
        return createApiResponse(
          true,
          {
            session,
            pointsEarned,
            totalPoints: user ? user.walletBalance : pointsEarned,
            lot
          },
          res.message || `Checkout successful! You earned +${pointsEarned} reward points.`
        );
      }
      return res;
    },
    /**
     * Retrieve active session for a given user.
     */
    async getActiveSession(userId) {
      const mockFallback = () => {
        const sessions = storageService.get("sessions", []);
        const active = sessions.find((s) => s.status === "active");
        if (!active) return createApiResponse(true, null, "No active session");
        return createApiResponse(true, active, "Active session retrieved");
      };
      const res = await apiRequest("/parking-sessions/active", { method: "GET" }, mockFallback);
      if (res.success) {
        const s = res.data?.session;
        if (!s) return createApiResponse(true, null, "No active session");
        const lot = s.parkingLotId;
        const formatted = {
          ...s,
          id: s._id || s.id,
          lotId: lot?._id || lot?.id || s.parkingLotId,
          lotName: lot?.lotName || "Campus Parking Lot",
          lotCode: lot?.lotCode || "A",
          lot: lot ? { ...lot, id: lot._id || lot.id } : null
        };
        return createApiResponse(true, formatted, "Active session retrieved");
      }
      return res;
    },
    /**
     * Retrieve session history for a student.
     */
    async getUserSessions(userId) {
      const mockFallback = () => {
        const sessions = storageService.get("sessions", []);
        return createApiResponse(true, sessions, "Sessions retrieved");
      };
      const res = await apiRequest("/parking-sessions/history", { method: "GET" }, mockFallback);
      if (res.success && res.data?.sessions) {
        const formatted = res.data.sessions.map((s) => ({
          ...s,
          id: s._id || s.id,
          lotName: s.parkingLotId?.lotName || s.lotName || "Campus Lot",
          lotCode: s.parkingLotId?.lotCode || s.lotCode || "A"
        }));
        return createApiResponse(true, formatted, "Sessions retrieved");
      }
      return res;
    },
    /**
     * Admin: Update parking lot information or capacity.
     */
    async updateLot(lotId, { lotName, location, totalCapacity, isActive }) {
      const res = await apiRequest(
        `/admin/parking-lots/${lotId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ lotName, location, totalCapacity: Number(totalCapacity), isActive })
        },
        () => {
          const lots = storageService.get("lots", []);
          const idx = lots.findIndex((l) => l.id === lotId || l.lotCode === lotId);
          if (idx !== -1) {
            lots[idx].totalCapacity = Number(totalCapacity) || lots[idx].totalCapacity;
            storageService.set("lots", lots);
          }
          return createApiResponse(true, lots[idx], "Lot updated");
        }
      );
      return res;
    }
  };

  // frontend/js/utils/icons.js
  var PATHS = {
    grid: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    parking: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h-4l-2 5 3 3v4M12 14h6.5M15 6l3.5 11.5"/><circle cx="15" cy="4" r="1"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h3v1h-3zM20 14h1v3h-1z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    reset: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down: '<path d="M12 5v14M19 12l-7 7-7-7"/>'
  };
  function icon(name, size = 18, className = "") {
    const path = PATHS[name] || PATHS.parking;
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}" style="display:inline-block; vertical-align:middle; flex-shrink:0;">${path}</svg>`;
  }

  // frontend/js/components/navbar.component.js
  var PAGE_TITLES = {
    dashboard: "Dashboard Overview",
    "parking-lots": "Campus Parking Lots & Map",
    "scan-parking": "QR Check-In / Check-Out",
    "find-vehicle": "Locate My Vehicle",
    rewards: "Rewards & Campus Perks",
    "parking-history": "Parking Session History",
    admin: "Campus Parking Administration"
  };
  function renderNavbar({ activePage = "", basePath = "./" } = {}) {
    const currentUser2 = storageService.get("current_user");
    const pageTitle = PAGE_TITLES[activePage] || "Smart Parking Assistant";
    const userControlsHtml = currentUser2 ? `
      <div class="flex items-center gap-2">
        <!-- Quick Vehicle Search Input (Reference Feature) -->
        <div class="header-search-box" style="position: relative; display: inline-flex; align-items: center;">
          <span style="position: absolute; left: 10px; color: var(--color-text-subtle); pointer-events: none;">
            ${icon("search", 14)}
          </span>
          <input
            type="text"
            id="nav-quick-search-input"
            class="form-input"
            placeholder="Search bike number"
            style="width: 170px; height: 32px; padding-left: 30px; font-size: var(--font-size-xs); text-transform: uppercase; border-radius: var(--radius-md); background: #f8fafc;"
            aria-label="Search bike registration"
          >
        </div>

        <!-- Demo Mode Badge (from Reference) -->
        <span class="badge" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-size: 11px; padding: 3px 8px;">
          Demo mode
        </span>

        <!-- User Role Avatar Pill -->
        <div class="user-pill flex items-center gap-2" style="background: var(--color-bg-alt); padding: 4px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs);">
          <span style="color: var(--color-primary);">${icon("user", 14)}</span>
          <span class="hidden sm:inline"><strong>${currentUser2.name.split(" ")[0]}</strong></span>
        </div>

        <button id="nav-logout-btn" class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px;">
          Sign Out
        </button>
      </div>
    ` : `
      <div class="flex items-center gap-2">
        <a href="${basePath}login.html" class="btn btn-outline btn-sm">Sign In</a>
        <a href="${basePath}register.html" class="btn btn-primary btn-sm">Register</a>
      </div>
    `;
    return `
    <header class="app-header">
      <div class="container-fluid flex items-center justify-between w-full">
        <!-- Brand & Active Page Title -->
        <div class="flex items-center gap-3">
          <a href="${basePath}index.html" class="navbar-brand">
            <span class="brand-icon-badge">
              ${icon("parking", 18)}
            </span>
            <div style="line-height: 1.15;">
              <div style="font-weight: 700; color: var(--color-primary);">ParkWise</div>
              <div class="hidden sm:block" style="font-size: 10px; color: var(--color-text-muted); font-weight: normal;">
                Smart Campus Mobility
              </div>
            </div>
          </a>

          <div class="hidden md:block" style="border-left: 1px solid var(--color-border); padding-left: 12px; margin-left: 4px; font-size: var(--font-size-sm); font-weight: 600; color: #334155;">
            ${pageTitle}
          </div>
        </div>

        <!-- User Controls / Search / Demo Pill -->
        ${userControlsHtml}
      </div>
    </header>
  `;
  }
  function initNavbarEvents(redirectPath = "../login.html") {
    const logoutBtn = document.getElementById("nav-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        storageService.remove("current_user");
        storageService.remove("auth_token");
        window.location.href = redirectPath;
      });
    }
    const quickSearchInput = document.getElementById("nav-quick-search-input");
    if (quickSearchInput) {
      quickSearchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const val = quickSearchInput.value.trim().toUpperCase();
          if (val) {
            if (window.location.pathname.includes("find-vehicle.html")) {
              const pageInput = document.getElementById("vehicle-search-input");
              if (pageInput) {
                pageInput.value = val;
                document.getElementById("vehicle-search-form")?.requestSubmit();
              }
            } else {
              const prefix = window.location.pathname.includes("/pages/") ? "./" : "./pages/";
              window.location.href = `${prefix}find-vehicle.html?q=${encodeURIComponent(val)}`;
            }
          }
        }
      });
    }
  }

  // frontend/js/components/sidebar.component.js
  function renderStudentSidebar(activePage = "", basePath = "./") {
    const items = [
      { id: "home", label: "Home", icon: "grid", href: `${basePath}pages/student-dashboard.html` },
      { id: "find-parking", label: "Find Parking", icon: "parking", href: `${basePath}pages/parking-lots.html` },
      { id: "campus-map", label: "Campus Map", icon: "map", href: `${basePath}pages/campus-map.html` },
      { id: "scan-qr", label: "Scan QR", icon: "qr", href: `${basePath}pages/scan-parking.html` },
      { id: "my-parking", label: "My Parking", icon: "bike", href: `${basePath}pages/find-vehicle.html` },
      { id: "rewards", label: "Rewards", icon: "gift", href: `${basePath}pages/rewards.html` },
      { id: "profile", label: "Profile", icon: "user", href: `${basePath}pages/profile.html` }
    ];
    const desktopMenuHtml = items.map((item) => {
      const isActive = activePage === item.id || activePage === item.label.toLowerCase() ? "active" : "";
      return `
        <li class="sidebar-item ${isActive}">
          <a href="${item.href}">
            ${icon(item.icon, 18)}
            <span>${item.label}</span>
          </a>
        </li>
      `;
    }).join("");
    const isHomeActive = activePage === "home" || activePage === "dashboard";
    const isLotsActive = activePage === "find-parking" || activePage === "parking-lots";
    const isScanActive = activePage === "scan-qr" || activePage === "scan-parking";
    const isMapActive = activePage === "campus-map";
    const isMoreActive = ["my-parking", "rewards", "profile", "history", "parking-history"].includes(activePage);
    return `
    <!-- Mobile Bottom Navigation Bar (Fixed at bottom on screens < 768px) -->
    <nav class="mobile-subnav" aria-label="Mobile Bottom Navigation">
      <a href="${basePath}pages/student-dashboard.html" class="mobile-subnav-link ${isHomeActive ? "active" : ""}">
        ${icon("grid", 18)}
        <span>Home</span>
      </a>
      <a href="${basePath}pages/parking-lots.html" class="mobile-subnav-link ${isLotsActive ? "active" : ""}">
        ${icon("parking", 18)}
        <span>Find</span>
      </a>
      <a href="${basePath}pages/scan-parking.html" class="mobile-subnav-link mobile-scan-pill ${isScanActive ? "active" : ""}">
        <span class="mobile-scan-icon-wrap">
          ${icon("qr", 20)}
        </span>
        <span>Scan QR</span>
      </a>
      <a href="${basePath}pages/campus-map.html" class="mobile-subnav-link ${isMapActive ? "active" : ""}">
        ${icon("map", 18)}
        <span>Map</span>
      </a>
      <button type="button" id="mobile-more-menu-btn" class="mobile-subnav-link ${isMoreActive ? "active" : ""}" style="background: none; border: none; font-family: inherit;">
        ${icon("sliders", 18)}
        <span>More</span>
      </button>
    </nav>

    <!-- Mobile More Menu Bottom Sheet / Modal Overlay -->
    <div id="mobile-more-drawer" class="mobile-more-drawer" style="display: none;">
      <div class="mobile-more-backdrop" id="mobile-more-backdrop"></div>
      <div class="mobile-more-content">
        <div class="mobile-more-header flex items-center justify-between">
          <span class="font-semibold text-navy">More Options</span>
          <button id="mobile-more-close-btn" class="btn btn-outline btn-sm" style="padding: 2px 8px;">Close</button>
        </div>
        <div class="mobile-more-grid">
          <a href="${basePath}pages/find-vehicle.html" class="mobile-more-item ${activePage === "my-parking" ? "active" : ""}">
            ${icon("bike", 20)}
            <span>My Parking</span>
          </a>
          <a href="${basePath}pages/rewards.html" class="mobile-more-item ${activePage === "rewards" ? "active" : ""}">
            ${icon("gift", 20)}
            <span>Rewards</span>
          </a>
          <a href="${basePath}pages/parking-history.html" class="mobile-more-item ${activePage === "history" || activePage === "parking-history" ? "active" : ""}">
            ${icon("history", 20)}
            <span>History</span>
          </a>
          <a href="${basePath}pages/profile.html" class="mobile-more-item ${activePage === "profile" ? "active" : ""}">
            ${icon("user", 20)}
            <span>Profile</span>
          </a>
          <a href="${basePath}pages/admin-dashboard.html" class="mobile-more-item">
            ${icon("sliders", 20)}
            <span>Admin Console</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Desktop Sidebar (Visible on desktop screens >= 768px) -->
    <aside class="dashboard-sidebar">
      <div>
        <div style="font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.75rem; padding-left: 0.5rem; letter-spacing: 0.5px;">
          Navigation
        </div>
        <ul class="sidebar-menu">
          ${desktopMenuHtml}
        </ul>
      </div>

      <div class="sidebar-footer-note">
        <div class="flex items-center justify-between" style="margin-bottom: 6px;">
          <span style="font-weight: 600; color: #ffffff; font-size: 11px;">Admin Console</span>
          <a href="${basePath}pages/admin-dashboard.html" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 10px; border-radius: 4px;">
            Open &rarr;
          </a>
        </div>
        ParkWise Campus Mobility. Lot-level smart parking and QR check-in.
      </div>
    </aside>
  `;
  }
  function initSidebarEvents() {
    const moreBtn = document.getElementById("mobile-more-menu-btn");
    const drawer = document.getElementById("mobile-more-drawer");
    const backdrop = document.getElementById("mobile-more-backdrop");
    const closeBtn = document.getElementById("mobile-more-close-btn");
    if (moreBtn && drawer) {
      moreBtn.addEventListener("click", () => {
        drawer.style.display = "block";
      });
    }
    const closeDrawer = () => {
      if (drawer) drawer.style.display = "none";
    };
    backdrop?.addEventListener("click", closeDrawer);
    closeBtn?.addEventListener("click", closeDrawer);
  }

  // frontend/js/components/modal.component.js
  var activeModal = null;
  function openModal(titleOrOptions = "", maybeContent = "") {
    closeModal();
    let title = "";
    let content = "";
    let confirmText = "";
    let cancelText = "";
    let onConfirm = null;
    let confirmStyle = "primary";
    if (typeof titleOrOptions === "object" && titleOrOptions !== null) {
      title = titleOrOptions.title || "";
      content = titleOrOptions.content || "";
      confirmText = titleOrOptions.confirmText || "";
      cancelText = titleOrOptions.cancelText || "";
      onConfirm = titleOrOptions.onConfirm || null;
      confirmStyle = titleOrOptions.confirmStyle || "primary";
    } else {
      title = titleOrOptions;
      content = maybeContent;
    }
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    const confirmBtnHtml = confirmText ? `<button class="btn btn-${confirmStyle}" id="modal-confirm-btn">${confirmText}</button>` : "";
    const footerHtml = confirmText || cancelText ? `
      <div class="modal-footer flex items-center justify-end gap-2" style="margin-top: 1.25rem;">
        ${cancelText ? `<button class="btn btn-outline" id="modal-cancel-btn">${cancelText}</button>` : ""}
        ${confirmBtnHtml}
      </div>
    ` : "";
    backdrop.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 style="color: var(--color-primary); font-size: 1.125rem; font-weight: 700; margin: 0;">${title}</h3>
        <button class="modal-close btn btn-outline btn-sm" aria-label="Close dialog" style="padding: 4px; border-radius: 6px; border: none; background: transparent; color: #64748b; cursor: pointer;">
          ${icon("x", 18)}
        </button>
      </div>
      <div class="modal-body" style="font-size: var(--font-size-sm); color: var(--color-text-main); margin-top: 0.5rem;">
        ${content}
      </div>
      ${footerHtml}
    </div>
  `;
    document.body.appendChild(backdrop);
    activeModal = backdrop;
    const closeFn = () => closeModal();
    backdrop.querySelector(".modal-close")?.addEventListener("click", closeFn);
    backdrop.querySelector("#modal-cancel-btn")?.addEventListener("click", closeFn);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeFn();
    });
    if (confirmText && onConfirm) {
      const confirmBtn = backdrop.querySelector("#modal-confirm-btn");
      confirmBtn?.addEventListener("click", async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Processing...";
        try {
          await onConfirm();
          closeModal();
        } catch (err) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = confirmText;
        }
      });
    }
    const escHandler = (e) => {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }
  function closeModal() {
    if (activeModal && activeModal.parentNode) {
      activeModal.parentNode.removeChild(activeModal);
      activeModal = null;
    }
  }

  // frontend/js/components/toast.component.js
  var toastContainer = null;
  function ensureToastContainer() {
    if (!toastContainer || !document.body.contains(toastContainer)) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      toastContainer.setAttribute("aria-live", "polite");
      document.body.appendChild(toastContainer);
    }
  }
  function showToast(message, type = "info", durationMs = 3500) {
    ensureToastContainer();
    const toast = document.createElement("div");
    const normalizedType = type === "error" ? "danger" : type;
    toast.className = `toast toast-${normalizedType === "danger" ? "error" : normalizedType}`;
    toast.setAttribute("role", "status");
    const isError = normalizedType === "danger";
    const isWarning = normalizedType === "warning";
    const iconName = isError || isWarning ? "alert" : "check";
    toast.innerHTML = `
    <span style="display:flex; align-items:center; flex-shrink:0;">
      ${icon(iconName, 16)}
    </span>
    <span style="flex: 1; font-size: var(--font-size-sm);">${message}</span>
  `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = "opacity 200ms ease, transform 200ms ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-8px)";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    }, durationMs);
  }

  // frontend/js/utils/formatters.js
  function formatDateTime(dateInput) {
    if (!dateInput) return "\u2014";
    const date = new Date(dateInput);
    return date.toLocaleString(void 0, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // frontend/js/pages/scan-parking.page.js
  var currentUser = null;
  var activeSession = null;
  var allLots = [];
  var mediaStream = null;
  document.addEventListener("DOMContentLoaded", async () => {
    currentUser = authMiddleware.requireAuth({
      allowedRoles: ["student", "admin"],
      redirectUrl: "../login.html",
      basePath: "../"
    });
    if (!currentUser) return;
    const headerContainer = document.getElementById("navbar-container");
    if (headerContainer) {
      headerContainer.innerHTML = renderNavbar({ activePage: "scan-parking", basePath: "../" });
      initNavbarEvents("../login.html");
    }
    const sidebarContainer = document.getElementById("sidebar-container");
    if (sidebarContainer) {
      sidebarContainer.innerHTML = renderStudentSidebar("scan-qr", "../");
      initSidebarEvents();
    }
    await refreshScannerState();
    const urlParams = new URLSearchParams(window.location.search);
    const paramLotId = urlParams.get("lotId");
    const paramAutoCheckout = urlParams.get("autoCheckout");
    if (paramAutoCheckout === "true" && activeSession) {
      triggerCheckoutFlow();
    } else if (paramLotId) {
      const matchedLot = allLots.find((l) => l.id === paramLotId || l.lotCode === paramLotId);
      if (matchedLot) {
        if (activeSession) {
          showToast(`You already have an active session in ${activeSession.lotName}. Please check out first.`, "warning");
        } else {
          triggerCheckInFlow(matchedLot);
        }
      }
    }
    document.querySelectorAll(".demo-scan-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lotCode = btn.dataset.lotCode;
        processScannedCode(`PARKWISE-LOT-${lotCode}`);
      });
    });
    const manualForm = document.getElementById("manual-qr-form");
    if (manualForm) {
      manualForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const codeInput = document.getElementById("manual-qr-input");
        const code = codeInput ? codeInput.value.trim().toUpperCase() : "";
        if (!code) {
          showToast("Please enter a valid QR code string", "warning");
          return;
        }
        processScannedCode(code);
      });
    }
    const cameraToggleBtn = document.getElementById("camera-toggle-btn");
    if (cameraToggleBtn) {
      cameraToggleBtn.addEventListener("click", toggleCameraScanner);
    }
  });
  async function refreshScannerState() {
    const [lotsRes, activeRes] = await Promise.all([
      parkingApi.getLots(),
      parkingApi.getActiveSession(currentUser.id)
    ]);
    allLots = lotsRes.data || [];
    activeSession = activeRes.data;
    updateStatusDisplay();
  }
  function updateStatusDisplay() {
    const bannerContainer = document.getElementById("scanner-mode-banner");
    const quickCheckoutBtn = document.getElementById("quick-checkout-action-btn");
    if (activeSession) {
      if (bannerContainer) {
        bannerContainer.className = "alert alert-warning";
        bannerContainer.innerHTML = `
        <div class="flex items-center justify-between flex-wrap gap-2 w-full">
          <div>
            <strong>Active Parking Session Detected:</strong> Currently parked in <strong>${activeSession.lotName}</strong> (${activeSession.vehicleNumber}).
            <div style="font-size: var(--font-size-xs); margin-top: var(--space-1);">
              Scanning any campus QR code now will finalize your session, log your trip, and award reward points.
            </div>
          </div>
          <button id="banner-checkout-btn" class="btn btn-accent btn-sm">
            Check Out Now
          </button>
        </div>
      `;
        document.getElementById("banner-checkout-btn")?.addEventListener("click", triggerCheckoutFlow);
      }
      if (quickCheckoutBtn) {
        quickCheckoutBtn.style.display = "inline-flex";
        quickCheckoutBtn.onclick = triggerCheckoutFlow;
      }
    } else {
      if (bannerContainer) {
        bannerContainer.className = "alert alert-info";
        bannerContainer.innerHTML = `
        <div>
          <strong>Ready for Check-In:</strong> Scan the QR code posted at your parking bay entrance or use one of the quick test buttons below.
        </div>
      `;
      }
      if (quickCheckoutBtn) {
        quickCheckoutBtn.style.display = "none";
      }
    }
  }
  function processScannedCode(rawCode) {
    const code = rawCode.trim().toUpperCase();
    const lot = allLots.find(
      (l) => l.qrCode.toUpperCase() === code || `PARKWISE-LOT-${l.lotCode}`.toUpperCase() === code || l.lotCode.toUpperCase() === code
    );
    if (!lot) {
      showToast(`Unrecognized QR Code: "${rawCode}". Valid format: PARKWISE-LOT-A`, "danger");
      return;
    }
    if (activeSession) {
      triggerCheckoutFlow();
    } else {
      triggerCheckInFlow(lot);
    }
  }
  function triggerCheckInFlow(lot) {
    const available = Math.max(0, lot.totalCapacity - lot.occupiedSpaces);
    const isFull = lot.occupiedSpaces >= lot.totalCapacity;
    const isUnderutilized = lot.totalCapacity > 0 && available / lot.totalCapacity >= 0.6;
    const potentialPoints = isUnderutilized ? 20 : 10;
    const vehicleNumber = currentUser.vehicleNumber || "CW-4482";
    if (isFull) {
      showToast(`${lot.lotName} is completely full! Please navigate to an alternate lot.`, "danger");
      return;
    }
    const modalHtml = `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div>
          <span class="badge badge-secondary font-mono">Lot ${lot.lotCode}</span>
          <h3 style="margin-top: var(--space-1); margin-bottom: 0;">${lot.lotName}</h3>
        </div>
        <span class="badge ${available > 10 ? "badge-success" : "badge-warning"}">
          ${available} bays open
        </span>
      </div>

      <div class="card" style="padding: var(--space-3); background: var(--color-bg-alt); border: none;">
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Registered Vehicle:</span>
          <strong>${vehicleNumber}</strong>
        </div>
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Campus Location:</span>
          <span>${lot.location}</span>
        </div>
        <div class="flex justify-between" style="font-size: var(--font-size-sm);">
          <span class="text-muted">Reward Eligibility:</span>
          <span class="badge badge-accent">+${potentialPoints} Reward Points</span>
        </div>
      </div>

      ${isUnderutilized ? `
        <div class="alert alert-success" style="font-size: var(--font-size-xs);">
          <strong>Bonus Reward Active:</strong> This lot is underutilised (&gt;60% available spaces). You will earn double points upon checkout!
        </div>
      ` : ""}

      <div class="flex justify-end gap-2" style="margin-top: var(--space-2);">
        <button id="modal-cancel-checkin-btn" class="btn btn-outline">Cancel</button>
        <button id="modal-confirm-checkin-btn" class="btn btn-primary">
          Confirm & Check In
        </button>
      </div>
    </div>
  `;
    openModal("Confirm Parking Check-In", modalHtml);
    document.getElementById("modal-cancel-checkin-btn")?.addEventListener("click", closeModal);
    document.getElementById("modal-confirm-checkin-btn")?.addEventListener("click", async () => {
      closeModal();
      const res = await parkingApi.checkIn({
        userId: currentUser.id,
        lotId: lot.id,
        vehicleNumber
      });
      if (res.success) {
        showToast(`Checked in successfully to ${lot.lotName}!`, "success");
        await refreshScannerState();
        setTimeout(() => {
          window.location.href = "./student-dashboard.html";
        }, 700);
      } else {
        showToast(res.message || "Check-in failed.", "danger");
      }
    });
  }
  async function triggerCheckoutFlow() {
    if (!activeSession) {
      showToast("No active parking session found to check out.", "warning");
      return;
    }
    const entryTime = new Date(activeSession.entryTime);
    const now = /* @__PURE__ */ new Date();
    const elapsedMs = Math.max(0, now - entryTime);
    const mins = Math.max(1, Math.round(elapsedMs / 6e4));
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    const durationText = hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins} minutes`;
    const modalHtml = `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div>
          <span class="badge badge-warning">Session Ending</span>
          <h3 style="margin-top: var(--space-1); margin-bottom: 0;">Check Out & Collect Points</h3>
        </div>
        <div class="badge badge-accent font-semibold">BONUS REWARD</div>
      </div>

      <div class="card" style="padding: var(--space-4); background: var(--color-bg-alt); border: none;">
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Parking Lot:</span>
          <strong>${activeSession.lotName} (Lot ${activeSession.lotCode})</strong>
        </div>
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Vehicle Number:</span>
          <strong class="font-mono">${activeSession.vehicleNumber}</strong>
        </div>
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Entry Time:</span>
          <span>${formatDateTime(activeSession.entryTime)}</span>
        </div>
        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Total Parked Duration:</span>
          <span class="font-mono"><strong>${durationText}</strong></span>
        </div>
      </div>

      <div class="alert alert-success" style="font-size: var(--font-size-sm);">
        Checking out will immediately credit your ParkWise wallet with reward points.
      </div>

      <div class="flex justify-end gap-2" style="margin-top: var(--space-2);">
        <button id="modal-cancel-checkout-btn" class="btn btn-outline">Cancel</button>
        <button id="modal-confirm-checkout-btn" class="btn btn-accent btn-lg">
          Complete Check Out &rarr;
        </button>
      </div>
    </div>
  `;
    openModal("Conclude Parking Session", modalHtml);
    document.getElementById("modal-cancel-checkout-btn")?.addEventListener("click", closeModal);
    document.getElementById("modal-confirm-checkout-btn")?.addEventListener("click", async () => {
      closeModal();
      const res = await parkingApi.checkOut({
        sessionId: activeSession.id,
        userId: currentUser.id
      });
      if (res.success) {
        showCheckoutReceipt(res.data);
        await refreshScannerState();
      } else {
        showToast(res.message || "Check-out failed.", "danger");
      }
    });
  }
  function showCheckoutReceipt(checkoutData) {
    const { session, pointsEarned, updatedBalance } = checkoutData;
    const receiptHtml = `
    <div class="flex flex-col gap-4 text-center">
      <div class="badge badge-success font-semibold" style="font-size: 1.25rem;">CHECKOUT COMPLETE</div>
      <div>
        <h3 style="margin-bottom: var(--space-1); color: var(--color-success);">Check Out Successful!</h3>
        <p class="text-muted" style="font-size: var(--font-size-sm); margin-bottom: 0;">
          Your parking bay at ${session.lotName} has been released.
        </p>
      </div>

      <div class="card" style="padding: var(--space-4); background: #fdfaf6; border: 2px dashed var(--color-accent); text-align: left;">
        <div class="flex items-center justify-between" style="margin-bottom: var(--space-3); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-2);">
          <span class="text-muted font-mono" style="font-size: var(--font-size-xs);">SESSION ID: ${session.id}</span>
          <span class="badge badge-success">Completed</span>
        </div>

        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">Reward Earned:</span>
          <strong class="text-accent" style="font-size: var(--font-size-lg);">+${pointsEarned} Points</strong>
        </div>

        <div class="flex justify-between" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
          <span class="text-muted">New Total Balance:</span>
          <strong>${updatedBalance} Points</strong>
        </div>

        <div class="flex justify-between" style="font-size: var(--font-size-sm);">
          <span class="text-muted">Exit Timestamp:</span>
          <span>${formatDateTime(session.exitTime)}</span>
        </div>
      </div>

      <div class="flex justify-center gap-3" style="margin-top: var(--space-2);">
        <a href="./student-dashboard.html" class="btn btn-primary">
          Back to Dashboard
        </a>
        <a href="./rewards.html" class="btn btn-outline">
          View Wallet & Redeem
        </a>
      </div>
    </div>
  `;
    openModal("Parking Session Receipt", receiptHtml);
  }
  async function toggleCameraScanner() {
    const videoEl = document.getElementById("camera-stream");
    const overlayEl = document.getElementById("camera-placeholder");
    const toggleBtn = document.getElementById("camera-toggle-btn");
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
      if (videoEl) videoEl.style.display = "none";
      if (overlayEl) overlayEl.style.display = "flex";
      if (toggleBtn) toggleBtn.textContent = "Start Live Camera";
      showToast("Camera stopped.", "info");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Camera API is not supported in this browser environment. Please use demo buttons or manual code entry.", "warning");
      return;
    }
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoEl) {
        videoEl.srcObject = mediaStream;
        videoEl.style.display = "block";
        await videoEl.play();
      }
      if (overlayEl) overlayEl.style.display = "none";
      if (toggleBtn) toggleBtn.textContent = "Stop Camera";
      showToast("Camera active. Align QR code within the target frame.", "success");
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      showToast("Camera access was not granted or no webcam was detected. Using demo scanning interface.", "warning");
    }
  }
})();
