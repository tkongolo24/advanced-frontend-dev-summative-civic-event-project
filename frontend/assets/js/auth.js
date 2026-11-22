
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
      <section class="auth-layout">
        <div class="auth-visual">
          <div>
            <div class="flex items-center gap-3 mb-12">
              <span class="brand-mark">C</span>
              <span class="brand-name">CivicEvents</span>
            </div>
            <p class="text-sm uppercase tracking-widest mb-5">YOUR CITY. YOUR COMMUNITY.</p>
            <h1>Discover what brings your community together.</h1>
            <p class="mt-5 text-base">Find local events, stay informed and connect with the people shaping your city.</p>
          </div>
          <p class="text-sm">© 2026 CivicEvents. Making cities more connected.</p>
        </div>

        <div class="auth-content">
          <div class="auth-form">
            <div class="auth-heading">
              <p class="text-sm font-semibold text-forest">WELCOME BACK</p>
              <h2>Sign in to CivicEvents</h2>
              <p>Stay connected with what's happening in your city.</p>
            </div>

            <div id="auth-message" class="form-message hidden"></div>

            <form id="login-form">
              <div class="form-group">
                <label class="form-label" for="login-email">Email address</label>
                <input class="form-input" type="email" id="login-email"
                  name="email" placeholder="you@example.com"
                  autocomplete="email" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="login-password">Password</label>
                <input class="form-input" type="password" id="login-password"
                  name="password" placeholder="Enter your password"
                  autocomplete="current-password" required />
              </div>

              <button type="submit" id="login-submit"
                class="btn btn-primary w-full">
                Sign In
              </button>
            </form>

            <p class="auth-switch mt-6 text-sm">
              Don't have an account?
              <a class="text-forest font-semibold" href="#/signup">Create one</a>
            </p>
          </div>
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
      <section class="auth-layout">
        <div class="auth-visual">
          <div>
            <div class="flex items-center gap-3 mb-12">
              <span class="brand-mark">C</span>
              <span class="brand-name">CivicEvents</span>
            </div>
            <p class="text-sm uppercase tracking-widest mb-5">BE PART OF SOMETHING BIGGER.</p>
            <h1>Your community starts with a connection.</h1>
            <p class="mt-5 text-base">Create an account to discover events, participate and stay informed about your city.</p>
          </div>
          <p class="text-sm">© 2026 CivicEvents. Making cities more connected.</p>
        </div>

        <div class="auth-content">
          <div class="auth-form">
            <div class="auth-heading">
              <p class="text-sm font-semibold text-forest">GET STARTED</p>
              <h2>Create your account</h2>
              <p>Join your community and discover city events.</p>
            </div>

            <div id="auth-message" class="form-message hidden"></div>

            <form id="signup-form">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label" for="signup-first-name">First name</label>
                  <input class="form-input" type="text" id="signup-first-name"
                    name="first_name" placeholder="First name"
                    autocomplete="given-name" required />
                </div>

                <div class="form-group">
                  <label class="form-label" for="signup-last-name">Last name</label>
                  <input class="form-input" type="text" id="signup-last-name"
                    name="last_name" placeholder="Last name"
                    autocomplete="family-name" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="signup-email">Email address</label>
                <input class="form-input" type="email" id="signup-email"
                  name="email" placeholder="you@example.com"
                  autocomplete="email" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="signup-password">Password</label>
                <input class="form-input" type="password" id="signup-password"
                  name="password" placeholder="Create a strong password"
                  autocomplete="new-password" minlength="8" required />
                <small class="form-hint">At least 8 characters, including uppercase, lowercase, a number and a special character.</small>
              </div>

              <div class="form-group">
                <label class="form-label" for="signup-confirm-password">Confirm password</label>
                <input class="form-input" type="password" id="signup-confirm-password"
                  name="confirm_password" placeholder="Re-enter your password"
                  autocomplete="new-password" minlength="8" required />
              </div>

              <button type="submit" id="signup-submit"
                class="btn btn-primary w-full">
                Create Account
              </button>
            </form>

            <p class="auth-switch mt-6 text-sm">
              Already have an account?
              <a class="text-forest font-semibold" href="#/login">Sign in</a>
            </p>
          </div>
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
