
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

    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`
      .toUpperCase() || "U";

    const fullName = `${firstName} ${lastName}`.trim() || "Your account";
    const role = profile.role || "User";
    const isActive = profile.is_active !== false;

    container.innerHTML = `
      <section class="page-section profile-page">
        <div class="page-header profile-page-header">
          <div>
            <p class="eyebrow">YOUR CIVIC EVENTS ACCOUNT</p>
            <h1>My Profile</h1>
            <p class="page-description">
              Manage your personal information and account details.
            </p>
          </div>
        </div>

        <div class="profile-layout">
          <aside class="profile-overview-card">
            <div class="profile-avatar" aria-label="Profile initials">
              ${this.escapeHTML(initials)}
            </div>

            <h2>${this.escapeHTML(fullName)}</h2>
            <p class="profile-overview-email">
              ${this.escapeHTML(email)}
            </p>

            <span class="profile-role-badge">
              ${this.escapeHTML(role)}
            </span>

            <div class="profile-overview-divider"></div>

            <div class="profile-account-status">
              <span class="profile-status-indicator ${
                isActive ? "is-active" : "is-disabled"
              }"></span>
              <div>
                <strong>Account status</strong>
                <p>${isActive ? "Active" : "Disabled"}</p>
              </div>
            </div>

            <div class="profile-overview-note">
              <span aria-hidden="true">✓</span>
              <p>
                Keep your contact information up to date so you can
                stay connected with community updates.
              </p>
            </div>
          </aside>

          <div class="card profile-card profile-form-card">
            <div class="profile-form-heading">
              <div>
                <p class="eyebrow">PERSONAL INFORMATION</p>
                <h2>Account details</h2>
                <p>Update the information associated with your account.</p>
              </div>
              <span class="profile-edit-symbol" aria-hidden="true">✎</span>
            </div>

            <div class="account-message" hidden></div>

            <form id="profile-form" class="form profile-form">
              <div class="profile-form-section">
                <h3>Basic information</h3>
                <p>Your name and contact details.</p>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="profile-first-name">First name</label>
                  <input
                    id="profile-first-name"
                    name="first_name"
                    type="text"
                    value="${this.escapeHTML(firstName)}"
                    placeholder="Enter your first name"
                    required
                    maxlength="100"
                  />
                </div>

                <div class="form-group">
                  <label for="profile-last-name">Last name</label>
                  <input
                    id="profile-last-name"
                    name="last_name"
                    type="text"
                    value="${this.escapeHTML(lastName)}"
                    placeholder="Enter your last name"
                    required
                    maxlength="100"
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="profile-email">Email address</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value="${this.escapeHTML(email)}"
                  disabled
                />
                <small>Email address cannot be changed here.</small>
              </div>

              <div class="form-group">
                <label for="profile-phone">Phone number</label>
                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  value="${this.escapeHTML(phone)}"
                  placeholder="Enter your phone number"
                  maxlength="30"
                />
              </div>

              <div class="profile-readonly">
                <div>
                  <span>Account role</span>
                  <strong>${this.escapeHTML(role)}</strong>
                </div>
                <div>
                  <span>Account status</span>
                  <strong>${isActive ? "Active" : "Disabled"}</strong>
                </div>
              </div>

              <div class="profile-form-actions">
                <p>Your changes are saved to your account.</p>
                <button
                  type="submit"
                  class="btn btn-primary"
                  id="save-profile"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
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
    const total = this.notifications.length;

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

        const validDate = createdAt && !Number.isNaN(Date.parse(createdAt));

        const formattedDate = validDate
          ? new Date(createdAt).toLocaleString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit"
            })
          : "";

        return `
          <article class="notification-item notification-card">
            <div class="notification-icon notification-card-icon"
                 aria-hidden="true">
              <span>↗</span>
            </div>

            <div class="notification-content">
              <div class="notification-card-heading">
                <h3>${this.escapeHTML(title)}</h3>
                ${
                  formattedDate
                    ? `<time>${this.escapeHTML(formattedDate)}</time>`
                    : ""
                }
              </div>

              <p>${this.escapeHTML(message || "No additional details provided.")}</p>
            </div>

            ${
              isAdmin
                ? `
                  <button
                    class="btn btn-danger btn-sm delete-notification"
                    data-id="${this.escapeHTML(id)}"
                    aria-label="Delete notification"
                    type="button"
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
      <section class="page-section notifications-page">
        <div class="page-header notifications-page-header">
          <div>
            <p class="eyebrow">YOUR CIVIC EVENTS INBOX</p>
            <h1>Notifications</h1>
            <p class="page-description">
              Important updates, announcements, and information from your community.
            </p>
          </div>

          <div class="notifications-header-icon" aria-hidden="true">
            <span>♢</span>
          </div>
        </div>

        <div class="notifications-overview">
          <div>
            <p class="eyebrow">YOUR INBOX</p>
            <h2>Recent updates</h2>
            <p>Stay up to date with what's happening.</p>
          </div>

          <span class="notification-count">
            ${total} ${total === 1 ? "notification" : "notifications"}
          </span>
        </div>

        <div class="card notifications-card">
          ${
            total
              ? `
                <div class="notification-list">
                  ${notificationHTML}
                </div>
              `
              : `
                <div class="empty-state notification-empty">
                  <div class="notification-empty-icon" aria-hidden="true">
                    ♢
                  </div>
                  <h2>You're all caught up</h2>
                  <p>
                    You don't have any notifications right now.
                    New updates will appear here.
                  </p>
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
