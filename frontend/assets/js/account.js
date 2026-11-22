
import api from "./core/api.js";
import storage from "./core/storage.js";

const AccountUI = {
  currentProfile: null,
  notifications: [],

  init() {
    window.addEventListener("route:change", () => {
      this.handleRoute();
    });

    // Also render if this module is loaded while a page is already active.
    this.handleRoute();
  },

  getCurrentRoute() {
    return window.location.hash.replace(/^#/, "").split("?")[0] || "/";
  },

  handleRoute() {
    const route = this.getCurrentRoute();

    if (route === "/profile") {
      this.renderProfile();
    }

    if (route === "/notifications") {
      this.renderNotifications();
    }
  },

  getPageContainer() {
    return document.querySelector("#page-content");
  },

  getCurrentUser() {
    if (typeof storage.getUser === "function") {
      return storage.getUser();
    }

    if (typeof storage.getAuthState === "function") {
      return storage.getAuthState()?.user || null;
    }

    return null;
  },

  isAdmin() {
    const user = this.getCurrentUser();

    return (
      user?.role === "admin" ||
      user?.role === "ADMIN"
    );
  },

  escapeHTML(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  getResponseData(response) {
    return response?.data ?? response;
  },

  getArray(response, possibleKeys = []) {
    const data = this.getResponseData(response);

    if (Array.isArray(data)) {
      return data;
    }

    for (const key of possibleKeys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    return [];
  },

  getErrorMessage(error, fallback) {
    return (
      error?.response?.data?.message ||
      error?.message ||
      fallback
    );
  },

  showMessage(container, message, type = "error") {
    const messageElement = container.querySelector(".account-message");

    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.className = `account-message alert alert-${type}`;
    messageElement.hidden = false;
  },

  /* =========================
     PROFILE
  ========================= */

  async renderProfile() {
    const container = this.getPageContainer();

    if (!container) return;

    container.innerHTML = `
      <section class="page-section">
        <div class="page-header">
          <div>
            <p class="eyebrow">Account</p>
            <h1>My Profile</h1>
            <p>Manage your personal information.</p>
          </div>
        </div>

        <div class="card profile-card">
          <div class="loading-state">
            <p>Loading your profile...</p>
          </div>
        </div>
      </section>
    `;

    try {
      const response = await api.get("/users/profile/me");
      const profile = this.getResponseData(response);

      this.currentProfile = profile;
      this.renderProfileForm(profile);
    } catch (error) {
      container.innerHTML = `
        <section class="page-section">
          <div class="page-header">
            <div>
              <p class="eyebrow">Account</p>
              <h1>My Profile</h1>
            </div>
          </div>

          <div class="card">
            <div class="empty-state">
              <h2>Could not load your profile</h2>
              <p>${this.escapeHTML(
                this.getErrorMessage(
                  error,
                  "Please try again."
                )
              )}</p>

              <button class="btn btn-primary" id="retry-profile">
                Try Again
              </button>
            </div>
          </div>
        </section>
      `;

      document
        .querySelector("#retry-profile")
        ?.addEventListener("click", () => {
          this.renderProfile();
        });
    }
  },

  renderProfileForm(profile = {}) {
    const container = this.getPageContainer();

    if (!container) return;

    const firstName = profile.first_name || "";
    const lastName = profile.last_name || "";
    const email = profile.email || "";
    const phone = profile.phone || "";

    container.innerHTML = `
      <section class="page-section">
        <div class="page-header">
          <div>
            <p class="eyebrow">Account</p>
            <h1>My Profile</h1>
            <p>Manage your personal information.</p>
          </div>
        </div>

        <div class="card profile-card">
          <div class="account-message" hidden></div>

          <form id="profile-form" class="form">
            <div class="form-row">
              <div class="form-group">
                <label for="profile-first-name">
                  First name
                </label>

                <input
                  id="profile-first-name"
                  name="first_name"
                  type="text"
                  value="${this.escapeHTML(firstName)}"
                  required
                  maxlength="100"
                />
              </div>

              <div class="form-group">
                <label for="profile-last-name">
                  Last name
                </label>

                <input
                  id="profile-last-name"
                  name="last_name"
                  type="text"
                  value="${this.escapeHTML(lastName)}"
                  required
                  maxlength="100"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="profile-email">
                Email address
              </label>

              <input
                id="profile-email"
                name="email"
                type="email"
                value="${this.escapeHTML(email)}"
                required
                disabled
              />

              <small>Email changes are not available here.</small>
            </div>

            <div class="form-group">
              <label for="profile-phone">
                Phone number
              </label>

              <input
                id="profile-phone"
                name="phone"
                type="tel"
                value="${this.escapeHTML(phone)}"
                maxlength="30"
              />
            </div>

            <div class="profile-readonly">
              <p>
                <strong>Account role:</strong>
                ${this.escapeHTML(profile.role || "User")}
              </p>

              <p>
                <strong>Account status:</strong>
                ${this.escapeHTML(
                  profile.is_active === false
                    ? "Disabled"
                    : "Active"
                )}
              </p>
            </div>

            <button
              type="submit"
              class="btn btn-primary"
              id="save-profile"
            >
              Save Changes
            </button>
          </form>
        </div>
      </section>
    `;

    document
      .querySelector("#profile-form")
      ?.addEventListener("submit", (event) => {
        this.updateProfile(event);
      });
  },

  async updateProfile(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const container = this.getPageContainer();
    const saveButton = form.querySelector("#save-profile");

    const formData = new FormData(form);

    const profileData = {
      first_name: formData.get("first_name").trim(),
      last_name: formData.get("last_name").trim(),
      phone: formData.get("phone").trim(),
    };

    if (!profileData.first_name || !profileData.last_name) {
      this.showMessage(
        container,
        "First name and last name are required."
      );
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
      const response = await api.patch(
        "/users/profile/me",
        profileData
      );

      const updatedProfile = this.getResponseData(response);

      this.currentProfile = {
        ...this.currentProfile,
        ...updatedProfile,
        ...profileData,
      };

      this.renderProfileForm(this.currentProfile);

      const newContainer = this.getPageContainer();

      this.showMessage(
        newContainer,
        "Your profile was updated successfully.",
        "success"
      );
    } catch (error) {
      this.showMessage(
        container,
        this.getErrorMessage(
          error,
          "Could not update your profile."
        )
      );

      saveButton.disabled = false;
      saveButton.textContent = "Save Changes";
    }
  },

  /* =========================
     NOTIFICATIONS
  ========================= */

  async renderNotifications() {
    const container = this.getPageContainer();

    if (!container) return;

    container.innerHTML = `
      <section class="page-section">
        <div class="page-header">
          <div>
            <p class="eyebrow">Updates</p>
            <h1>Notifications</h1>
            <p>Stay informed about events and announcements.</p>
          </div>
        </div>

        <div class="card">
          <div class="loading-state">
            <p>Loading notifications...</p>
          </div>
        </div>
      </section>
    `;

    try {
      const response = await api.get("/notifications");

      this.notifications = this.getArray(response, [
        "notifications",
        "data",
        "results",
      ]);

      this.renderNotificationList();
    } catch (error) {
      container.innerHTML = `
        <section class="page-section">
          <div class="page-header">
            <div>
              <p class="eyebrow">Updates</p>
              <h1>Notifications</h1>
            </div>
          </div>

          <div class="card">
            <div class="empty-state">
              <h2>Could not load notifications</h2>
              <p>${this.escapeHTML(
                this.getErrorMessage(
                  error,
                  "Please try again."
                )
              )}</p>

              <button
                class="btn btn-primary"
                id="retry-notifications"
              >
                Try Again
              </button>
            </div>
          </div>
        </section>
      `;

      document
        .querySelector("#retry-notifications")
        ?.addEventListener("click", () => {
          this.renderNotifications();
        });
    }
  },

  renderNotificationList() {
    const container = this.getPageContainer();

    if (!container) return;

    const isAdmin = this.isAdmin();

    const notificationHTML = this.notifications
      .map((notification) => {
        const id = notification.id;
        const title =
          notification.title ||
          notification.subject ||
          "Notification";

        const message =
          notification.message ||
          notification.content ||
          notification.body ||
          "";

        const createdAt =
          notification.created_at ||
          notification.createdAt ||
          notification.date;

        const formattedDate = createdAt
          ? new Date(createdAt).toLocaleString()
          : "";

        return `
          <article class="notification-item">
            <div class="notification-content">
              <h3>${this.escapeHTML(title)}</h3>

              <p>${this.escapeHTML(message)}</p>

              ${
                formattedDate
                  ? `<small>${this.escapeHTML(formattedDate)}</small>`
                  : ""
              }
            </div>

            ${
              isAdmin
                ? `
                  <button
                    class="btn btn-danger btn-sm delete-notification"
                    data-id="${this.escapeHTML(id)}"
                    aria-label="Delete notification"
                  >
                    Delete
                  </button>
                `
                : ""
            }
          </article>
        `;
      })
      .join("");

    container.innerHTML = `
      <section class="page-section">
        <div class="page-header">
          <div>
            <p class="eyebrow">Updates</p>
            <h1>Notifications</h1>
            <p>Stay informed about events and announcements.</p>
          </div>
        </div>

        <div class="card notifications-card">
          ${
            this.notifications.length
              ? `
                <div class="notification-list">
                  ${notificationHTML}
                </div>
              `
              : `
                <div class="empty-state">
                  <h2>No notifications yet</h2>
                  <p>You're all caught up.</p>
                </div>
              `
          }
        </div>
      </section>
    `;

    if (isAdmin) {
      container
        .querySelectorAll(".delete-notification")
        .forEach((button) => {
          button.addEventListener("click", () => {
            this.deleteNotification(button.dataset.id);
          });
        });
    }
  },

  async deleteNotification(id) {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this notification?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/notifications/${encodeURIComponent(id)}`);

      this.notifications = this.notifications.filter(
        (notification) =>
          String(notification.id) !== String(id)
      );

      this.renderNotificationList();
    } catch (error) {
      window.alert(
        this.getErrorMessage(
          error,
          "Could not delete this notification."
        )
      );
    }
  },
};

AccountUI.init();

export default AccountUI;
