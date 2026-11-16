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
  function renderAdminSidebar(activePage = "", basePath = "../") {
    const items = [
      { id: "admin-dashboard", label: "Admin Analytics", icon: "sliders", href: `${basePath}pages/admin-dashboard.html` },
      { id: "parking-lots", label: "Campus Lots", icon: "parking", href: `${basePath}pages/parking-lots.html` },
      { id: "campus-map", label: "Campus Map", icon: "map", href: `${basePath}pages/campus-map.html` },
      { id: "parking-history", label: "Session Records", icon: "history", href: `${basePath}pages/parking-history.html` }
    ];
    const desktopMenuHtml = items.map((item) => {
      const isActive = activePage === item.id ? "active" : "";
      return `
        <li class="sidebar-item ${isActive}">
          <a href="${item.href}">
            ${icon(item.icon, 18)}
            <span>${item.label}</span>
          </a>
        </li>
      `;
    }).join("");
    return `
    <nav class="mobile-subnav" aria-label="Mobile Admin Navigation">
      <a href="${basePath}pages/admin-dashboard.html" class="mobile-subnav-link ${activePage === "admin-dashboard" ? "active" : ""}">
        ${icon("sliders", 18)}
        <span>Analytics</span>
      </a>
      <a href="${basePath}pages/parking-lots.html" class="mobile-subnav-link ${activePage === "parking-lots" ? "active" : ""}">
        ${icon("parking", 18)}
        <span>Lots</span>
      </a>
      <a href="${basePath}pages/campus-map.html" class="mobile-subnav-link ${activePage === "campus-map" ? "active" : ""}">
        ${icon("map", 18)}
        <span>Map</span>
      </a>
      <a href="${basePath}pages/student-dashboard.html" class="mobile-subnav-link">
        ${icon("user", 18)}
        <span>Student</span>
      </a>
    </nav>

    <aside class="dashboard-sidebar">
      <div>
        <div style="font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase; color: #f59e0b; margin-bottom: 0.75rem; padding-left: 0.5rem; letter-spacing: 0.5px;">
          Admin Console
        </div>
        <ul class="sidebar-menu">
          ${desktopMenuHtml}
        </ul>
      </div>

      <div class="sidebar-footer-note">
        <div class="flex items-center justify-between" style="margin-bottom: 6px;">
          <span style="font-weight: 600; color: #ffffff; font-size: 11px;">Student Portal</span>
          <a href="${basePath}pages/student-dashboard.html" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 10px; border-radius: 4px;">
            Student View &rarr;
          </a>
        </div>
        Campus Transport Authority. Full capacity control &amp; live session monitoring.
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

  // frontend/js/pages/profile.page.js
  var currentUser = null;
  document.addEventListener("DOMContentLoaded", () => {
    currentUser = authMiddleware.requireAuth({
      allowedRoles: ["student", "admin"],
      redirectUrl: "../login.html",
      basePath: "../"
    });
    if (!currentUser) return;
    const headerContainer = document.getElementById("navbar-container");
    if (headerContainer) {
      headerContainer.innerHTML = renderNavbar({ activePage: "profile", basePath: "../" });
      initNavbarEvents("../login.html");
    }
    const sidebarContainer = document.getElementById("sidebar-container");
    if (sidebarContainer) {
      if (currentUser.role === "admin") {
        sidebarContainer.innerHTML = renderAdminSidebar("profile", "../");
      } else {
        sidebarContainer.innerHTML = renderStudentSidebar("profile", "../");
      }
      initSidebarEvents();
    }
    const fullNameEl = document.getElementById("profile-full-name");
    const initialsEl = document.getElementById("profile-initials");
    const studentIdEl = document.getElementById("profile-student-id");
    const emailEl = document.getElementById("profile-email");
    const roleBadgeEl = document.getElementById("profile-role-badge");
    const balanceEl = document.getElementById("profile-wallet-balance");
    const plateEl = document.getElementById("profile-plate-number");
    if (fullNameEl) fullNameEl.textContent = currentUser.fullName || "Student User";
    if (initialsEl && currentUser.fullName) {
      const parts = currentUser.fullName.split(" ");
      initialsEl.textContent = (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
    }
    if (studentIdEl) studentIdEl.textContent = currentUser.studentId || "2024-STU-8821";
    if (emailEl) emailEl.textContent = currentUser.email || "student@university.edu";
    if (roleBadgeEl) roleBadgeEl.textContent = currentUser.role === "admin" ? "Campus Admin" : "Student";
    if (balanceEl) balanceEl.textContent = `${currentUser.rewardPoints || 0} pts`;
    if (plateEl) plateEl.textContent = currentUser.vehicleNumber || "PB08-AX-9941";
    document.getElementById("profile-logout-btn")?.addEventListener("click", async () => {
      await authApi.logout();
      showToast("Signed out of ParkWise", "info");
      setTimeout(() => {
        window.location.href = "../login.html";
      }, 400);
    });
  });
})();
