
import api from "./api.js";
import storage from "./storage.js";
import { API_ENDPOINTS, USER_ROLES } from "../config.js";

/**
 * CivicEvents Authentication Service
 *
 * Handles authentication requests, session storage,
 * user information and role checks.
 */

class AuthService {
  constructor() {
    this.storage = storage;
  }

  /**
   * Extract token from different possible backend response shapes.
   */
  extractToken(data) {
    return (
      data?.token ||
      data?.accessToken ||
      data?.access_token ||
      data?.data?.token ||
      data?.data?.accessToken ||
      data?.data?.access_token ||
      null
    );
  }

  /**
   * Extract user information from backend response.
   */
  extractUser(data) {
    return (
      data?.user ||
      data?.data?.user ||
      data?.data ||
      null
    );
  }

  /**
   * Login with email and password.
   */
  async login(credentials) {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const response = await api.post(
      API_ENDPOINTS.AUTH.LOGIN,
      { email, password },
      { requiresAuth: false }
    );

    const token = this.extractToken(response);
    const user = this.extractUser(response);

    if (!token) {
      throw new Error(
        "Login response did not contain an authentication token."
      );
    }

    if (!user || typeof user !== "object") {
      throw new Error(
        "Login response did not contain valid user information."
      );
    }

    this.storage.saveLogin(
      token,
      user,
      response?.session || response?.data?.session || {}
    );

    window.dispatchEvent(
      new CustomEvent("auth:login", {
        detail: { user }
      })
    );

    return user;
  }

  /**
   * Register a new user.
   */
  async signup(userData) {
    const {
      first_name,
      last_name,
      email,
      password,
      confirm_password
    } = userData;

    if (!first_name || !last_name || !email || !password) {
      throw new Error("Please complete all required fields.");
    }

    if (password !== confirm_password) {
      throw new Error("Passwords do not match.");
    }

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    const response = await api.post(
      API_ENDPOINTS.AUTH.SIGNUP,
      {
        first_name,
        last_name,
        email,
        password
      },
      { requiresAuth: false }
    );

    const token = this.extractToken(response);
    const user = this.extractUser(response);

    // Some backends register the user without automatically logging in.
    if (token && user && typeof user === "object") {
      this.storage.saveLogin(
        token,
        user,
        response?.session || response?.data?.session || {}
      );
    }

    return response;
  }

  /**
   * Logout the current user.
   */
  logout() {
    this.storage.clear();

    window.dispatchEvent(
      new CustomEvent("auth:logout")
    );
  }

  /**
   * Check whether a user is authenticated.
   */
  isAuthenticated() {
    return this.storage.isAuthenticated();
  }

  /**
   * Get the currently logged-in user.
   */
  getCurrentUser() {
    return this.storage.getUser();
  }

  /**
   * Get the current user's role.
   */
  getUserRole() {
    return this.getCurrentUser()?.role || null;
  }

  /**
   * Check whether the current user is an administrator.
   */
  isAdmin() {
    return this.getUserRole() === USER_ROLES.ADMIN;
  }

  /**
   * Check whether the current user has a specific role.
   */
  hasRole(role) {
    return this.getUserRole() === role;
  }

  /**
   * Get the current authentication state.
   */
  getAuthState() {
    return this.storage.getAuthState();
  }

  /**
   * Clear the current authentication session.
   */
  clearSession() {
    this.storage.clear();
  }
}

const authService = new AuthService();

export { AuthService };
export default authService;
