
import router from "./core/router.js";
import auth from "./core/auth.js";
import { APP_CONFIG } from "./config.js";

const app = document.getElementById("app");

/**
 * CivicEvents Application
 */

const App = {
  /**
   * Render the main application shell.
   */
  renderShell() {
    const user = auth.getCurrentUser();
    const isLoggedIn = auth.isAuthenticated();

    app.innerHTML = `
      <div class="app-shell">
        <header class="navbar">
          <a href="#/" class="brand">
            <span class="brand-mark">C</span>
            <span class="brand-name">CivicEvents</span>
          </a>

          <nav class="navbar-links">
            <a href="#/events" class="nav-link">Events</a>
            <a href="#/announcements" class="nav-link">Announcements</a>
            <a href="#/promos" class="nav-link">Promos</a>
          </nav>

          <div class="navbar-actions">
            ${
              isLoggedIn
                ? `
                  <a href="#/notifications" class="nav-link">
                    Notifications
                  </a>

                  <a href="#/profile" class="nav-link">
                    ${user?.first_name || "My Profile"}
                  </a>

                  ${
                    auth.isAdmin()
                      ? `<a href="#/admin" class="btn btn-secondary">
                          Admin Dashboard
                        </a>`
                      : ""
                  }

                  <button id="logout-button" class="btn btn-outline">
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
   * Attach shared application events.
   */
  attachShellEvents() {
    const logoutButton = document.getElementById("logout-button");

    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        auth.logout();
        this.renderShell();
        router.navigate("/login");
      });
    }
  },

  /**
   * Render a page heading and content area.
   * Feature modules will replace these temporary page views.
   */
  renderPage(title, description, content = "") {
    const pageContent = document.getElementById("page-content");

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
          "Find events, announcements, and services happening around you.",
          `
            <div class="feature-grid">
              <a href="#/events" class="feature-card">
                <h2>Explore Events</h2>
                <p>Discover activities and register for upcoming events.</p>
              </a>

              <a href="#/announcements" class="feature-card">
                <h2>Announcements</h2>
                <p>Stay informed with important city updates.</p>
              </a>

              <a href="#/promos" class="feature-card">
                <h2>Promos</h2>
                <p>Watch videos and discover local promotions.</p>
              </a>
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
          `<a href="#/" class="btn btn-primary">Return Home</a>`
        );
      }
    });
  },

  /**
   * Initialize the application.
   */
  init() {
    if (!app) {
      console.error("CivicEvents root element was not found.");
      return;
    }

    this.renderShell();
    this.registerRoutes();
    router.start();

    window.addEventListener("auth:logout", () => {
      this.renderShell();
    });

    window.addEventListener("auth:unauthorized", () => {
      this.renderShell();
      router.navigate("/login");
    });

    console.log(`${APP_CONFIG.APP_NAME} initialized.`);
  }
};

/**
 * Start CivicEvents when the document is ready.
 */
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

export default App;
