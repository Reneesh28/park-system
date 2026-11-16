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
        if (item === null || item === void 0) return defaultValue;
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      } catch (e) {
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
      return Boolean(storageService.get("current_user"));
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
     * for the allowed role so that direct file opens (e.g. file:///.../student-dashboard.html)
     * or role switching work immediately without any redirect loops or lockouts.
     * @param {Object} options
     * @param {string[]} [options.allowedRoles=['student', 'admin']]
     * @param {string} [options.redirectUrl='../login.html']
     * @param {string} [options.basePath='../']
     * @returns {Object|null} Authenticated user
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
        if (fallbackUser) {
          storageService.set("current_user", fallbackUser);
          storageService.set("auth_token", `demo-token-${fallbackUser.id}`);
          return fallbackUser;
        }
        window.location.href = redirectUrl;
        return null;
      }
      const user = this.getUser();
      if (!allowedRoles.includes(user.role)) {
        const users = storageService.get("users", []);
        const switchUser = users.find((u) => allowedRoles.includes(u.role));
        if (switchUser) {
          storageService.set("current_user", switchUser);
          storageService.set("auth_token", `demo-token-${switchUser.id}`);
          return switchUser;
        }
        return user;
      }
      return user;
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
    dashboard: "Home",
    "find-parking": "Find Parking",
    "parking-lots": "Find Parking",
    "my-parking": "My Parking",
    "find-vehicle": "My Parking",
    "parking-history": "My Parking",
    "scan-parking": "Scan QR Code",
    rewards: "Rewards",
    profile: "Profile",
    admin: "Admin Dashboard"
  };
  function renderNavbar({ activePage = "", basePath = "./" } = {}) {
    const currentUser = storageService.get("current_user");
    const pageTitle = PAGE_TITLES[activePage] || "ParkWise";
    const userControlsHtml = currentUser ? `
      <div class="flex items-center gap-2">
        <!-- Quick Vehicle Search -->
        <div class="header-search-box" style="position: relative; display: inline-flex; align-items: center;">
          <span style="position: absolute; left: 10px; color: var(--color-text-subtle); pointer-events: none;">
            ${icon("search", 14)}
          </span>
          <input
            type="text"
            id="nav-quick-search-input"
            class="form-input"
            placeholder="Search bike number"
            style="width: 160px; height: 32px; padding-left: 30px; font-size: var(--font-size-xs); text-transform: uppercase; border-radius: 8px; background: #f8fafc;"
            aria-label="Search bike registration"
          >
        </div>

        <!-- User Role Avatar Pill -->
        <a href="${basePath}pages/profile.html" class="user-pill flex items-center gap-2" style="background: var(--color-bg-alt); padding: 5px 12px; border-radius: 20px; font-size: var(--font-size-xs); color: var(--color-primary); text-decoration: none; border: 1px solid var(--color-border);">
          <span>${icon("user", 14)}</span>
          <span class="hidden sm:inline"><strong>${(currentUser.name || currentUser.fullName || "Student").split(" ")[0]}</strong></span>
        </a>

        <button id="nav-logout-btn" class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px;">
          Log Out
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
                Campus Mobility
              </div>
            </div>
          </a>

          <div class="hidden md:block" style="border-left: 1px solid var(--color-border); padding-left: 12px; margin-left: 4px; font-size: var(--font-size-sm); font-weight: 600; color: #334155;">
            ${pageTitle}
          </div>
        </div>

        <!-- User Controls / Search -->
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
            const prefix = window.location.pathname.includes("/pages/") ? "./" : "./pages/";
            window.location.href = `${prefix}my-parking.html?q=${encodeURIComponent(val)}`;
          }
        }
      });
    }
  }

  // frontend/js/components/sidebar.component.js
  function renderStudentSidebar(activePage = "", basePath = "./") {
    const items = [
      { id: "dashboard", label: "Home", icon: "grid", href: `${basePath}pages/student-dashboard.html` },
      { id: "find-parking", label: "Find Parking", icon: "search", href: `${basePath}pages/parking-lots.html` },
      { id: "my-parking", label: "My Parking", icon: "bike", href: `${basePath}pages/my-parking.html` },
      { id: "rewards", label: "Rewards", icon: "gift", href: `${basePath}pages/rewards.html` },
      { id: "profile", label: "Profile", icon: "user", href: `${basePath}pages/profile.html` }
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
    const mobileMenuHtml = items.map((item) => {
      const isActive = activePage === item.id ? "active" : "";
      return `
        <a href="${item.href}" class="mobile-subnav-link ${isActive}">
          ${icon(item.icon, 16)}
          <span>${item.label}</span>
        </a>
      `;
    }).join("");
    return `
    <!-- Mobile Bottom Navigation (Visible on mobile screens < 768px) -->
    <nav class="mobile-subnav">
      ${mobileMenuHtml}
    </nav>

    <!-- Desktop Sidebar (Visible on desktop screens >= 768px) -->
    <aside class="dashboard-sidebar">
      <div>
        <div style="font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.75rem; padding-left: 0.5rem; letter-spacing: 0.5px;">
          Menu
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
        ParkWise Campus Mobility
      </div>
    </aside>
  `;
  }
  function renderAdminSidebar(activePage = "", basePath = "../") {
    const items = [
      { id: "admin-dashboard", label: "Admin Dashboard", icon: "sliders", href: `${basePath}pages/admin-dashboard.html` },
      { id: "find-parking", label: "Campus Lots", icon: "map", href: `${basePath}pages/parking-lots.html` },
      { id: "profile", label: "Admin Profile", icon: "user", href: `${basePath}pages/profile.html` }
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
    const mobileMenuHtml = items.map((item) => {
      const isActive = activePage === item.id ? "active" : "";
      return `
        <a href="${item.href}" class="mobile-subnav-link ${isActive}">
          ${icon(item.icon, 16)}
          <span>${item.label}</span>
        </a>
      `;
    }).join("");
    return `
    <nav class="mobile-subnav">
      ${mobileMenuHtml}
    </nav>

    <aside class="dashboard-sidebar">
      <div>
        <div style="font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase; color: #f59e0b; margin-bottom: 0.75rem; padding-left: 0.5rem; letter-spacing: 0.5px;">
          Admin Menu
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
        Campus Transport Authority
      </div>
    </aside>
  `;
  }

  // frontend/js/api/api.js
  var API_CONFIG = {
    baseURL: "http://localhost:5000/api",
    isMock: true,
    mockDelayMs: 250,
    timeoutMs: 8e3,
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

  // frontend/js/api/parking.api.js
  var parkingApi = {
    /**
     * Fetch all campus parking lots with dynamically computed availability.
     */
    async getLots() {
      await delay(150);
      const lots = storageService.get("lots", []);
      const computed = lots.map((lot) => {
        const total = Number(lot.totalCapacity) || 1;
        const occupied = Math.max(0, Number(lot.occupiedSpaces) || 0);
        const available = Math.max(0, total - occupied);
        return {
          ...lot,
          totalCapacity: total,
          occupiedSpaces: occupied,
          availableSpaces: available,
          occupancyPercentage: Math.round(occupied / total * 100),
          availabilityPercentage: Math.round(available / total * 100)
        };
      });
      return createApiResponse(true, computed, "Fetched parking lots");
    },
    /**
     * Fetch a parking lot by its unique identifier.
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
        (l) => (l.qrCodeId || "").toUpperCase() === normalizedQr || l.lotCode === normalizedQr
      );
      if (!lot) {
        return createApiResponse(false, null, `Invalid or unrecognized parking QR code: "${qrCodeId}"`, 404);
      }
      return createApiResponse(true, lot, "QR code successfully verified");
    },
    /**
     * Start parking session via QR code check-in.
     */
    async checkIn({ lotId, vehicleNumber, userId }) {
      await delay(250);
      const sessions = storageService.get("sessions", []);
      const lots = storageService.get("lots", []);
      const existingActive = sessions.find((s) => s.userId === userId && s.status === "active");
      if (existingActive) {
        const lot2 = lots.find((l) => l.id === existingActive.lotId);
        return createApiResponse(
          false,
          existingActive,
          `Active session already exists! You are currently parked in ${lot2 ? lot2.lotName : "another lot"}.`,
          400
        );
      }
      const lotIndex = lots.findIndex((l) => l.id === lotId || l.lotCode === lotId);
      if (lotIndex === -1) {
        return createApiResponse(false, null, "Parking lot not found.", 404);
      }
      const lot = lots[lotIndex];
      if (lot.isActive === false) {
        return createApiResponse(false, null, `${lot.lotName} is currently closed for maintenance.`, 400);
      }
      if (lot.occupiedSpaces >= lot.totalCapacity) {
        return createApiResponse(false, null, `${lot.lotName} is currently full (100% capacity). Please select an alternative lot.`, 400);
      }
      lot.occupiedSpaces += 1;
      lots[lotIndex] = lot;
      storageService.set("lots", lots);
      const newSession = {
        id: `sess_${Date.now()}`,
        userId,
        lotId: lot.id,
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
      return createApiResponse(true, { session: newSession, lot }, "Check-in successful! Welcome to campus.", 201);
    },
    /**
     * Alias for checkIn.
     */
    async checkinSession(params) {
      return this.checkIn(params);
    },
    /**
     * End active parking session via checkout.
     */
    async checkOut({ sessionId, userId }) {
      await delay(250);
      const sessions = storageService.get("sessions", []);
      const lots = storageService.get("lots", []);
      const users = storageService.get("users", []);
      const ledger = storageService.get("reward_ledger", []);
      let sessionIndex = -1;
      if (userId) {
        sessionIndex = sessions.findIndex((s) => s.id === sessionId && s.userId === userId && s.status === "active");
      } else {
        sessionIndex = sessions.findIndex((s) => s.id === sessionId && s.status === "active");
      }
      if (sessionIndex === -1) {
        return createApiResponse(false, null, "No active parking session found for checkout.", 404);
      }
      const session = sessions[sessionIndex];
      const lotIndex = lots.findIndex((l) => l.id === session.lotId);
      const lot = lotIndex !== -1 ? lots[lotIndex] : null;
      if (lot && lot.occupiedSpaces > 0) {
        lot.occupiedSpaces -= 1;
        lots[lotIndex] = lot;
        storageService.set("lots", lots);
      }
      const availRatio = lot && lot.totalCapacity > 0 ? (lot.totalCapacity - lot.occupiedSpaces) / lot.totalCapacity : 0;
      const pointsEarned = availRatio >= 0.6 ? 20 : 10;
      session.exitTime = (/* @__PURE__ */ new Date()).toISOString();
      session.status = "completed";
      session.pointsEarned = pointsEarned;
      sessions[sessionIndex] = session;
      storageService.set("sessions", sessions);
      const userIndex = users.findIndex((u) => u.id === session.userId);
      if (userIndex !== -1) {
        users[userIndex].rewardPoints = (users[userIndex].rewardPoints || 0) + pointsEarned;
        storageService.set("users", users);
      }
      const newTx = {
        id: `tx_${Date.now()}`,
        userId: session.userId,
        sessionId: session.id,
        lotId: session.lotId,
        lotName: session.lotName,
        type: "earn",
        points: pointsEarned,
        description: `Parking check-in/out reward at ${session.lotName} (+${pointsEarned} pts)`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      ledger.unshift(newTx);
      storageService.set("reward_ledger", ledger);
      return createApiResponse(
        true,
        { session, lot, pointsEarned, totalPoints: userIndex !== -1 ? users[userIndex].rewardPoints : pointsEarned },
        `Checked out successfully! You earned +${pointsEarned} reward points.`
      );
    },
    /**
     * Alias for checkOut.
     */
    async checkoutSession(params) {
      return this.checkOut(params);
    },
    /**
     * Retrieve active session for a given user.
     */
    async getActiveSession(userId) {
      const sessions = storageService.get("sessions", []);
      const lotsRes = await this.getLots();
      const lots = lotsRes.data || [];
      const active = sessions.find((s) => s.userId === userId && s.status === "active");
      if (!active) {
        return createApiResponse(true, null, "No active session");
      }
      const lot = lots.find((l) => l.id === active.lotId) || null;
      return createApiResponse(true, { ...active, lot }, "Active session retrieved");
    },
    /**
     * Retrieve session history for a student.
     */
    async getUserSessions(userId) {
      const sessions = storageService.get("sessions", []);
      const lotsRes = await this.getLots();
      const lots = lotsRes.data || [];
      const userSessions = sessions.filter((s) => s.userId === userId).map((s) => {
        const lot = lots.find((l) => l.id === s.lotId);
        return {
          ...s,
          lotName: lot ? lot.lotName : s.lotName || "Campus Lot"
        };
      });
      return createApiResponse(true, userSessions, "User sessions retrieved");
    },
    /**
     * Admin: Update parking lot information or capacity.
     */
    async updateLot(lotId, { lotName, location, totalCapacity, isActive }) {
      await delay(200);
      const lots = storageService.get("lots", []);
      const index = lots.findIndex((l) => l.id === lotId || l.lotCode === lotId);
      if (index === -1) {
        return createApiResponse(false, null, "Parking lot not found", 404);
      }
      const lot = lots[index];
      const newCapacity = Number(totalCapacity);
      if (newCapacity < lot.occupiedSpaces) {
        return createApiResponse(
          false,
          null,
          `Cannot reduce total capacity to ${newCapacity}. Current occupied spaces is ${lot.occupiedSpaces}.`,
          400
        );
      }
      lot.lotName = lotName || lot.lotName;
      lot.location = location || lot.location;
      lot.totalCapacity = newCapacity > 0 ? newCapacity : lot.totalCapacity;
      if (typeof isActive === "boolean") lot.isActive = isActive;
      lots[index] = lot;
      storageService.set("lots", lots);
      return createApiResponse(true, lot, "Parking lot updated successfully");
    }
  };

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

  // frontend/js/pages/my-parking.page.js
  var liveTimerInterval = null;
  var searchQuery = "";
  document.addEventListener("DOMContentLoaded", async () => {
    const user = authMiddleware.requireAuth({
      allowedRoles: ["student", "admin"],
      redirectUrl: "../login.html",
      basePath: "../"
    });
    if (!user) return;
    const navContainer = document.getElementById("navbar-container");
    if (navContainer) {
      navContainer.innerHTML = renderNavbar({ activePage: "my-parking", basePath: "../" });
      initNavbarEvents("../login.html");
    }
    const sidebarContainer = document.getElementById("sidebar-container");
    if (sidebarContainer) {
      if (user.role === "admin") {
        sidebarContainer.innerHTML = renderAdminSidebar("my-parking", "../");
      } else {
        sidebarContainer.innerHTML = renderStudentSidebar("my-parking", "../");
      }
    }
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q");
    if (q) {
      searchQuery = q.trim().toUpperCase();
      const filterInput2 = document.getElementById("history-search-input");
      if (filterInput2) filterInput2.value = searchQuery;
    }
    const filterInput = document.getElementById("history-search-input");
    if (filterInput) {
      filterInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim().toUpperCase();
        renderPreviousSessions();
      });
    }
    await refreshMyParking();
  });
  async function refreshMyParking() {
    renderActiveParkingSession();
    renderPreviousSessions();
  }
  function renderActiveParkingSession() {
    const container = document.getElementById("my-active-session-container");
    if (!container) return;
    if (liveTimerInterval) {
      clearInterval(liveTimerInterval);
      liveTimerInterval = null;
    }
    const user = authMiddleware.getUser();
    const sessions = storageService.get("sessions", []);
    const activeSession = sessions.find((s) => {
      if (s.status !== "active") return false;
      if (searchQuery) return s.vehicleNumber.toUpperCase().includes(searchQuery);
      return s.userId === user?.id;
    });
    if (activeSession) {
      let updateClock = function() {
        const now = Date.now();
        const diffMs = Math.max(0, now - entryDate.getTime());
        const totalSec = Math.floor(diffMs / 1e3);
        const hours = String(Math.floor(totalSec / 3600)).padStart(2, "0");
        const mins = String(Math.floor(totalSec % 3600 / 60)).padStart(2, "0");
        const secs = String(totalSec % 60).padStart(2, "0");
        if (clockEl) clockEl.textContent = `${hours}:${mins}:${secs}`;
      };
      const entryDate = new Date(activeSession.entryTime);
      container.innerHTML = `
      <div style="background: #eff6ff; border: 2px solid #2563eb; border-radius: 12px; padding: var(--space-4); box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
        <div class="flex items-center justify-between flex-wrap gap-2" style="margin-bottom: var(--space-2);">
          <div class="flex items-center gap-2">
            <span class="badge badge-info" style="font-size: 11px; padding: 3px 8px; text-transform: uppercase;">
              Active Parking Session
            </span>
            <span class="badge badge-secondary" style="font-size: 11px;">
              Lot ${activeSession.lotCode || "Zone"}
            </span>
          </div>
          <div class="font-mono" style="font-size: var(--font-size-sm); color: #1e3a8a;">
            Vehicle Plate: <strong>${activeSession.vehicleNumber}</strong>
          </div>
        </div>

        <div class="flex items-center justify-between flex-wrap gap-4" style="margin-top: var(--space-3);">
          <div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #1e3a8a;">
              ${activeSession.lotName}
            </div>
            <div class="text-muted" style="font-size: var(--font-size-xs); margin-top: 2px;">
              Parked since ${entryDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &bull; ${entryDate.toLocaleDateString()}
            </div>
            <div id="live-session-clock" class="font-mono" style="font-size: 1.5rem; font-weight: 700; color: #1d4ed8; margin-top: 6px;">
              00:00:00
            </div>
          </div>

          <div>
            <button id="btn-checkout-myparking" class="btn btn-primary" style="padding: 9px 18px; font-size: var(--font-size-sm); background: #1d4ed8; border-color: #1d4ed8;">
              Check Out &amp; Collect Points
            </button>
          </div>
        </div>
      </div>
    `;
      const clockEl = document.getElementById("live-session-clock");
      updateClock();
      liveTimerInterval = setInterval(updateClock, 1e3);
      document.getElementById("btn-checkout-myparking")?.addEventListener("click", async () => {
        const btn = document.getElementById("btn-checkout-myparking");
        if (btn) {
          btn.disabled = true;
          btn.textContent = "Processing Checkout...";
        }
        const res = await parkingApi.checkoutSession({
          sessionId: activeSession.id,
          lotId: activeSession.lotId
        });
        if (res.success) {
          showToast(`Checked out successfully! Earned +${res.data.pointsEarned} reward points.`, "success");
          await refreshMyParking();
        } else {
          showToast(res.message || "Checkout failed", "danger");
          if (btn) {
            btn.disabled = false;
            btn.textContent = "Check Out & Collect Points";
          }
        }
      });
    } else {
      container.innerHTML = `
      <div style="background: #ffffff; border: 1px solid var(--color-border); border-radius: 12px; padding: var(--space-4); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3);">
        <div>
          <div style="font-weight: 700; color: var(--color-primary); font-size: var(--font-size-sm);">
            No Active Parking Session
          </div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">
            ${searchQuery ? `No active session found for plate "${searchQuery}".` : "You do not have a two-wheeler parked on campus right now."}
          </div>
        </div>
        <a href="./parking-lots.html" class="btn btn-secondary btn-sm">
          Find Available Parking
        </a>
      </div>
    `;
    }
  }
  function renderPreviousSessions() {
    const container = document.getElementById("my-sessions-list");
    if (!container) return;
    const user = authMiddleware.getUser();
    const sessions = storageService.get("sessions", []);
    let completed = sessions.filter((s) => s.status === "completed");
    if (user?.role !== "admin") {
      completed = completed.filter((s) => s.userId === user?.id);
    }
    if (searchQuery) {
      completed = completed.filter((s) => s.vehicleNumber.toUpperCase().includes(searchQuery));
    }
    if (completed.length === 0) {
      container.innerHTML = `
      <div style="padding: var(--space-4); text-align: center; color: var(--color-text-muted); font-size: var(--font-size-xs);">
        No previous parking sessions found.
      </div>
    `;
      return;
    }
    const cardsHtml = completed.map((s) => {
      const entryDate = new Date(s.entryTime);
      const exitDate = s.exitTime ? new Date(s.exitTime) : null;
      let durationStr = "--";
      if (exitDate) {
        const diffMins = Math.max(1, Math.round((exitDate.getTime() - entryDate.getTime()) / (1e3 * 60)));
        durationStr = diffMins >= 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m` : `${diffMins} mins`;
      }
      return `
        <div style="padding: var(--space-3); border: 1px solid var(--color-border); border-radius: 8px; background: #f8fafc; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-2);">
          <div>
            <div class="flex items-center gap-2">
              <span style="font-weight: 700; color: var(--color-primary); font-size: var(--font-size-sm);">
                ${s.lotName}
              </span>
              <span class="badge badge-outline font-mono" style="font-size: 10px;">
                Lot ${s.lotCode || "A"}
              </span>
            </div>
            <div class="text-muted" style="font-size: 11px; margin-top: 2px;">
              ${formatDateTime(s.entryTime)} &bull; Vehicle: <span class="font-mono font-semibold">${s.vehicleNumber}</span> &bull; Duration: <strong>${durationStr}</strong>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="badge badge-success" style="font-size: 10px;">
              Completed
            </span>
            <span class="badge ${s.pointsEarned > 0 ? "badge-accent" : "badge-secondary"}" style="font-size: 11px;">
              +${s.pointsEarned || 0} pts
            </span>
          </div>
        </div>
      `;
    }).join("");
    container.innerHTML = cardsHtml;
  }
})();
