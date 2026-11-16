(() => {
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

  // frontend/js/api/auth.api.js
  var authApi = {
    /**
     * Log in user with credentials against backend or fallback local storage.
     * Supports either (email, password) or ({ email, password }).
     * @param {string|object} emailOrObj 
     * @param {string} [maybePassword] 
     */
    async login(emailOrObj, maybePassword) {
      let email = emailOrObj;
      let password = maybePassword;
      if (typeof emailOrObj === "object" && emailOrObj !== null) {
        email = emailOrObj.email;
        password = emailOrObj.password;
      }
      const payload = {
        email: (email || "").trim().toLowerCase(),
        password: password || ""
      };
      const mockFallback = () => {
        const users = storageService.get("users", []);
        const user = users.find(
          (u) => u.email.toLowerCase() === payload.email && u.password === payload.password
        );
        if (!user) {
          return createApiResponse(false, null, "Invalid email or password. Please try again.", 401);
        }
        if (user.isActive === false) {
          return createApiResponse(false, null, "Your account has been deactivated by administration.", 403);
        }
        const safeUser = { ...user };
        delete safeUser.password;
        storageService.set("current_user", safeUser);
        storageService.set("auth_token", `mock_token_${Date.now()}_${user.id}`);
        return createApiResponse(true, { user: safeUser, accessToken: "mock_token" }, "Authentication successful");
      };
      const res = await apiRequest(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(payload)
        },
        mockFallback
      );
      if (res.success && res.data) {
        const rawUser = res.data.user || {};
        const safeUser = {
          id: rawUser._id || rawUser.id || "usr_001",
          _id: rawUser._id || rawUser.id || "usr_001",
          name: rawUser.fullName || rawUser.name || "Student",
          fullName: rawUser.fullName || rawUser.name || "Student",
          email: rawUser.email,
          studentId: rawUser.studentId,
          role: rawUser.role || "student",
          walletBalance: rawUser.rewardPoints ?? rawUser.walletBalance ?? 0,
          rewardPoints: rawUser.rewardPoints ?? rawUser.walletBalance ?? 0,
          vehicle: rawUser.vehicles?.[0] || rawUser.vehicle || {
            vehicleNumber: "CW-4482",
            vehicleType: "two-wheeler",
            isPrimary: true
          }
        };
        storageService.set("current_user", safeUser);
        if (res.data.accessToken) {
          storageService.set("auth_token", res.data.accessToken);
        }
        return createApiResponse(true, { user: safeUser, token: res.data.accessToken }, res.message || "Authentication successful");
      }
      return res;
    },
    /**
     * Register a new student account.
     * @param {Object} registrationData 
     */
    async register(registrationData) {
      const payload = {
        fullName: (registrationData.fullName || registrationData.name || "").trim(),
        email: (registrationData.email || "").trim().toLowerCase(),
        studentId: (registrationData.studentId || "").trim().toUpperCase(),
        password: registrationData.password,
        confirmPassword: registrationData.confirmPassword || registrationData.password,
        vehicleNumber: registrationData.vehicleNumber || "CW-4482",
        vehicleType: registrationData.vehicleType || "two-wheeler"
      };
      const mockFallback = () => {
        const users = storageService.get("users", []);
        if (users.some((u) => u.email.toLowerCase() === payload.email)) {
          return createApiResponse(false, null, "An account with this email address already exists.", 409);
        }
        const newUser = {
          id: `usr_${Date.now()}`,
          role: "student",
          studentId: payload.studentId,
          name: payload.fullName,
          fullName: payload.fullName,
          email: payload.email,
          walletBalance: 0,
          vehicle: {
            vehicleNumber: payload.vehicleNumber.trim().toUpperCase(),
            vehicleType: payload.vehicleType || "two-wheeler",
            isPrimary: true
          },
          isActive: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        users.push(newUser);
        storageService.set("users", users);
        storageService.set("current_user", newUser);
        storageService.set("auth_token", `mock_token_${Date.now()}`);
        return createApiResponse(true, { user: newUser }, "Student account registered successfully", 201);
      };
      const res = await apiRequest(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify(payload)
        },
        mockFallback
      );
      if (res.success && res.data?.user) {
        return await this.login(payload.email, payload.password);
      }
      return res;
    },
    /**
     * Retrieve currently authenticated user.
     */
    async getCurrentUser() {
      const user = storageService.get("current_user");
      if (!user) {
        return createApiResponse(false, null, "No active session", 401);
      }
      return createApiResponse(true, user, "Active session active");
    },
    /**
     * Sign out current user.
     */
    async logout() {
      await apiRequest("/auth/logout", { method: "POST" }, () => createApiResponse(true, null));
      storageService.remove("current_user");
      storageService.remove("auth_token");
      return createApiResponse(true, null, "Signed out successfully");
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

  // frontend/js/pages/index.page.js
  document.addEventListener("DOMContentLoaded", async () => {
    const initTimestampEl = document.getElementById("init-timestamp");
    const mockLotsCountEl = document.getElementById("mock-lots-count");
    const apiStatusEl = document.getElementById("api-status");
    const campusCapacityEl = document.getElementById("campus-capacity-status");
    if (initTimestampEl) {
      initTimestampEl.textContent = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    }
    if (apiStatusEl) {
      apiStatusEl.textContent = API_CONFIG.isMock ? "Mock State (Phase 1 Complete)" : "Live API Connected";
    }
    const lotsRes = await parkingApi.getLots();
    const lots = lotsRes.data || [];
    const totalCapacity = lots.reduce((acc, l) => acc + l.totalCapacity, 0);
    const totalOccupied = lots.reduce((acc, l) => acc + l.occupiedSpaces, 0);
    const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
    if (mockLotsCountEl) {
      mockLotsCountEl.textContent = `${lots.length} Campus Lots`;
    }
    if (campusCapacityEl) {
      campusCapacityEl.textContent = `${totalAvailable} / ${totalCapacity} Bays Open`;
    }
    document.getElementById("quick-student-login-btn")?.addEventListener("click", async () => {
      const res = await authApi.login({
        email: "alex.rivera@campus.edu",
        password: "StudentPass123"
      });
      if (res.success) {
        showToast("Logged in as Student Alex Rivera", "success");
        setTimeout(() => {
          window.location.href = "./pages/student-dashboard.html";
        }, 400);
      }
    });
    document.getElementById("quick-admin-login-btn")?.addEventListener("click", async () => {
      const res = await authApi.login({
        email: "admin@campus.edu",
        password: "AdminPass123"
      });
      if (res.success) {
        showToast("Logged in as Campus Admin", "success");
        setTimeout(() => {
          window.location.href = "./pages/admin-dashboard.html";
        }, 400);
      }
    });
    document.getElementById("portal-reset-data-btn")?.addEventListener("click", () => {
      const modalHtml = `
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="text-warning font-semibold">Notice</div>
          <div>
            <h3 style="margin-bottom: var(--space-1); color: var(--color-danger);">Restore Clean Mock Data?</h3>
            <p class="text-muted" style="margin-bottom: 0; font-size: var(--font-size-sm);">
              This will restore all parking lots, active sessions, and student balances to factory mock defaults.
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-2" style="margin-top: var(--space-2);">
          <button id="modal-portal-cancel-btn" class="btn btn-outline">Cancel</button>
          <button id="modal-portal-confirm-btn" class="btn btn-danger">Confirm Reset</button>
        </div>
      </div>
    `;
      openModal("Factory Reset Mock Data", modalHtml);
      document.getElementById("modal-portal-cancel-btn")?.addEventListener("click", closeModal);
      document.getElementById("modal-portal-confirm-btn")?.addEventListener("click", () => {
        closeModal();
        storageService.resetToFactoryDefaults();
        showToast("Restored all demo state to factory defaults!", "success");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      });
    });
    console.log("[ParkWise] System initialized successfully. Phase 1 (1.1\u20131.10) active.");
  });
})();
