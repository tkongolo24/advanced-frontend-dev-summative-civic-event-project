
import api, { API_ENDPOINTS } from "./api.js";
import storage from "./storage.js";

/**
 * CivicEvents Authentication Service
 *
 * Handles:
 * - Signup
 * - Login
 * - Logout
 * - Current user information
 * - Role checks
 * - Authentication state
 */

class AuthService {
  constructor() {
    this.currentUser = storage.getUser();

    // Keep the local authentication state synchronized
    // when the API client detects an expired session.
    window.addEventListener("auth:unauthorized", () => {
      this.currentUser = null;
    });
  }

  /**
   * Extract the token from common backend response formats.
   */
  extractToken(response) {
    return (
      response?.token ||
      response?.accessToken ||
      response?.access_token ||
      response?.data?.token ||
      response?.data?.accessToken ||
      null
    );
  }

  /**
   * Extract user information from the backend response.
   */
  extractUser(response) {
    return (
      response?.user ||
      response?.data?.user ||
      response?.data ||
      null
    );
  }

  /**
   * Validate signup information before sending it.
   */
  validateSignup(data) {
    const errors = [];

    if (!data.first_name?.trim()) {
      errors.push("First name is required.");
    }

    if (!data.last_name?.trim()) {
      errors.push("Last name is required.");
    }

    if (!data.email?.trim()) {
      errors.push("Email is required.");
    }

    if (!data.password) {
      errors.push("Password is required.");
    } else {
      const password = data.password;

      if (password.length < 8) {
        errors.push("Password must contain at least 8 characters.");
      }

      if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain an uppercase letter.");
      }

      if (!/[a-z]/.test(password)) {
        errors.push("Password must contain a lowercase letter.");
      }

      if (!/[0-9]/.test(password)) {
        errors.push("Password must contain a number.");
      }

      if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push("Password must contain a special character.");
      }
    }

    if (
      data.confirm_password &&
      data.password !== data.confirm_password
    ) {
      errors.push("Passwords do not match.");
    }

    return errors;
  }

  /**
   * Register a new user.
   */
  async signup(userData) {
    const errors = this.validateSignup(userData);

    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }

    const payload = {
      first_name: userData.first_name.trim(),
      last_name: userData.last_name.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password
    };

    const response = await api.post(
      API_ENDPOINTS.AUTH.SIGNUP,
      payload,
      { requiresAuth: false }
    );

    const token = this.extractToken(response);
    const user = this.extractUser(response);

    // Some backends automatically log users in after signup.
    if (token && user) {
      storage.saveLogin(token, user);
      this.currentUser = user;
    }

    return response;
  }

  /**
   * Authenticate an existing user.
   */
  async login(credentials) {
    if (!credentials.email?.trim()) {
      throw new Error("Email is required.");
    }

    if (!credentials.password) {
      throw new Error("Password is required.");
    }

    const payload = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password
    };

    const response = await api.post(
      API_ENDPOINTS.AUTH.LOGIN,
      payload,
      { requiresAuth: false }
    );

    const token = this.extractToken(response);
    const user = this.extractUser(response);

    if (!token) {
      throw new Error(
        "Login succeeded, but the server did not return an authentication token."
      );
    }

    if (!user) {
      throw new Error(
        "Login succeeded, but the server did not return user information."
      );
    }

    storage.saveLogin(token, user);
    this.currentUser = user;

    return user;
  }

  /**
   * Log out the current user.
   */
  logout() {
    storage.clear();
    this.currentUser = null;

    window.dispatchEvent(
      new CustomEvent("auth:logout")
    );
  }

  /**
   * Return the current user.
   */
  getCurrentUser() {
    this.currentUser = storage.getUser();
    return this.currentUser;
  }

  /**
   * Check whether the user is logged in.
   */
  isAuthenticated() {
    return storage.isAuthenticated();
  }

  /**
   * Get the current user's role.
   */
  getRole() {
    const user = this.getCurrentUser();

    return user?.role || null;
  }

  /**
   * Check whether the current user is an administrator.
   */
  isAdmin() {
    return this.getRole() === "admin";
  }

  /**
   * Check whether the current user is a normal user.
   */
  isUser() {
    return this.getRole() === "user";
  }

  /**
   * Check whether the current user has a specific role.
   */
  hasRole(role) {
    return this.getRole() === role;
  }

  /**
   * Get a snapshot of the authentication state.
   */
  getAuthState() {
    return {
      authenticated: this.isAuthenticated(),
      user: this.getCurrentUser(),
      role: this.getRole(),
      isAdmin: this.isAdmin()
    };
  }
}

const auth = new AuthService();

export { AuthService };
export default auth;
