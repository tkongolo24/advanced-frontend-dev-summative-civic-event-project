
import {
  API_CONFIG,
  API_ENDPOINTS,
  STORAGE_CONFIG,
  buildApiUrl,
  debugLog
} from "../config.js";

/**
 * CivicEvents API Client
 * Centralized communication with the Express backend.
 */

class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  constructor() {
    this.baseUrl = API_CONFIG.API_BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT || 15000;
  }

  /**
   * Read the current authentication token.
   */
  getToken() {
    return sessionStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
  }

  /**
   * Build request headers.
   * Do not manually set Content-Type for FormData.
   */
  getHeaders(isFormData = false) {
    const headers = {
      Accept: "application/json"
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const token = this.getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle expired or invalid authentication.
   */
  handleUnauthorized() {
    sessionStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_CONFIG.USER_KEY);
    sessionStorage.removeItem(STORAGE_CONFIG.SESSION_KEY);

    window.dispatchEvent(
      new CustomEvent("auth:unauthorized")
    );
  }

  /**
   * Extract a useful error message from the backend response.
   */
  getErrorMessage(data, fallback = "Something went wrong.") {
    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors
        .map((error) => error.message || error.msg || String(error))
        .join(", ");
    }

    return fallback;
  }

  /**
   * Main request method.
   */
  async request(endpoint, options = {}) {
    const {
      method = "GET",
      body = null,
      isFormData = false,
      requiresAuth = true,
      headers = {},
      timeout = this.timeout
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestHeaders = requiresAuth
      ? this.getHeaders(isFormData)
      : this.getHeaders(isFormData);

    Object.assign(requestHeaders, headers);

    const requestOptions = {
      method,
      headers: requestHeaders,
      signal: controller.signal
    };

    if (body !== null && body !== undefined) {
      requestOptions.body = isFormData
        ? body
        : JSON.stringify(body);
    }

    try {
      debugLog("API request:", method, endpoint);

      const response = await fetch(buildApiUrl(endpoint), requestOptions);

      const contentType = response.headers.get("content-type") || "";
      let responseData = null;

      if (contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        responseData = text || null;
      }

      if (response.status === 401 && requiresAuth) {
        this.handleUnauthorized();
      }

      if (!response.ok) {
        throw new ApiError(
          this.getErrorMessage(
            responseData,
            `Request failed with status ${response.status}.`
          ),
          response.status,
          responseData
        );
      }

      debugLog("API response:", response.status, endpoint);

      return responseData;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new ApiError(
          "The request took too long. Please try again.",
          408
        );
      }

      if (error instanceof ApiError) {
        throw error;
      }

      debugLog("API connection error:", error);

      throw new ApiError(
        "Unable to connect to the server. Check your connection and try again.",
        0,
        error
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * GET request.
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "GET"
    });
  }

  /**
   * POST request.
   */
  post(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body
    });
  }

  /**
   * PUT request.
   */
  put(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body
    });
  }

  /**
   * PATCH request.
   */
  patch(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PATCH",
      body
    });
  }

  /**
   * DELETE request.
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE"
    });
  }

  /**
   * Upload files using FormData.
   */
  upload(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: options.method || "POST",
      body: formData,
      isFormData: true
    });
  }
}

/**
 * Shared API client instance.
 */
const api = new ApiClient();

export { ApiClient, ApiError, API_ENDPOINTS };
export default api;
