
import { STORAGE_CONFIG } from "../config.js";

/**
 * CivicEvents Storage Manager
 *
 * Uses sessionStorage so authentication data is cleared
 * when the browser session ends.
 */

class StorageService {
  constructor() {
    this.keys = STORAGE_CONFIG;
  }

  /**
   * Store the authentication token.
   */
  setToken(token) {
    if (!token) {
      throw new Error("A valid authentication token is required.");
    }

    sessionStorage.setItem(this.keys.TOKEN_KEY, token);
  }

  /**
   * Retrieve the authentication token.
   */
  getToken() {
    return sessionStorage.getItem(this.keys.TOKEN_KEY);
  }

  /**
   * Store the logged-in user's information.
   */
  setUser(user) {
    if (!user || typeof user !== "object") {
      throw new Error("Valid user information is required.");
    }

    sessionStorage.setItem(
      this.keys.USER_KEY,
      JSON.stringify(user)
    );
  }

  /**
   * Retrieve the logged-in user's information.
   */
  getUser() {
    const storedUser = sessionStorage.getItem(this.keys.USER_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Unable to read stored user information:", error);
      return null;
    }
  }

  /**
   * Store session information.
   */
  setSession(session) {
    sessionStorage.setItem(
      this.keys.SESSION_KEY,
      JSON.stringify(session)
    );
  }

  /**
   * Retrieve session information.
   */
  getSession() {
    const storedSession = sessionStorage.getItem(
      this.keys.SESSION_KEY
    );

    if (!storedSession) {
      return null;
    }

    try {
      return JSON.parse(storedSession);
    } catch (error) {
      console.error("Unable to read stored session:", error);
      return null;
    }
  }

  /**
   * Check whether an authentication token exists.
   */
  isAuthenticated() {
    return Boolean(this.getToken());
  }

  /**
   * Check whether user information exists.
   */
  hasUser() {
    return Boolean(this.getUser());
  }

  /**
   * Clear all CivicEvents authentication data.
   */
  clear() {
    sessionStorage.removeItem(this.keys.TOKEN_KEY);
    sessionStorage.removeItem(this.keys.USER_KEY);
    sessionStorage.removeItem(this.keys.SESSION_KEY);
  }

  /**
   * Save a complete login session.
   */
  saveLogin(token, user, session = {}) {
    this.setToken(token);
    this.setUser(user);
    this.setSession({
      ...session,
      loggedInAt: new Date().toISOString()
    });
  }

  /**
   * Return a snapshot of the current authentication state.
   */
  getAuthState() {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.getUser(),
      session: this.getSession()
    };
  }
}

const storage = new StorageService();

export { StorageService };
export default storage;

