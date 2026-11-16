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

  // frontend/js/api/rewards.api.js
  var rewardsApi = {
    /**
     * Fetch user reward points balance, lifetime points, and stats.
     */
    async getSummary(userId) {
      const mockFallback = () => {
        const users = storageService.get("users", []);
        const user = users.find((u) => u.id === userId);
        const ledger = storageService.get("reward_ledger", []);
        const userLedger = ledger.filter((tx) => tx.userId === userId);
        const lifetimeEarned = userLedger.filter((tx) => tx.type === "earn").reduce((sum, tx) => sum + (tx.points || 0), 0);
        return createApiResponse(true, {
          currentBalance: user ? user.walletBalance || 0 : 0,
          lifetimeEarned,
          tier: "Silver",
          rank: 1,
          underutilizedParksCount: userLedger.length
        }, "Reward summary retrieved");
      };
      const res = await apiRequest("/rewards/summary", { method: "GET" }, mockFallback);
      if (res.success && res.data) {
        return createApiResponse(true, {
          currentBalance: res.data.totalPoints ?? 0,
          lifetimeEarned: res.data.lifetimePointsEarned ?? 0,
          tier: res.data.tier || "Bronze",
          rank: res.data.leaderboardRank || 1,
          underutilizedParksCount: res.data.sessionsParked || 0,
          nextTierPoints: res.data.nextTierPoints || 0
        }, "Reward summary retrieved");
      }
      return res;
    },
    /**
     * Fetch available reward catalog items.
     */
    async getCatalog() {
      const catalog = storageService.get("reward_catalog", []);
      return createApiResponse(true, catalog, "Reward catalog retrieved");
    },
    /**
     * Fetch transaction ledger history for student.
     */
    async getLedger(userId) {
      const mockFallback = () => {
        const ledger = storageService.get("reward_ledger", []);
        const userLedger = ledger.filter((tx) => tx.userId === userId);
        return createApiResponse(true, userLedger, "Reward ledger retrieved");
      };
      const res = await apiRequest("/rewards/history", { method: "GET" }, mockFallback);
      if (res.success && res.data?.rewards) {
        const formatted = res.data.rewards.map((r) => ({
          id: r._id || r.id,
          lotName: "Campus Parking",
          type: "earn",
          points: r.points,
          reason: r.reason,
          timestamp: r.createdAt
        }));
        return createApiResponse(true, formatted, "Reward ledger retrieved");
      }
      return res;
    },
    /**
     * Redeem a catalog reward perk with student points.
     */
    async redeemReward({ rewardId, userId }) {
      await delay(150);
      const users = storageService.get("users", []);
      const catalog = storageService.get("reward_catalog", []);
      const ledger = storageService.get("reward_ledger", []);
      const userIndex = users.findIndex((u) => u.id === userId);
      const item = catalog.find((r) => r.id === rewardId);
      if (!item) {
        return createApiResponse(false, null, "Reward item not found", 404);
      }
      const currentUser = storageService.get("current_user") || {};
      const balance = currentUser.walletBalance ?? 350;
      if (balance < item.pointsRequired) {
        return createApiResponse(
          false,
          null,
          `Insufficient points. You need ${item.pointsRequired} pts, but current balance is ${balance} pts.`,
          400
        );
      }
      currentUser.walletBalance = balance - item.pointsRequired;
      currentUser.rewardPoints = currentUser.walletBalance;
      storageService.set("current_user", currentUser);
      const voucherCode = `PW-${item.id.toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      ledger.unshift({
        id: `tx_${Date.now()}`,
        userId,
        type: "redeem",
        points: -item.pointsRequired,
        reason: `Redeemed: ${item.title} (Voucher: ${voucherCode})`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      storageService.set("reward_ledger", ledger);
      return createApiResponse(
        true,
        {
          item,
          voucherCode,
          remainingBalance: currentUser.walletBalance
        },
        `Successfully redeemed "${item.title}"! Voucher code: ${voucherCode}`
      );
    }
  };

  // frontend/js/services/recommendation.service.js
  var ACADEMIC_DESTINATIONS = [
    "Engineering Hall",
    "Science Complex",
    "Central Library",
    "Student Center",
    "Humanities Courtyard"
  ];
  var recommendationService = {
    /**
     * Helper to retrieve walking distance in meters for a lot and destination block.
     * @param {string|Object} lotOrCode
     * @param {string} destinationBlock
     * @returns {number} distance in meters
     */
    getDistance(lotOrCode, destinationBlock = "Engineering Hall") {
      if (!lotOrCode) return 400;
      if (typeof lotOrCode === "object" && lotOrCode.walkingDistances) {
        return lotOrCode.walkingDistances[destinationBlock] || 400;
      }
      const lots = storageService.get("lots", []);
      const lot = lots.find((l) => l.lotCode === lotOrCode || l.id === lotOrCode);
      return lot?.walkingDistances && lot.walkingDistances[destinationBlock] || 400;
    },
    /**
     * Evaluates all parking lots against a destination academic block.
     * @param {Array} lots - Array of parking lot objects
     * @param {string} destinationBlock - Target academic building
     * @returns {Array} Ranked parking lots with scoring breakdown
     */
    rankLots(lots, destinationBlock = "Engineering Hall") {
      if (!Array.isArray(lots) || lots.length === 0) return [];
      let maxDistance = 100;
      lots.forEach((lot) => {
        const dist = lot.walkingDistances && lot.walkingDistances[destinationBlock] || 500;
        if (dist > maxDistance) maxDistance = dist;
      });
      const evaluatedLots = lots.map((lot) => {
        const totalCapacity = lot.totalCapacity || 1;
        const occupiedSpaces = lot.occupiedSpaces || 0;
        const availableSpaces = Math.max(0, totalCapacity - occupiedSpaces);
        const isAvailable = lot.isActive !== false && availableSpaces > 0;
        const distanceMeters = lot.walkingDistances && lot.walkingDistances[destinationBlock] || 400;
        const walkingMinutes = Math.max(1, Math.round(distanceMeters / 80));
        if (!isAvailable) {
          return {
            ...lot,
            availableSpaces,
            availabilityRatio: 0,
            occupancyRatio: 1,
            proximityScore: 0,
            score: 0,
            distanceMeters,
            walkingMinutes,
            isRecommended: false,
            recommendationReason: lot.isActive === false ? "Lot temporarily closed for maintenance" : "Lot is currently 100% full",
            potentialPoints: 0
          };
        }
        const availabilityRatio = availableSpaces / totalCapacity;
        const proximityScore = Math.max(0.1, 1 - distanceMeters / (maxDistance * 1.1));
        let score = 0.6 * availabilityRatio + 0.4 * proximityScore;
        let potentialPoints = 10;
        let reason = `Good balance of proximity (${distanceMeters}m) and open space.`;
        if (availabilityRatio >= 0.6) {
          score += 0.15;
          potentialPoints = 20;
          reason = `Highly recommended: underutilized parking lot (${Math.round(availabilityRatio * 100)}% available) + 20 Bonus Reward Points!`;
        } else if (availabilityRatio < 0.3) {
          reason = `Close to destination, but parking availability is limited (${availableSpaces} spaces left).`;
          potentialPoints = 0;
        }
        return {
          ...lot,
          availableSpaces,
          availabilityRatio,
          occupancyRatio: occupiedSpaces / totalCapacity,
          proximityScore,
          score: Math.min(1, score),
          distanceMeters,
          walkingMinutes,
          isRecommended: false,
          // Set below for the top scorer
          recommendationReason: reason,
          potentialPoints
        };
      });
      evaluatedLots.sort((a, b) => b.score - a.score);
      const topCandidate = evaluatedLots.find((l) => l.score > 0);
      if (topCandidate) {
        topCandidate.isRecommended = true;
      }
      return evaluatedLots;
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
    const currentUser = storageService.get("current_user");
    const pageTitle = PAGE_TITLES[activePage] || "Smart Parking Assistant";
    const userControlsHtml = currentUser ? `
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
          <span class="hidden sm:inline"><strong>${currentUser.name.split(" ")[0]}</strong></span>
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

  // frontend/js/components/badge.component.js
  function renderAvailabilityBadge(available, total, concise = false) {
    if (total <= 0) return '<span class="badge badge-secondary">Inactive</span>';
    if (available <= 0) return '<span class="badge badge-danger">\u25CF Parking Full</span>';
    const ratio = available / total;
    const percentage = Math.round(ratio * 100);
    if (ratio >= 0.6) {
      return `<span class="badge badge-success">\u25CF ${concise ? "Available" : "Parking available"} (${percentage}% free)</span>`;
    }
    if (ratio >= 0.3) {
      return `<span class="badge badge-warning">\u25CF ${concise ? "Limited" : "Limited availability"} (${percentage}% free)</span>`;
    }
    return `<span class="badge badge-danger">\u25CF ${concise ? "Full" : "Parking full"} (${percentage}% free)</span>`;
  }
  function renderSessionBadge(status) {
    if (status === "active") {
      return '<span class="badge badge-info" style="font-weight:700;">\u25CF Active Session</span>';
    }
    return '<span class="badge badge-secondary">Completed</span>';
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

  // frontend/js/components/campus-map.component.js
  var ZONE_COORDS = {
    A: {
      name: "Lot A",
      subtitle: "Academic Block Parking",
      r: { x: 60, y: 200, w: 230, h: 100 },
      focus: { x: 15, y: 170, w: 320, h: 192 }
    },
    B: {
      name: "Lot B",
      subtitle: "Library Parking",
      r: { x: 510, y: 200, w: 230, h: 100 },
      focus: { x: 465, y: 170, w: 320, h: 192 }
    },
    C: {
      name: "Lot C",
      subtitle: "Main Gate Parking",
      r: { x: 450, y: 360, w: 250, h: 80 },
      focus: { x: 330, y: 270, w: 400, h: 240 }
    }
  };
  var DEFAULT_VIEWBOX = { x: 0, y: 0, w: 800, h: 480 };
  var TREES = [
    [30, 30],
    [330, 40],
    [460, 30],
    [780, 40],
    [30, 170],
    [350, 190],
    [430, 190],
    [780, 170],
    [20, 380],
    [330, 390],
    [740, 370],
    [760, 440],
    [250, 430]
  ];
  var CampusMapController = class {
    constructor({ containerId, lots = [], selectedZone = null, onZoneSelect = null, showRoute = false, activeLotCode = null }) {
      this.container = document.getElementById(containerId);
      this.lots = lots;
      this.selectedZone = selectedZone;
      this.onZoneSelect = onZoneSelect;
      this.showRoute = showRoute;
      this.activeLotCode = activeLotCode;
      this.viewBox = { ...DEFAULT_VIEWBOX };
      this.targetViewBox = { ...DEFAULT_VIEWBOX };
      this.animationFrame = null;
      if (this.container) {
        this.render();
        if (this.selectedZone && ZONE_COORDS[this.selectedZone]) {
          this.animateTo(ZONE_COORDS[this.selectedZone].focus);
        }
      }
    }
    setSelectedZone(zoneCode, animate = true) {
      if (!zoneCode) return;
      this.selectedZone = zoneCode.toUpperCase();
      if (animate && ZONE_COORDS[this.selectedZone]) {
        this.animateTo(ZONE_COORDS[this.selectedZone].focus);
      }
      this.render();
    }
    updateLots(lots, selectedZone = this.selectedZone, activeLotCode = this.activeLotCode) {
      this.lots = lots;
      this.selectedZone = selectedZone;
      this.activeLotCode = activeLotCode;
      this.render();
    }
    zoom(factor) {
      const cur = this.viewBox;
      const w = Math.min(800, Math.max(200, cur.w * factor));
      const h = w * 0.6;
      this.animateTo({
        x: Math.min(800 - w, Math.max(0, cur.x + (cur.w - w) / 2)),
        y: Math.min(480 - h, Math.max(0, cur.y + (cur.h - h) / 2)),
        w,
        h
      });
    }
    reset() {
      if (this.selectedZone && ZONE_COORDS[this.selectedZone]) {
        this.animateTo(ZONE_COORDS[this.selectedZone].focus);
      } else {
        this.animateTo(DEFAULT_VIEWBOX);
      }
    }
    animateTo(target) {
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      const start = { ...this.viewBox };
      const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
      const duration = 400;
      const step = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        this.viewBox = {
          x: start.x + (target.x - start.x) * ease,
          y: start.y + (target.y - start.y) * ease,
          w: start.w + (target.w - start.w) * ease,
          h: start.h + (target.h - start.h) * ease
        };
        const svg = this.container?.querySelector("svg");
        if (svg) {
          svg.setAttribute("viewBox", `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`);
        }
        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(step);
        }
      };
      this.animationFrame = requestAnimationFrame(step);
    }
    render() {
      if (!this.container) return;
      const getZoneMetrics = (lotCode) => {
        const lot = this.lots.find((l) => l.lotCode === lotCode);
        if (!lot) return { available: 0, total: 100, color: "#16a34a", statusText: "Available" };
        const available = Math.max(0, lot.totalCapacity - lot.occupiedSpaces);
        const ratio = lot.totalCapacity > 0 ? available / lot.totalCapacity : 0;
        let color = "#16a34a";
        let statusText = "Available";
        if (ratio < 0.3) {
          color = "#dc2626";
          statusText = "Full";
        } else if (ratio < 0.6) {
          color = "#f59e0b";
          statusText = "Limited";
        }
        return { available, total: lot.totalCapacity, color, statusText };
      };
      const treesHtml = TREES.map(([x, y]) => `
      <g>
        <circle cx="${x}" cy="${y}" r="15" fill="#c6dcc8"/>
        <circle cx="${x}" cy="${y}" r="7" fill="#b2cfb5"/>
      </g>
    `).join("");
      const zonesHtml = ["A", "B", "C"].map((code) => {
        const z = ZONE_COORDS[code];
        const m = getZoneMetrics(code);
        const isSelected = this.selectedZone === code;
        const isActiveSession = this.activeLotCode === code;
        const r = z.r;
        const strokeColor = isSelected ? "#0F9D9A" : isActiveSession ? "#2563eb" : m.color;
        const strokeWidth = isSelected ? "5" : isActiveSession ? "3.5" : "2.5";
        const labelY = code === "C" ? r.y + r.h + 8 : r.y - 28;
        const bayCount = 10;
        const cw = (r.w - 20) / 5;
        const baysHtml = Array.from({ length: bayCount }).map((_, i) => {
          const c = i % 5;
          const row = i > 4 ? 1 : 0;
          const bx = r.x + 10 + c * cw + 2;
          const by = row ? r.y + r.h - (code === "C" ? 38 : 44) : r.y + 10;
          const bw = cw - 4;
          const bh = code === "C" ? 28 : 34;
          const lot = this.lots.find((l) => l.lotCode === code);
          const occRatio = lot ? lot.occupiedSpaces / lot.totalCapacity : 0.5;
          const isOcc = i / bayCount < occRatio;
          const fill = isOcc ? "#f87171" : "#34d399";
          return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="3" fill="${fill}" opacity="0.9" />`;
        }).join("");
        return `
        <g class="campus-zone-group" data-zone="${code}" style="cursor: pointer;">
          <!-- Selection Halo Effect when selected -->
          ${isSelected ? `
            <rect x="${r.x - 4}" y="${r.y - 4}" width="${r.w + 8}" height="${r.h + 8}" rx="12" fill="none" stroke="#0F9D9A" stroke-width="2" opacity="0.4" />
          ` : ""}

          <!-- Zone Outer Boundary Box -->
          <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="8" fill="#ffffff" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          
          <!-- Bay layout visualization -->
          ${baysHtml}

          <!-- Entrance indicator -->
          ${code === "C" ? `<rect x="${r.x - 3}" y="${r.y + r.h / 2 - 18}" width="6" height="36" fill="#0F9D9A"/>
               <text x="${r.x - 8}" y="${r.y + r.h / 2 + 3}" text-anchor="end" font-size="9" font-weight="600" fill="#0F766E">Entry/Exit</text>` : `<rect x="${r.x + r.w / 2 - 22}" y="${r.y + r.h - 3}" width="44" height="6" fill="#0F9D9A"/>
               <text x="${r.x + r.w / 2}" y="${r.y + r.h + 17}" text-anchor="middle" font-size="9" font-weight="600" fill="#0F766E">Entry/Exit</text>`}

          <!-- Zone Title Pill (Highlights in Teal when selected) -->
          <rect x="${r.x}" y="${labelY}" width="${r.w}" height="20" rx="10" fill="${isSelected ? "#0F9D9A" : "#0B2447"}" />
          <text x="${r.x + r.w / 2}" y="${labelY + 14}" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">
            ${z.name} \u2013 ${z.subtitle}${isSelected ? " (SELECTED)" : ""}
          </text>

          <!-- Real-Time Available Count Circle Badge -->
          <circle cx="${r.x + r.w}" cy="${r.y}" r="17" fill="${isSelected ? "#0F9D9A" : strokeColor}" stroke="#ffffff" stroke-width="2.5" />
          <text x="${r.x + r.w}" y="${r.y + 5}" text-anchor="middle" font-size="12" font-weight="700" fill="#ffffff">
            ${m.available}
          </text>
        </g>
      `;
      }).join("");
      let routeHtml = "";
      const activeRouteZone = this.selectedZone || this.activeLotCode;
      if (activeRouteZone && ZONE_COORDS[activeRouteZone]) {
        const z = ZONE_COORDS[activeRouteZone];
        let points = [];
        if (activeRouteZone === "C") {
          points = [[400, 470], [400, 400], [450, 400]];
        } else if (activeRouteZone === "A") {
          points = [[400, 470], [400, 330], [175, 330], [175, 300]];
        } else if (activeRouteZone === "B") {
          points = [[400, 470], [400, 330], [625, 330], [625, 300]];
        }
        routeHtml = `
        <polyline class="march" points="${points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#2563eb" stroke-width="4" stroke-dasharray="8 5" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="400" cy="470" r="5" fill="#2563eb" />
      `;
      }
      this.container.innerHTML = `
      <div class="campus-map-wrapper relative" style="position: relative; width: 100%;">
        <svg
          viewBox="${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}"
          style="display: block; width: 100%; height: auto; border-radius: var(--radius-lg); border: 1px solid var(--color-border); background: #e5eee6; user-select: none;"
          role="img"
          aria-label="Interactive Campus Two-Wheeler Parking Map"
        >
          <!-- Ground Base -->
          <rect width="800" height="480" fill="#e5eee6" />
          
          <!-- Trees -->
          ${treesHtml}

          <!-- Campus Roadways -->
          <rect x="385" y="0" width="30" height="480" fill="#c9d1db" />
          <rect x="0" y="315" width="800" height="30" fill="#c9d1db" />
          <path d="M400 0V480M0 330H800" stroke="#ffffff" stroke-width="2" stroke-dasharray="10 8" fill="none" />

          <!-- Pedestrian Walkways -->
          <path d="M175 160V200M625 160V200M290 105H385M510 105H415" stroke="#f6f0dc" stroke-width="7" stroke-dasharray="2 7" stroke-linecap="round" fill="none" />

          <!-- Building: Academic Block -->
          <g>
            <rect x="60" y="50" width="230" height="110" rx="6" fill="#dbe4ee" stroke="#9fb0c4" stroke-width="2" />
            <rect x="68" y="58" width="214" height="94" rx="4" fill="#e9eff6" stroke="#b8c6d6" />
            <rect x="76" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="108" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="140" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="172" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="204" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="236" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <text x="175" y="86" text-anchor="middle" font-size="15" font-weight="700" fill="#0B2447">Academic Block</text>
            <text x="175" y="104" text-anchor="middle" font-size="10" fill="#64748b">Engineering &amp; Sciences</text>
          </g>

          <!-- Building: Library Complex -->
          <g>
            <rect x="510" y="50" width="230" height="110" rx="6" fill="#dbe4ee" stroke="#9fb0c4" stroke-width="2" />
            <rect x="518" y="58" width="214" height="94" rx="4" fill="#e9eff6" stroke="#b8c6d6" />
            <rect x="526" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="558" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="590" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="622" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="654" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="686" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <text x="625" y="86" text-anchor="middle" font-size="15" font-weight="700" fill="#0B2447">Central Library</text>
            <text x="625" y="104" text-anchor="middle" font-size="10" fill="#64748b">Study &amp; Research Center</text>
          </g>

          <!-- Campus Main Gate Sign -->
          <rect x="370" y="466" width="60" height="14" rx="3" fill="#0B2447" />
          <text x="400" y="477" text-anchor="middle" font-size="9" font-weight="700" fill="#ffffff">MAIN GATE</text>
          <text x="382" y="454" text-anchor="end" font-size="10" font-weight="600" fill="#0F9D9A">\u25B2 Entry</text>
          <text x="418" y="454" font-size="10" font-weight="600" fill="#64748b">\u25BC Exit</text>

          <!-- Campus Parking Lots -->
          ${zonesHtml}

          <!-- Active Navigation Marching Line -->
          ${routeHtml}
        </svg>

        <!-- Floating Map Controls in Top Right -->
        <div style="position: absolute; top: 12px; right: 12px; display: flex; flex-direction: column; gap: 6px;">
          <button id="map-zoom-in-btn" class="btn btn-outline" style="width: 34px; height: 34px; padding: 0; background: #ffffff; border-color: #cbd5e1; border-radius: 8px; box-shadow: var(--shadow-sm);" title="Zoom in">
            ${icon("plus", 16)}
          </button>
          <button id="map-zoom-out-btn" class="btn btn-outline" style="width: 34px; height: 34px; padding: 0; background: #ffffff; border-color: #cbd5e1; border-radius: 8px; box-shadow: var(--shadow-sm);" title="Zoom out">
            ${icon("minus", 16)}
          </button>
          <button id="map-reset-btn" class="btn btn-outline" style="width: 34px; height: 34px; padding: 0; background: #ffffff; border-color: #cbd5e1; border-radius: 8px; box-shadow: var(--shadow-sm);" title="Reset view">
            ${icon("reset", 16)}
          </button>
        </div>

        <!-- Legend Bar -->
        <div class="flex items-center justify-between flex-wrap gap-2 text-xs text-muted" style="margin-top: var(--space-2); font-size: var(--font-size-xs);">
          <div class="flex items-center gap-4 flex-wrap">
            <span class="flex items-center gap-1.5"><i style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#16a34a;"></i> Available (&gt;60% open)</span>
            <span class="flex items-center gap-1.5"><i style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#f59e0b;"></i> Limited (30\u201360%)</span>
            <span class="flex items-center gap-1.5"><i style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#dc2626;"></i> Full (&lt;30%)</span>
            <span class="flex items-center gap-1.5"><i style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#0F9D9A;"></i> Selected Lot</span>
          </div>
          <div class="text-muted" style="font-size: 11px;">
            Click any zone on the map or in the table below to select and view real-time details.
          </div>
        </div>
      </div>
    `;
      this.container.querySelector("#map-zoom-in-btn")?.addEventListener("click", () => this.zoom(0.75));
      this.container.querySelector("#map-zoom-out-btn")?.addEventListener("click", () => this.zoom(1 / 0.75));
      this.container.querySelector("#map-reset-btn")?.addEventListener("click", () => this.reset());
      this.container.querySelectorAll(".campus-zone-group").forEach((el) => {
        el.addEventListener("click", () => {
          const zoneCode = el.dataset.zone;
          this.setSelectedZone(zoneCode, true);
          if (this.onZoneSelect) {
            this.onZoneSelect(zoneCode);
          }
        });
      });
    }
  };

  // frontend/js/pages/student-dashboard.page.js
  var activeTimerInterval = null;
  var campusMapInstance = null;
  var currentLots = [];
  document.addEventListener("DOMContentLoaded", async () => {
    const user = authMiddleware.requireAuth({
      allowedRoles: ["student", "admin"],
      redirectUrl: "../login.html",
      basePath: "../"
    });
    if (!user) return;
    const headerContainer = document.getElementById("navbar-container");
    if (headerContainer) {
      headerContainer.innerHTML = renderNavbar({ activePage: "dashboard", basePath: "../" });
      initNavbarEvents("../login.html");
    }
    const sidebarContainer = document.getElementById("sidebar-container");
    if (sidebarContainer) {
      sidebarContainer.innerHTML = renderStudentSidebar("home", "../");
      initSidebarEvents();
    }
    document.getElementById("user-name").textContent = user.name;
    document.getElementById("user-student-id").textContent = user.studentId;
    document.getElementById("current-date").textContent = (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    const setIcon = (id, iconName) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = icon(iconName, 18);
    };
    setIcon("stat-icon-total", "parking");
    setIcon("stat-icon-available", "check");
    setIcon("stat-icon-occupancy", "grid");
    setIcon("stat-icon-reward", "gift");
    const destSelect = document.getElementById("destination-select");
    if (destSelect) {
      destSelect.innerHTML = ACADEMIC_DESTINATIONS.map(
        (d) => `<option value="${d}">${d}</option>`
      ).join("");
      destSelect.addEventListener("change", () => {
        loadRecommendations(destSelect.value, currentLots);
        renderDashboardMapLotDetails(campusMapInstance?.selectedZone || "A", destSelect.value);
      });
    }
    await refreshDashboardData();
  });
  async function refreshDashboardData() {
    const user = authMiddleware.getUser();
    if (!user) return;
    const [lotsRes, activeRes, sessionsRes, rewardsRes] = await Promise.all([
      parkingApi.getLots(),
      parkingApi.getActiveSession(user.id),
      parkingApi.getUserSessions(user.id),
      rewardsApi.getSummary(user.id)
    ]);
    currentLots = lotsRes.data || [];
    const activeSession = activeRes.data;
    const sessions = sessionsRes.data || [];
    const rewardSummary = rewardsRes.data || {};
    const totalCapacity = currentLots.reduce((acc, l) => acc + l.totalCapacity, 0);
    const totalOccupied = currentLots.reduce((acc, l) => acc + l.occupiedSpaces, 0);
    const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
    const occupancyPercent = totalCapacity > 0 ? Math.round(totalOccupied / totalCapacity * 100) : 0;
    const totalCapEl = document.getElementById("stat-total-capacity");
    if (totalCapEl) totalCapEl.textContent = `${totalCapacity}`;
    document.getElementById("stat-available-spaces").textContent = `${totalAvailable}`;
    const availSub = document.getElementById("stat-available-sub");
    if (availSub) availSub.textContent = `${Math.round(totalAvailable / totalCapacity * 100)}% available to park`;
    const occRateEl = document.getElementById("stat-occupancy-rate");
    if (occRateEl) occRateEl.textContent = `${occupancyPercent}%`;
    const rewardPointsEl = document.getElementById("stat-reward-points");
    if (rewardPointsEl) rewardPointsEl.textContent = `${rewardSummary.currentBalance ?? 0} pts`;
    const activeStatusBridge = document.getElementById("stat-active-session");
    if (activeStatusBridge) activeStatusBridge.textContent = activeSession ? "Parked" : "Not Parked";
    const totalSessBridge = document.getElementById("stat-total-sessions");
    if (totalSessBridge) totalSessBridge.textContent = `${sessions.length}`;
    updateCircularGauge(occupancyPercent, totalOccupied, totalCapacity);
    updateZoneWiseBars(currentLots);
    const activeLotCode = activeSession ? activeSession.lotCode : null;
    const initialZone = activeLotCode || "A";
    const selectedDest = document.getElementById("destination-select")?.value || "Engineering Hall";
    if (!campusMapInstance) {
      campusMapInstance = new CampusMapController({
        containerId: "dashboard-campus-map-container",
        lots: currentLots,
        selectedZone: initialZone,
        activeLotCode,
        showRoute: !!activeSession,
        onZoneSelect: (code) => {
          renderDashboardMapLotDetails(code, document.getElementById("destination-select")?.value || "Engineering Hall");
        }
      });
    } else {
      campusMapInstance.updateLots(currentLots, initialZone, activeLotCode);
    }
    renderDashboardMapLotDetails(initialZone, selectedDest);
    renderActiveSessionBanner(activeSession);
    loadRecommendations(selectedDest, currentLots);
    renderRecentActivity(sessions);
  }
  function renderDashboardMapLotDetails(lotCode, destinationBlock = "Engineering Hall") {
    const container = document.getElementById("dashboard-map-lot-details");
    if (!container || !currentLots || currentLots.length === 0) return;
    const lot = currentLots.find((l) => l.lotCode === lotCode) || currentLots[0];
    if (!lot) return;
    const available = Math.max(0, lot.totalCapacity - lot.occupiedSpaces);
    const availRatio = lot.totalCapacity > 0 ? available / lot.totalCapacity : 0;
    const occPercent = lot.totalCapacity > 0 ? Math.round(lot.occupiedSpaces / lot.totalCapacity * 100) : 0;
    const distance = lot.walkingDistances && lot.walkingDistances[destinationBlock] || 350;
    const walkMinutes = Math.max(1, Math.round(distance / 80));
    const isUnderutilized = availRatio >= 0.6;
    let badgeColor = "badge-success";
    let badgeText = "High Availability";
    let barColor = "bg-success";
    if (availRatio < 0.3) {
      badgeColor = "badge-danger";
      badgeText = "Almost Full";
      barColor = "bg-danger";
    } else if (availRatio < 0.6) {
      badgeColor = "badge-warning";
      badgeText = "Moderate Occupancy";
      barColor = "bg-warning";
    }
    container.innerHTML = `
    <div>
      <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
        <span class="badge badge-secondary font-mono" style="font-size: 11px;">Zone ${lot.lotCode}</span>
        <span class="badge ${badgeColor}" style="font-size: 11px;">${badgeText}</span>
      </div>

      <h4 style="margin-bottom: 2px; color: var(--color-primary);">${lot.lotName}</h4>
      <div class="text-muted" style="font-size: 11px; margin-bottom: var(--space-3);">
        Location: <strong>${lot.location}</strong>
      </div>

      <!-- Capacity Progress -->
      <div style="margin-bottom: var(--space-3);">
        <div class="flex justify-between items-center text-xs" style="margin-bottom: 2px;">
          <span class="text-muted">Available Bays:</span>
          <strong>${available} / ${lot.totalCapacity}</strong>
        </div>
        <div class="progress-bar-container" style="height: 6px;">
          <div class="progress-bar ${barColor}" style="width: ${occPercent}%;"></div>
        </div>
      </div>

      <div class="card" style="padding: 6px 10px; background: #f8fafc; border: 1px solid var(--color-border); margin-bottom: var(--space-3); font-size: 11px;">
        <span class="text-muted">Distance to ${destinationBlock}:</span>
        <div class="font-semibold text-navy" style="margin-top: 2px;">
          ${distance}m (~${walkMinutes} min walk)
        </div>
        ${isUnderutilized ? '<div style="color: #0F9D9A; font-weight: 600; font-size: 10px; margin-top: 2px;">+20 Bonus Points eligible</div>' : ""}
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <a href="./scan-parking.html?lotId=${lot.id}" class="btn btn-primary btn-sm w-full text-center">
        Scan QR to Park in Lot ${lot.lotCode} &rarr;
      </a>
      <a href="./campus-map.html?lot=${lot.lotCode}" class="btn btn-outline btn-sm w-full text-center" style="font-size: 11px;">
        View on Full Campus Map
      </a>
    </div>
  `;
  }
  function updateCircularGauge(percent, occupied, total) {
    const ring = document.getElementById("donut-progress-ring");
    const text = document.getElementById("donut-percent-text");
    const details = document.getElementById("donut-details-text");
    if (ring && text) {
      const circumference = 2 * Math.PI * 52;
      const offset = circumference * (1 - percent / 100);
      ring.style.strokeDashoffset = offset;
      text.textContent = `${percent}%`;
      if (percent > 85) ring.setAttribute("stroke", "#dc2626");
      else if (percent > 65) ring.setAttribute("stroke", "#f59e0b");
      else ring.setAttribute("stroke", "#0F9D9A");
    }
    if (details) {
      details.textContent = `${occupied} of ${total} campus slots occupied`;
    }
  }
  function updateZoneWiseBars(lots) {
    const container = document.getElementById("zonewise-bars-container");
    if (!container) return;
    container.innerHTML = lots.map((lot) => {
      const available = Math.max(0, lot.totalCapacity - lot.occupiedSpaces);
      const occPercent = Math.round(lot.occupiedSpaces / lot.totalCapacity * 100);
      const availRatio = lot.totalCapacity > 0 ? available / lot.totalCapacity : 0;
      let barColor = "#16a34a";
      if (availRatio < 0.3) barColor = "#dc2626";
      else if (availRatio < 0.6) barColor = "#f59e0b";
      return `
      <div>
        <div class="flex items-center justify-between text-xs" style="margin-bottom: 4px;">
          <span class="font-semibold text-navy">Lot ${lot.lotCode} &ndash; ${lot.lotName}</span>
          <span class="font-mono text-muted"><strong>${available} free</strong> / ${lot.totalCapacity} bays (${occPercent}% full)</span>
        </div>
        <div style="height: 10px; width: 100%; background: #f1f5f9; border-radius: 9999px; overflow: hidden;">
          <div style="height: 100%; width: ${occPercent}%; background: ${barColor}; border-radius: 9999px; transition: width 400ms ease;"></div>
        </div>
      </div>
    `;
    }).join("");
  }
  function renderActiveSessionBanner(activeSession) {
    const banner = document.getElementById("active-session-banner");
    if (!banner) return;
    if (activeTimerInterval) {
      clearInterval(activeTimerInterval);
      activeTimerInterval = null;
    }
    if (!activeSession) {
      banner.style.display = "none";
      return;
    }
    banner.style.display = "flex";
    banner.innerHTML = `
    <div style="flex: 1;">
      <div class="flex items-center gap-2" style="margin-bottom: 6px;">
        <span class="badge badge-info" style="font-weight: 700; font-size: 11px;">
          \u25CF ACTIVE BIKE SESSION
        </span>
        <span class="badge badge-secondary font-mono" style="font-size: 11px;">
          Lot ${activeSession.lotCode}
        </span>
      </div>
      <h3 style="margin-bottom: 4px; color: #1e40af;">Parked in ${activeSession.lotName}</h3>
      <div style="font-size: var(--font-size-xs); color: #334155; margin-bottom: 8px;">
        Vehicle: <strong class="font-mono">${activeSession.vehicleNumber}</strong> &bull; Checked in at ${formatDateTime(activeSession.entryTime)}
      </div>
      <div class="session-timer-display" id="live-session-timer">00:00:00</div>
    </div>
    <div class="flex flex-col gap-2 shrink-0">
      <button id="checkout-banner-btn" class="btn btn-secondary btn-lg" style="box-shadow: var(--shadow-md);">
        ${icon("check", 16)}
        <span>Check Out Now</span>
      </button>
      <a href="./find-vehicle.html" class="btn btn-outline" style="text-align: center; font-size: var(--font-size-xs);">
        ${icon("search", 14)}
        <span>View Route &amp; Details</span>
      </a>
    </div>
  `;
    const startTime = new Date(activeSession.entryTime).getTime();
    const timerEl = document.getElementById("live-session-timer");
    const updateTimer = () => {
      const elapsedMs = Math.max(0, Date.now() - startTime);
      const secs = Math.floor(elapsedMs / 1e3 % 60).toString().padStart(2, "0");
      const mins = Math.floor(elapsedMs / 6e4 % 60).toString().padStart(2, "0");
      const hrs = Math.floor(elapsedMs / 36e5).toString().padStart(2, "0");
      if (timerEl) {
        timerEl.textContent = `${hrs}:${mins}:${secs}`;
      }
    };
    updateTimer();
    activeTimerInterval = setInterval(updateTimer, 1e3);
    document.getElementById("checkout-banner-btn")?.addEventListener("click", () => {
      window.location.href = "./scan-parking.html?autoCheckout=true";
    });
  }
  async function loadRecommendations(destinationBlock, cachedLots = null) {
    let lots = cachedLots;
    if (!lots || lots.length === 0) {
      const lotsRes = await parkingApi.getLots();
      lots = lotsRes.data || [];
    }
    const ranked = recommendationService.rankLots(lots, destinationBlock);
    const topLot = ranked.find((l) => l.isRecommended) || ranked[0];
    const container = document.getElementById("recommendation-card-container");
    if (!container || !topLot) return;
    const availabilityBadge = renderAvailabilityBadge(topLot.availableSpaces, topLot.totalCapacity);
    container.innerHTML = `
    <div class="card recommendation-hero-card" style="padding: var(--space-4);">
      <div class="recommendation-badge-corner">
        Top Choice
      </div>
      <div>
        <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
          <div class="flex items-center gap-2">
            <span class="badge badge-secondary font-mono">Lot ${topLot.lotCode}</span>
            <h3 style="margin-bottom: 0; font-size: var(--font-size-md);">${topLot.lotName}</h3>
          </div>
          ${availabilityBadge}
        </div>
        <p class="text-muted" style="margin-bottom: var(--space-3); font-size: var(--font-size-xs);">
          ${topLot.location} &bull; <strong>${topLot.distanceMeters}m</strong> to ${destinationBlock} (~${topLot.walkingMinutes} min walk)
        </p>

        <!-- Occupancy Bar -->
        <div class="progress-bar-container" style="margin-bottom: 4px;">
          <div
            class="progress-bar ${topLot.availabilityRatio >= 0.6 ? "progress-success" : topLot.availabilityRatio >= 0.3 ? "progress-warning" : "progress-danger"}"
            style="width: ${Math.round(topLot.occupancyRatio * 100)}%;"
          ></div>
        </div>
        <div class="flex items-center justify-between font-mono text-muted" style="font-size: 11px; margin-bottom: var(--space-3);">
          <span>Occupied: ${topLot.occupiedSpaces} / ${topLot.totalCapacity}</span>
          <span><strong style="color: var(--color-success);">${topLot.availableSpaces} open bays</strong></span>
        </div>

        <div class="alert alert-success" style="padding: 0.5rem 0.75rem; font-size: var(--font-size-xs); margin-bottom: var(--space-3); border-radius: var(--radius-md);">
          <span style="font-weight: 700; color: var(--color-teal);">[TIP]</span>
          <div>
            <strong>Why Recommended:</strong> ${topLot.recommendationReason}
          </div>
        </div>

        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span class="badge" style="background: #fdfaf6; border: 1px dashed #f59e0b; color: #b45309; font-weight: 600;">
              +${topLot.potentialPoints} Points Eligible
            </span>
          </div>
          <div class="flex gap-2">
            <a href="./scan-parking.html?lotId=${topLot.id}" class="btn btn-primary btn-sm">
              Check In via QR
            </a>
            <a href="./parking-lots.html" class="btn btn-outline btn-sm">
              All Lots &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
  }
  function renderRecentActivity(sessions) {
    const container = document.getElementById("recent-activity-container");
    if (!container) return;
    if (sessions.length === 0) {
      container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">[No Lots Found]</div>
        <div class="empty-state-title">No Parking Activity Yet</div>
        <div class="empty-state-text">Your completed parking sessions and reward points will appear here.</div>
        <a href="./scan-parking.html" class="btn btn-primary btn-sm">Scan QR to Start First Session</a>
      </div>
    `;
      return;
    }
    const rowsHtml = sessions.slice(0, 5).map((sess) => {
      return `
      <tr>
        <td>
          <div class="flex items-center gap-2">
            <span style="color: ${sess.status === "active" ? "#2563eb" : "#94a3b8"};">
              ${icon("bike", 16)}
            </span>
            <strong>${sess.vehicleNumber}</strong>
          </div>
        </td>
        <td>
          <strong>${sess.lotName}</strong>
          ${sess.lotCode ? `<span class="badge badge-secondary font-mono" style="margin-left: 4px; font-size: 10px;">Lot ${sess.lotCode}</span>` : ""}
        </td>
        <td class="font-mono text-muted" style="font-size: 11px;">${formatDateTime(sess.entryTime)}</td>
        <td class="font-mono text-muted" style="font-size: 11px;">${sess.exitTime ? formatDateTime(sess.exitTime) : '<span class="text-teal font-semibold">Active</span>'}</td>
        <td>${renderSessionBadge(sess.status)}</td>
        <td>
          <span class="badge ${sess.pointsEarned > 0 ? "badge-accent" : "badge-secondary"}" style="font-size: 11px;">
            +${sess.pointsEarned} pts
          </span>
        </td>
      </tr>
    `;
    }).join("");
    container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Vehicle Plate</th>
            <th>Parking Zone</th>
            <th>Entry Time</th>
            <th>Exit Time</th>
            <th>Status</th>
            <th>Reward</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
  }
})();
