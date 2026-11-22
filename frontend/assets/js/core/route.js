
import auth from "./auth.js";

/**
 * CivicEvents Router
 *
 * Handles:
 * - Hash-based navigation
 * - Route registration
 * - Protected routes
 * - Admin-only routes
 * - Browser back and forward navigation
 * - Query string support
 */

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;

    window.addEventListener("hashchange", () => {
      this.handleRoute();
    });
  }

  /**
   * Register a route.
   */
  register(path, config = {}) {
    this.routes[path] = {
      title: config.title || "CivicEvents",
      render: config.render || (() => {}),
      requiresAuth: config.requiresAuth || false,
      requiresAdmin: config.requiresAdmin || false,
    };

    return this;
  }

  /**
   * Navigate to a route.
   */
  navigate(path) {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }

    if (window.location.hash === `#${path}`) {
      this.handleRoute();
      return;
    }

    window.location.hash = path;
  }

  /**
   * Get the current route path without query parameters.
   */
  getCurrentPath() {
    const hash = window.location.hash;

    if (!hash || hash === "#") {
      return "/";
    }

    const path = hash.replace(/^#/, "");
    return path.split("?")[0] || "/";
  }

  /**
   * Get the current query string as URLSearchParams.
   */
  getQueryParams() {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");

    if (queryIndex === -1) {
      return new URLSearchParams();
    }

    return new URLSearchParams(
      hash.substring(queryIndex + 1)
    );
  }

  /**
   * Find route configuration.
   */
  getRoute(path) {
    return this.routes[path] || null;
  }

  /**
   * Check whether the user can access a route.
   */
  checkAccess(route) {
    if (
      route.requiresAuth &&
      !auth.isAuthenticated()
    ) {
      return {
        allowed: false,
        redirect: "/login",
      };
    }

    if (
      route.requiresAdmin &&
      !auth.isAdmin()
    ) {
      return {
        allowed: false,
        redirect: "/events",
      };
    }

    return {
      allowed: true,
      redirect: null,
    };
  }

  /**
   * Resolve and render the current route.
   */
  handleRoute() {
    let path = this.getCurrentPath();
    let route = this.getRoute(path);

    // Unknown routes go to the not-found page.
    if (!route) {
      route = this.getRoute("/not-found");

      if (!route) {
        console.warn(`Route not found: ${path}`);
        return;
      }

      path = "/not-found";
    }

    const access = this.checkAccess(route);

    // Redirect users without permission.
    if (!access.allowed) {
      if (this.getCurrentPath() !== access.redirect) {
        this.navigate(access.redirect);
      }

      return;
    }

    this.currentRoute = path;

    document.title = `${route.title} | CivicEvents`;

    // Render the registered route.
    route.render();

    // Notify feature modules.
    window.dispatchEvent(
      new CustomEvent("route:change", {
        detail: {
          path,
          route,
        },
      })
    );
  }

  /**
   * Start the router.
   */
  start() {
    if (!window.location.hash) {
      this.navigate("/");
      return;
    }

    this.handleRoute();
  }

  /**
   * Check whether a route exists.
   */
  hasRoute(path) {
    return Boolean(this.routes[path]);
  }
}

const router = new Router();

export { Router };
export default router;
