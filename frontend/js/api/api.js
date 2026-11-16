/**
 * PARKWISE - Base API Client & Full-Stack Integration
 * Phase 2.10: Full Frontend-Backend Integration
 */

export const API_CONFIG = {
  baseURL: 'http://localhost:5000/api/v1',
  isMock: false,
  mockDelayMs: 150,
  timeoutMs: 6000,
  version: 'v1'
};

/**
 * Simulates network latency for mock fallbacks.
 * @param {number} ms 
 * @returns {Promise<void>}
 */
export const delay = (ms = API_CONFIG.mockDelayMs) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Standard API Response envelope wrapper.
 * @template T
 * @param {boolean} success 
 * @param {T} data 
 * @param {string} [message] 
 * @param {number} [status=200] 
 */
export function createApiResponse(success, data, message = '', status = 200) {
  return {
    success,
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generic API request dispatcher.
 * Dispatches requests to backend with automatic HttpOnly credentials,
 * Authorization header injection, and token refresh retry.
 */
export async function apiRequest(endpoint, options = {}, mockHandler = null) {
  if (API_CONFIG.isMock && typeof mockHandler === 'function') {
    await delay();
    return mockHandler();
  }

  const url = `${API_CONFIG.baseURL}${endpoint}`;

  // Read auth token from localStorage if present
  let token = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem('parkwise_auth_token');
    if (raw) {
      try {
        token = JSON.parse(raw);
      } catch (_) {
        token = raw;
      }
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const isFileProtocol = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';

  const fetchOptions = {
    ...options,
    headers,
    credentials: isFileProtocol ? 'omit' : 'include' // In file:/// mode, cookies are omitted to comply with CORS spec
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);
    fetchOptions.signal = controller.signal;

    let response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    // If 401 Unauthorized and not an auth login attempt, try transparent token refresh
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      try {
        const refreshRes = await fetch(`${API_CONFIG.baseURL}/auth/refresh`, {
          method: 'POST',
          credentials: isFileProtocol ? 'omit' : 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          if (refreshJson.success && refreshJson.data?.accessToken) {
            token = refreshJson.data.accessToken;
            if (window.localStorage) {
              window.localStorage.setItem('parkwise_auth_token', JSON.stringify(token));
            }
            fetchOptions.headers['Authorization'] = `Bearer ${token}`;
            response = await fetch(url, fetchOptions);
          }
        }
      } catch (_) {
        // Refresh failed; proceed with original response
      }
    }

    const json = await response.json();
    return json;
  } catch (error) {
    // If backend is unreachable or CORS blocked in direct file eval, fallback gracefully
    if (typeof mockHandler === 'function') {
      console.warn(`[ParkWise API] Live backend unavailable (${url}). Falling back to local state.`);
      await delay(80);
      return mockHandler();
    }
    return createApiResponse(false, null, error.message || 'Network error occurred', 500);
  }
}
