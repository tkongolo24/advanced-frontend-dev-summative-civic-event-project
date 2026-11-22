
import authService from "./core/auth.js";
import router from "./core/route.js";

/**
 * CivicEvents Authentication UI
 *
 * Login and signup pages.
 */

const AuthUI = {
  /**
   * Get the page content container.
   */
  getContainer() {
    return document.getElementById("page-content");
  },

  /**
   * Render the login page.
   */
  renderLogin() {
    const container = this.getContainer();

    if (!container) return;

    container.innerHTML = `
      <section class="auth-page">
        <div class="auth-card">
          <div class="auth-heading">
            <span class="brand-mark">C</span>
            <p class="eyebrow">WELCOME BACK</p>
            <h1>Sign in to CivicEvents</h1>
            <p>Stay connected with what's happening in your city.</p>
          </div>

          <div id="auth-message" class="form-message hidden"></div>

          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="login-email">Email address</label>
              <input
                type="email"
                id="login-email"
                name="email"
                placeholder="you@example.com"
                autocomplete="email"
                required
              />
            </div>

            <div class="form-group">
              <label for="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                name="password"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              id="login-submit"
              class="btn btn-primary btn-full"
            >
              Sign In
            </button>
          </form>

          <p class="auth-switch">
            Don't have an account?
            <a href="#/signup">Create one</a>
          </p>
        </div>
      </section>
    `;

    this.attachLoginEvents();
  },

  /**
   * Render the signup page.
   */
  renderSignup() {
    const container = this.getContainer();

    if (!container) return;

    container.innerHTML = `
      <section class="auth-page">
        <div class="auth-card">
          <div class="auth-heading">
            <span class="brand-mark">C</span>
            <p class="eyebrow">GET STARTED</p>
            <h1>Create your account</h1>
            <p>Join your community and discover city events.</p>
          </div>

          <div id="auth-message" class="form-message hidden"></div>

          <form id="signup-form" class="auth-form">
            <div class="form-row">
              <div class="form-group">
                <label for="signup-first-name">First name</label>
                <input
                  type="text"
                  id="signup-first-name"
                  name="first_name"
                  placeholder="First name"
                  autocomplete="given-name"
                  required
                />
              </div>

              <div class="form-group">
                <label for="signup-last-name">Last name</label>
                <input
                  type="text"
                  id="signup-last-name"
                  name="last_name"
                  placeholder="Last name"
                  autocomplete="family-name"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="signup-email">Email address</label>
              <input
                type="email"
                id="signup-email"
                name="email"
                placeholder="you@example.com"
                autocomplete="email"
                required
              />
            </div>

            <div class="form-group">
              <label for="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                name="password"
                placeholder="Create a strong password"
                autocomplete="new-password"
                minlength="8"
                required
              />
              <small>
                At least 8 characters, including uppercase,
                lowercase, a number, and a special character.
              </small>
            </div>

            <div class="form-group">
              <label for="signup-confirm-password">Confirm password</label>
              <input
                type="password"
                id="signup-confirm-password"
                name="confirm_password"
                placeholder="Re-enter your password"
                autocomplete="new-password"
                minlength="8"
                required
              />
            </div>

            <button
              type="submit"
              id="signup-submit"
              class="btn btn-primary btn-full"
            >
              Create Account
            </button>
          </form>

          <p class="auth-switch">
            Already have an account?
            <a href="#/login">Sign in</a>
          </p>
        </div>
      </section>
    `;

    this.attachSignupEvents();
  },

  /**
   * Display a message to the user.
   */
  showMessage(message, type = "error") {
    const messageBox = document.getElementById("auth-message");

    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `form-message ${type}`;
  },

  /**
   * Set the loading state of a form button.
   */
  setLoading(button, isLoading, loadingText, normalText) {
    if (!button) return;

    button.disabled = isLoading;
    button.textContent = isLoading ? loadingText : normalText;
  },

  /**
   * Handle login form submission.
   */
  attachLoginEvents() {
    const form = document.getElementById("login-form");
    const button = document.getElementById("login-submit");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document
        .getElementById("login-email")
        .value
        .trim();

      const password = document
        .getElementById("login-password")
        .value;

      this.setLoading(button, true, "Signing in...", "Sign In");

      try {
        const user = await authService.login({
          email,
          password
        });

        this.showMessage("Login successful!", "success");

        // Redirect administrators to their dashboard.
        if (user.role === "admin") {
          router.navigate("/admin");
        } else {
          router.navigate("/events");
        }
      } catch (error) {
        this.showMessage(
          error.message || "Unable to sign in. Please try again."
        );
      } finally {
        this.setLoading(button, false, "Signing in...", "Sign In");
      }
    });
  },

  /**
   * Handle signup form submission.
   */
  attachSignupEvents() {
    const form = document.getElementById("signup-form");
    const button = document.getElementById("signup-submit");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const userData = {
        first_name: document
          .getElementById("signup-first-name")
          .value
          .trim(),

        last_name: document
          .getElementById("signup-last-name")
          .value
          .trim(),

        email: document
          .getElementById("signup-email")
          .value
          .trim(),

        password: document
          .getElementById("signup-password")
          .value,

        confirm_password: document
          .getElementById("signup-confirm-password")
          .value
      };

      if (userData.password !== userData.confirm_password) {
        this.showMessage("Passwords do not match.");
        return;
      }

      this.setLoading(
        button,
        true,
        "Creating account...",
        "Create Account"
      );

      try {
        await authService.signup(userData);

        this.showMessage(
          "Account created successfully!",
          "success"
        );

        if (authService.isAuthenticated()) {
          router.navigate("/events");
        } else {
          router.navigate("/login");
        }
      } catch (error) {
        this.showMessage(
          error.message || "Unable to create your account."
        );
      } finally {
        this.setLoading(
          button,
          false,
          "Creating account...",
          "Create Account"
        );
      }
    });
  }
};

/**
 * Render authentication pages when their routes change.
 */
window.addEventListener("route:change", (event) => {
  const path = event.detail?.path;

  if (path === "/login") {
    AuthUI.renderLogin();
  }

  if (path === "/signup") {
    AuthUI.renderSignup();
  }
});

export default AuthUI;
