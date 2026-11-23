
import api from "./core/api.js";

const AdminUI = {
  users: [],
  events: [],
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

        <div class="card admin-events-card">
          <div class="section-heading">
            <div>
              <h2>Event Management</h2>
              <p>Create, edit and manage CivicEvents events.</p>
            </div>
          </div>

          <form id="admin-event-form" class="admin-event-form">
            <h3 id="event-form-heading">Create Event</h3>

            <div class="form-group">
              <label for="admin-event-title">Event title</label>
              <input id="admin-event-title" name="title" required maxlength="200">
            </div>

            <div class="form-group">
              <label for="admin-event-description">Description</label>
              <textarea id="admin-event-description" name="description" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label for="admin-event-location">Location</label>
              <input id="admin-event-location" name="location" required>
            </div>

            <div class="form-group">
              <label for="admin-event-start">Start date and time</label>
              <input id="admin-event-start" name="starts_at" type="datetime-local" required>
            </div>

            <div class="form-group">
              <label for="admin-event-end">End date and time</label>
              <input id="admin-event-end" name="ends_at" type="datetime-local" required>
            </div>

            <div class="form-group">
              <label for="admin-event-image">Event image (optional)</label>
              <input id="admin-event-image" name="image" type="file" accept="image/jpeg,image/png,image/gif">
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="admin-event-submit">
                Create Event
              </button>
              <button type="button" class="btn btn-secondary" id="admin-event-cancel" hidden>
                Cancel Edit
              </button>
            </div>

            <div id="admin-event-message" class="form-message hidden"></div>
          </form>

          <div class="section-heading">
            <h3>Existing Events</h3>
            <button type="button" class="btn btn-secondary" id="refresh-events">
              Refresh
            </button>
          </div>

          <div id="admin-events-table">
            <div class="loading-state"><p>Loading events...</p></div>
          </div>
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
    this.loadEvents();
    this.attachEventForm();
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
     EVENT MANAGEMENT
  ========================= */

  editingEventId: null,

  formatDateTimeInput(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  },

  async loadEvents() {
    const table = document.querySelector("#admin-events-table");
    if (!table) return;

    table.innerHTML = '<div class="loading-state"><p>Loading events...</p></div>';

    try {
      const response = await api.get("/events");
      this.events = this.getArray(response, ["events", "results"]);
      this.renderEventsTable();
    } catch (error) {
      table.innerHTML = `
        <div class="empty-state">
          <h3>Could not load events</h3>
          <p>${this.escapeHTML(this.getErrorMessage(error, "Please try again."))}</p>
        </div>
      `;
    }
  },

  renderEventsTable() {
    const table = document.querySelector("#admin-events-table");
    if (!table) return;

    if (!this.events?.length) {
      table.innerHTML = `
        <div class="empty-state">
          <h3>No events yet</h3>
          <p>Use the form above to create the first event.</p>
        </div>
      `;
      return;
    }

    const rows = this.events.map((event) => {
      const start = event.starts_at
        ? new Date(event.starts_at).toLocaleString()
        : "Not set";

      return `
        <tr>
          <td>${this.escapeHTML(event.title || "Untitled event")}</td>
          <td>${this.escapeHTML(event.location || "Not set")}</td>
          <td>${this.escapeHTML(start)}</td>
          <td>
            <button
              type="button"
              class="btn btn-secondary btn-sm view-event-attendees"
              data-id="${this.escapeHTML(event.id)}"
            >Attendees</button>
            <button
              type="button"
              class="btn btn-secondary btn-sm edit-admin-event"
              data-id="${this.escapeHTML(event.id)}"
            >Edit</button>
            <button
              type="button"
              class="btn btn-danger btn-sm delete-admin-event"
              data-id="${this.escapeHTML(event.id)}"
            >Delete</button>
          </td>
        </tr>
      `;
    }).join("");

    table.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Starts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    table.querySelectorAll(".view-event-attendees").forEach((button) => {
      button.addEventListener("click", () =>
        this.viewEventAttendees(button.dataset.id)
      );
    });

    table.querySelectorAll(".edit-admin-event").forEach((button) => {
      button.addEventListener("click", () => this.editEvent(button.dataset.id));
    });

    table.querySelectorAll(".delete-admin-event").forEach((button) => {
      button.addEventListener("click", () => this.deleteEvent(button.dataset.id));
    });
  },

  async viewEventAttendees(eventId) {
    const event = this.events.find(
      (item) => String(item.id) === String(eventId)
    );

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <section
        class="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendees-modal-title"
      >
        <div class="section-heading">
          <div>
            <p class="eyebrow">Event registrations</p>
            <h2 id="attendees-modal-title">
              Attendees — ${this.escapeHTML(event?.title || "Event")}
            </h2>
          </div>
          <button type="button" class="btn btn-secondary" data-close>
            Close
          </button>
        </div>
        <div class="attendees-modal-body">
          <p>Loading attendees...</p>
        </div>
      </section>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector("[data-close]").addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });

    const body = overlay.querySelector(".attendees-modal-body");

    try {
      const response = await api.get(
        `/event-registrations/event/${encodeURIComponent(eventId)}/attendees`
      );

      const payload = response?.data ?? response;
      const attendees = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.attendees)
          ? payload.attendees
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      if (!attendees.length) {
        body.innerHTML = `<p>No active registrations for this event.</p>`;
        return;
      }

      body.innerHTML = `
        <p>${attendees.length} registered
          ${attendees.length === 1 ? "attendee" : "attendees"}</p>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Registered</th></tr>
            </thead>
            <tbody>
              ${attendees.map((person) => `
                <tr>
                  <td>${this.escapeHTML(person.full_name || "Unknown")}</td>
                  <td>${this.escapeHTML(person.email || "Not available")}</td>
                  <td>${person.created_at
                    ? this.escapeHTML(new Date(person.created_at).toLocaleDateString())
                    : "—"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      body.innerHTML = `
        <p class="form-message error">
          ${this.escapeHTML(this.getErrorMessage(
            error,
            "Unable to load attendees."
          ))}
        </p>
      `;
    }
  },

  attachEventForm() {
    const form = document.querySelector("#admin-event-form");
    if (!form || form.dataset.bound === "true") return;

    form.dataset.bound = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const title = document.querySelector("#admin-event-title").value.trim();
      const location = document.querySelector("#admin-event-location").value.trim();
      const startsAt = document.querySelector("#admin-event-start").value;
      const endsAt = document.querySelector("#admin-event-end").value;

      if (!title || !location || !startsAt || !endsAt) {
        this.showEventMessage("Please complete all required fields.");
        return;
      }

      if (new Date(endsAt) <= new Date(startsAt)) {
        this.showEventMessage("The end date must be after the start date.");
        return;
      }

      const formData = new FormData(form);
      const submit = document.querySelector("#admin-event-submit");
      submit.disabled = true;

      try {
        if (this.editingEventId) {
          await api.upload(
            `/events/${encodeURIComponent(this.editingEventId)}`,
            formData,
            { method: "PUT" }
          );
          this.showEventMessage("Event updated successfully.", "success");
        } else {
          await api.upload("/events", formData);
          this.showEventMessage("Event created successfully.", "success");
        }

        this.resetEventForm();
        await this.loadEvents();
      } catch (error) {
        this.showEventMessage(
          this.getErrorMessage(error, "Unable to save the event.")
        );
      } finally {
        submit.disabled = false;
      }
    });

    document.querySelector("#admin-event-cancel")
      ?.addEventListener("click", () => this.resetEventForm());

    document.querySelector("#refresh-events")
      ?.addEventListener("click", () => this.loadEvents());
  },

  editEvent(id) {
    const event = this.events.find((item) => String(item.id) === String(id));
    if (!event) return;

    this.editingEventId = event.id;

    document.querySelector("#admin-event-title").value = event.title || "";
    document.querySelector("#admin-event-description").value = event.description || "";
    document.querySelector("#admin-event-location").value = event.location || "";
    document.querySelector("#admin-event-start").value =
      this.formatDateTimeInput(event.starts_at);
    document.querySelector("#admin-event-end").value =
      this.formatDateTimeInput(event.ends_at);
    document.querySelector("#admin-event-image").value = "";

    document.querySelector("#event-form-heading").textContent = "Edit Event";
    document.querySelector("#admin-event-submit").textContent = "Save Changes";
    document.querySelector("#admin-event-cancel").hidden = false;

    document.querySelector("#admin-event-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  },

  async deleteEvent(id) {
    const event = this.events.find((item) => String(item.id) === String(id));
    if (!event) return;

    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/events/${encodeURIComponent(id)}`);
      await this.loadEvents();
    } catch (error) {
      window.alert(this.getErrorMessage(error, "Unable to delete this event."));
    }
  },

  resetEventForm() {
    const form = document.querySelector("#admin-event-form");
    form?.reset();

    this.editingEventId = null;

    const heading = document.querySelector("#event-form-heading");
    const submit = document.querySelector("#admin-event-submit");
    const cancel = document.querySelector("#admin-event-cancel");

    if (heading) heading.textContent = "Create Event";
    if (submit) submit.textContent = "Create Event";
    if (cancel) cancel.hidden = true;

    const message = document.querySelector("#admin-event-message");
    if (message) message.className = "form-message hidden";
  },

  showEventMessage(message, type = "error") {
    const box = document.querySelector("#admin-event-message");
    if (!box) return;

    box.textContent = message;
    box.className = `form-message ${type}`;
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
      const name = (
        user.full_name ||
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        ""
      ).toLowerCase();

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
        const fullName =
          user.full_name ||
          [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          "Unnamed User";

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
