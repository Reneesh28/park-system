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

  // frontend/js/utils/validators.js
  function isValidEmail(email) {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
  function isValidPassword(password) {
    if (!password || typeof password !== "string") return false;
    return password.length >= 8 && /\d/.test(password);
  }
  function isValidPlateNumber(plate) {
    if (!plate || typeof plate !== "string") return false;
    return plate.trim().length >= 3;
  }

  // frontend/js/pages/register.page.js
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");
    const errorContainer = document.getElementById("error-container");
    const submitBtn = document.getElementById("submit-btn");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorContainer.style.display = "none";
      errorContainer.innerHTML = "";
      const fullName = document.getElementById("full-name").value.trim();
      const email = document.getElementById("email").value.trim();
      const studentId = document.getElementById("student-id").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      const vehicleNumber = document.getElementById("vehicle-number").value.trim();
      const vehicleType = document.getElementById("vehicle-type").value;
      const errors = [];
      if (!fullName || fullName.length < 2) {
        errors.push("Full name must be at least 2 characters long.");
      }
      if (!isValidEmail(email)) {
        errors.push("Please provide a valid institutional campus email.");
      }
      if (!studentId || studentId.length < 3) {
        errors.push("Student ID must be at least 3 characters long.");
      }
      if (!isValidPassword(password)) {
        errors.push("Password must be at least 8 characters long and contain at least one digit and one letter.");
      }
      if (password !== confirmPassword) {
        errors.push("Passwords do not match.");
      }
      if (!isValidPlateNumber(vehicleNumber)) {
        errors.push("Please enter a valid vehicle license plate number.");
      }
      if (errors.length > 0) {
        errorContainer.innerHTML = `<ul style="margin: 0; padding-left: var(--space-4);">${errors.map((err) => `<li>${err}</li>`).join("")}</ul>`;
        errorContainer.style.display = "block";
        showToast("Please fix the errors in the form.", "error");
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "Registering Student Account...";
      const res = await authApi.register({
        fullName,
        email,
        studentId,
        password,
        vehicleNumber,
        vehicleType
      });
      submitBtn.disabled = false;
      submitBtn.textContent = "Complete Registration";
      if (!res.success) {
        errorContainer.textContent = res.message;
        errorContainer.style.display = "block";
        showToast(res.message, "error");
        return;
      }
      showToast("Registration successful! Redirecting to student dashboard...", "success");
      setTimeout(() => {
        window.location.href = "./pages/student-dashboard.html";
      }, 500);
    });
  });
})();
