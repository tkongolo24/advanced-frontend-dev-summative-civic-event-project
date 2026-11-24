
import router from "./core/route.js";
import auth from "./core/auth.js";
import { APP_CONFIG } from "./config.js";

// Feature modules
import "./auth.js";
import "./events.js";
import "./media.js";
import "./account.js";
import "./admin.js";

const app = document.getElementById("app");

/**
 * CivicEvents Application
 */
const App = {
  /**
   * Render the shared application shell.
   */
  renderShell() {
    if (!app) return;

    const user = auth.getCurrentUser();
    const isLoggedIn = auth.isAuthenticated();

    app.innerHTML = `
      <div class="app-shell">
        <header class="top-navbar">
          <a href="#/" class="brand flex items-center gap-3">
            <span class="brand-mark">CE</span>
            <span class="brand-name">CivicEvents</span>
          </a>

          <nav class="navbar-links flex items-center gap-8" aria-label="Main navigation">
            ${
              isLoggedIn
                ? `
                  <a href="#/events" class="nav-link">Events</a>
                  <a href="#/announcements" class="nav-link">
                    Announcements
                  </a>
                  <a href="#/promos" class="nav-link">Promos</a>
                `
                : ""
            }
          </nav>

          <div class="navbar-actions flex items-center gap-3">
            ${
              isLoggedIn
                ? `
                  <a href="#/notifications" class="nav-link">
                    Notifications
                  </a>

                  <a href="#/profile" class="nav-link">
                    ${this.escapeHTML(
                      user?.first_name || "My Profile"
                    )}
                  </a>

                  ${
                    auth.isAdmin()
                      ? `
                        <a
                          href="#/admin"
                          class="btn btn-secondary"
                        >
                          Admin Dashboard
                        </a>
                      `
                      : ""
                  }

                  <button
                    id="logout-button"
                    class="btn btn-outline"
                    type="button"
                  >
                    Logout
                  </button>
                `
                : `
                  <a href="#/login" class="btn btn-outline">
                    Login
                  </a>

                  <a href="#/signup" class="btn btn-primary">
                    Get Started
                  </a>
                `
            }
          </div>
        </header>

        <main id="page-content" class="page-content">
          <div class="loading-screen">
            <div class="loading-spinner"></div>
            <p>Loading CivicEvents...</p>
          </div>
        </main>

        <footer class="app-footer">
          <p>
            © ${new Date().getFullYear()} CivicEvents.
            Making cities more connected.
          </p>
        </footer>
      </div>
    `;

    this.attachShellEvents();
  },

  /**
   * Escape dynamic text before inserting it into HTML.
   */
  escapeHTML(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  /**
   * Attach shared navigation events.
   */
  attachShellEvents() {
    const logoutButton =
      document.getElementById("logout-button");

    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        auth.logout();
        this.renderShell();
        router.navigate("/login");
      });
    }
  },

  /**
   * Render a temporary page.
   * Feature modules replace this content after route changes.
   */
  renderPage(title, description, content = "") {
    const pageContent =
      document.getElementById("page-content");

    if (!pageContent) return;

    pageContent.innerHTML = `
      <section class="page-header">
        <div>
          <p class="eyebrow">CIVICEVENTS</p>
          <h1>${title}</h1>
          <p class="page-description">${description}</p>
        </div>
      </section>

      <section class="page-body">
        ${content}
      </section>
    `;
  },

  /**
   * Register application routes.
   */
  registerRoutes() {
    router.register("/", {
      title: "Home",
      render: () => {
        this.renderPage(
          "Discover your city.",
          "Find the places, people, and experiences that make your city yours.",
          `
            <div class="home-page-content">
              <section class="home-intro-panel">
                <div>
                  <p class="home-kicker">YOUR CITY. YOUR COMMUNITY.</p>
                  <h2>There's more happening around you.</h2>
                  <p>
                    Discover local events, stay informed with community
                    announcements, and explore what's happening in your city.
                  </p>
                </div>

                <div class="home-actions">
                  <a href="#/events" class="btn btn-primary">
                    Explore Events <span aria-hidden="true">→</span>
                  </a>
                  <a href="#/signup" class="btn btn-secondary">
                    Join the Community
                  </a>
                </div>
              </section>

              <section class="home-feature-section">
                <div class="home-section-heading">
                  <div>
                    <p class="eyebrow">EXPLORE CIVICEVENTS</p>
                    <h2>Stay connected to your city</h2>
                  </div>
                  <p>Everything happening in your community, in one place.</p>
                </div>

                <div class="home-feature-grid">
                  <a href="#/events" class="home-feature-card">
                    <span class="home-feature-number">01</span>
                    <h3>Discover Events <span aria-hidden="true">↗</span></h3>
                    <p>
                      Find activities, community gatherings, and events
                      worth adding to your calendar.
                    </p>
                    <span class="home-card-link">Explore events →</span>
                  </a>

                  <a href="#/announcements" class="home-feature-card">
                    <span class="home-feature-number">02</span>
                    <h3>City Announcements <span aria-hidden="true">↗</span></h3>
                    <p>
                      Listen to important updates and stay informed
                      about what's happening around you.
                    </p>
                    <span class="home-card-link">Listen to updates →</span>
                  </a>

                  <a href="#/promos" class="home-feature-card">
                    <span class="home-feature-number">03</span>
                    <h3>Local Promos <span aria-hidden="true">↗</span></h3>
                    <p>
                      Explore local campaigns, videos, and promotions
                      from your community.
                    </p>
                    <span class="home-card-link">Explore promos →</span>
                  </a>
                </div>
              </section>
            </div>
          `
        );
      }
    });

    router.register("/events", {
      title: "Events",
      render: () => {
        this.renderPage(
          "Events",
          "Discover and register for upcoming city events."
        );
      }
    });

    router.register("/announcements", {
      title: "Announcements",
      render: () => {
        this.renderPage(
          "Announcements",
          "Listen to important updates and public announcements."
        );
      }
    });

    router.register("/promos", {
      title: "Promos",
      render: () => {
        this.renderPage(
          "Promos",
          "Explore videos, campaigns, and local promotions."
        );
      }
    });

    router.register("/notifications", {
      title: "Notifications",
      requiresAuth: true,
      render: () => {
        this.renderPage(
          "Notifications",
          "Keep track of your updates and activity."
        );
      }
    });

    router.register("/profile", {
      title: "My Profile",
      requiresAuth: true,
      render: () => {
        this.renderPage(
          "My Profile",
          "Manage your personal information."
        );
      }
    });

    router.register("/admin", {
      title: "Admin Dashboard",
      requiresAuth: true,
      requiresAdmin: true,
      render: () => {
        this.renderPage(
          "Admin Dashboard",
          "Manage CivicEvents and monitor platform activity."
        );
      }
    });

    router.register("/login", {
      title: "Login",
      render: () => {
        this.renderPage(
          "Welcome back",
          "Sign in to your CivicEvents account."
        );
      }
    });

    router.register("/signup", {
      title: "Create Account",
      render: () => {
        this.renderPage(
          "Join CivicEvents",
          "Create an account to participate in your city."
        );
      }
    });

    router.register("/not-found", {
      title: "Page Not Found",
      render: () => {
        this.renderPage(
          "Page not found",
          "The page you are looking for does not exist.",
          `
            <a href="#/" class="btn btn-primary">
              Return Home
            </a>
          `
        );
      }
    });
  },

  /**
   * Refresh the shell and rerender the current route.
   */
  refreshCurrentPage() {
    this.renderShell();

    const currentRoute =
      window.location.hash.replace(/^#/, "").split("?")[0] ||
      "/";

    router.navigate(currentRoute);
  },

  /**
   * Initialize the application.
   */
  init() {
    if (!app) {
      console.error(
        "CivicEvents root element was not found."
      );
      return;
    }

    this.renderShell();
    this.registerRoutes();
    router.start();

    // Update navigation after successful login.
    window.addEventListener("auth:login", () => {
      this.refreshCurrentPage();
    });

    // Update navigation after logout.
    window.addEventListener("auth:logout", () => {
      this.renderShell();
    });

    // Handle expired or invalid authentication.
    window.addEventListener("auth:unauthorized", () => {
      auth.logout();
      this.renderShell();
      router.navigate("/login");
    });

    console.log(
      `${APP_CONFIG.NAME} initialized.`
    );
  }
};

/**
 * Start CivicEvents when the document is ready.
 */
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

export default App;
