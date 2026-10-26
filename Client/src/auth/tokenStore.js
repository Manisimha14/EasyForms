/**
 * Token Store and Concurrency-Safe Refresh Coordinator
 * 
 * Rules:
 * - Access token in memory only
 * - Refresh token in localStorage
 * - Refresh is serialized (one in-flight request per tab, Web Locks API across tabs)
 */

const REFRESH_TOKEN_KEY = 'easyforms_refresh_token';
const REFRESH_LOCK_NAME = 'easyforms_token_refresh_lock';

let inMemoryAccessToken = null;
let refreshPromise = null;
const logoutListeners = new Set();

export const tokenStore = {
  getAccessToken() {
    return inMemoryAccessToken;
  },

  setAccessToken(token) {
    inMemoryAccessToken = token;
  },

  getRefreshToken() {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken(token) {
    try {
      if (token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch {
      // ignore storage access errors
    }
  },

  setTokens(accessToken, refreshToken) {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  },

  clear() {
    inMemoryAccessToken = null;
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {}
    logoutListeners.forEach(listener => listener());
  },

  onLogout(callback) {
    logoutListeners.add(callback);
    return () => logoutListeners.delete(callback);
  },

  /**
   * Refreshes the token pair safely across tabs.
   * Ensures only one refresh request is made even if multiple requests fail at the same time.
   */
  async refreshToken(apiRefreshFn) {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const storedRefreshToken = this.getRefreshToken();
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        // Use Web Locks API if available to prevent cross-tab race conditions
        if (typeof navigator !== 'undefined' && navigator.locks && navigator.locks.request) {
          return await navigator.locks.request(REFRESH_LOCK_NAME, async () => {
            // Check if another tab just refreshed it
            const currentToken = this.getRefreshToken();
            if (!currentToken) throw new Error('Refresh token cleared by another tab');
            
            const result = await apiRefreshFn(currentToken);
            this.setTokens(result.accessToken, result.refreshToken);
            return result.accessToken;
          });
        } else {
          // Fallback single-tab execution
          const result = await apiRefreshFn(storedRefreshToken);
          this.setTokens(result.accessToken, result.refreshToken);
          return result.accessToken;
        }
      } catch (err) {
        this.clear();
        throw err;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }
};
