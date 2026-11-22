
import api from "./core/api.js";

const AdminUI = {
  users: [],
  dashboard: null,
  searchTerm: "",

  init() {
    window.addEventListener("route:change", () => {
      this.handleRoute();
    });

    this.handleRoute();
  },

  getCurrentRoute() {
    return window.location.hash.replace(/^#/, "").split("?")[0] || "/";
  },

  handleRoute() {
    if (this.getCurrentRoute() === "/admin") {
      this.renderDashboard();
    }
  },

  getPageContainer() {
    return document.querySelector("#page-content");
  },

  getCurrentUser() {
    try {
      const user = sessionStorage.getItem("civicevents_user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
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

  /* =========================
     DASHBOARD
  ========================= */

  async renderDashboard() {
    const container = this.getPageContainer();

    if (!container) return;

    if (!this.isAdmin()) {
      container.innerHTML = `
        <section class="page-section">
          <div class="card empty-state">
            <h1>Access denied</h1>
            <p>You do not have permission to view this page.</p>
          </div>
        </section>
      `;
      return;
    }

    container.innerHTML = `
      <section class="page-section">
        <div class="page-header">
          <div>
            <p class="eyebrow">Administration</p>
            <h1>Admin Dashboard</h1>
            <p>Manage CivicEvents and its users.</p>
          </div>
        </div>

        <div class="loading-state">
          <p>Loading dashboard...</p>
        </div>
      </section>
    `;

    try {
      const response = await api.get("/dashboard/admin");

      this.dashboard = this.getResponseData(response);

      this.renderDashboardContent();
    } catch (error) {
      container.innerHTML = `
        <section class="page-section">
          <div class="page-header">
            <div>
              <p class="eyebrow">Administration</p>
              <h1>Admin Dashboard</h1>
            </div>
          </div>

          <div class="card empty-state">
            <h2>Could not load dashboard</h2>
            <p>${this.escapeHTML(
              this.getErrorMessage(
                error,
                "Please try again."
              )
            )}</p>

            <button
              class="btn btn-primary"
              id="retry-admin-dashboard"
            >
              Try Again
            </button>
          </div>
        </section>
      `;

      document
        .querySelector("#retry-admin-dashboard")
        ?.addEventListener("click", () => {
          this.renderDashboard();
        });
    }
  },

  renderDashboardContent() {
    const container = this.getPageContainer();

    if (!container) return;

    const stats = this.dashboard || {};

    const totalUsers =
      stats.total_users ??
      stats.totalUsers ??
      stats.users_count ??
      0;

    const totalEvents =
      stats.total_events ??
      stats.totalEvents ??
      stats.events_count ??
      0;

    const totalRegistrations =
      stats.total_registrations ??
      stats.totalRegistrations ??
      stats.registrations_count ??
      0;

    const totalAnnouncements =
      stats.total_announcements ??
      stats.totalAnnouncements ??
      stats.announcements_count ??
      0;

    const totalPromos =
      stats.total_promos ??
      stats.totalPromos ??
      stats.promos_count ??
      0;

    container.innerHTML = `
      <section class="page-section">
        <div class="page-header">
          <div>
            <p class="eyebrow">Administration</p>
            <h1>Admin Dashboard</h1>
            <p>Manage CivicEvents and its users.</p>
          </div>
        </div>

        <div class="stats-grid">
          ${this.renderStatCard("Total Users", totalUsers)}
          ${this.renderStatCard("Events", totalEvents)}
          ${this.renderStatCard("Registrations", totalRegistrations)}
          ${this.renderStatCard("Announcements", totalAnnouncements)}
          ${this.renderStatCard("Promos", totalPromos)}
        </div>

        <div class="card admin-users-card">
          <div class="section-heading">
            <div>
              <h2>User Management</h2>
              <p>View and manage user account status.</p>
            </div>

            <button
              class="btn btn-secondary"
              id="refresh-users"
            >
              Refresh
            </button>
          </div>

          <div class="form-group">
            <label for="user-search">Search users</label>

            <input
              type="search"
              id="user-search"
              placeholder="Search by name or email..."
            />
          </div>

          <div id="admin-users-table">
            <div class="loading-state">
              <p>Loading users...</p>
            </div>
          </div>
        </div>
      </section>
    `;

    document
      .querySelector("#refresh-users")
      ?.addEventListener("click", () => {
        this.loadUsers();
      });

    document
      .querySelector("#user-search")
      ?.addEventListener("input", (event) => {
        this.searchTerm = event.target.value.toLowerCase();
        this.renderUsersTable();
      });

    this.loadUsers();
  },

  renderStatCard(label, value) {
    return `
      <div class="card stat-card">
        <p class="stat-label">${this.escapeHTML(label)}</p>
        <h2 class="stat-value">${this.escapeHTML(value)}</h2>
      </div>
    `;
  },

  /* =========================
     USER MANAGEMENT
  ========================= */

  async loadUsers() {
    const tableContainer = document.querySelector(
      "#admin-users-table"
    );

    if (!tableContainer) return;

    tableContainer.innerHTML = `
      <div class="loading-state">
        <p>Loading users...</p>
      </div>
    `;

    try {
      const response = await api.get("/users");

      this.users = this.getArray(response, [
        "users",
        "data",
        "results",
      ]);

      this.renderUsersTable();
    } catch (error) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <h3>Could not load users</h3>
          <p>${this.escapeHTML(
            this.getErrorMessage(
              error,
              "Please try again."
            )
          )}</p>
        </div>
      `;
    }
  },

  renderUsersTable() {
    const tableContainer = document.querySelector(
      "#admin-users-table"
    );

    if (!tableContainer) return;

    const filteredUsers = this.users.filter((user) => {
      const name = [
        user.first_name,
        user.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const email = (user.email || "").toLowerCase();

      return (
        name.includes(this.searchTerm) ||
        email.includes(this.searchTerm)
      );
    });

    if (!filteredUsers.length) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <h3>No users found</h3>
          <p>Try changing your search.</p>
        </div>
      `;
      return;
    }

    const rows = filteredUsers
      .map((user) => {
        const fullName = [
          user.first_name,
          user.last_name,
        ]
          .filter(Boolean)
          .join(" ") || "Unnamed User";

        const isActive =
          user.is_active !== false &&
          user.isActive !== false &&
          user.status !== "disabled";

        const isCurrentUser =
          String(user.id) ===
          String(this.getCurrentUser()?.id);

        return `
          <tr>
            <td>${this.escapeHTML(fullName)}</td>

            <td>${this.escapeHTML(user.email || "")}</td>

            <td>
              <span class="status-badge ${
                isActive ? "status-active" : "status-disabled"
              }">
                ${isActive ? "Active" : "Disabled"}
              </span>
            </td>

            <td>
              ${this.escapeHTML(user.role || "user")}
            </td>

            <td>
              ${
                isCurrentUser
                  ? `<span class="text-muted">Current account</span>`
                  : `
                    <button
                      class="btn ${
                        isActive
                          ? "btn-danger"
                          : "btn-primary"
                      } btn-sm toggle-user-status"
                      data-id="${this.escapeHTML(user.id)}"
                      data-active="${isActive}"
                    >
                      ${isActive ? "Disable" : "Enable"}
                    </button>
                  `
              }
            </td>
          </tr>
        `;
      })
      .join("");

    tableContainer.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

    tableContainer
      .querySelectorAll(".toggle-user-status")
      .forEach((button) => {
        button.addEventListener("click", () => {
          this.toggleUserStatus(
            button.dataset.id,
            button.dataset.active === "true"
          );
        });
      });
  },

  async toggleUserStatus(id, currentlyActive) {
    if (!id) return;

    const action = currentlyActive
      ? "disable"
      : "enable";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this account?`
    );

    if (!confirmed) return;

    try {
      await api.patch(
        `/users/${encodeURIComponent(id)}/${action}`
      );

      this.users = this.users.map((user) => {
        if (String(user.id) !== String(id)) {
          return user;
        }

        return {
          ...user,
          is_active: !currentlyActive,
        };
      });

      this.renderUsersTable();
    } catch (error) {
      window.alert(
        this.getErrorMessage(
          error,
          `Could not ${action} this account.`
        )
      );
    }
  },
};

AdminUI.init();

export default AdminUI;
