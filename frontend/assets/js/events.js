
import api from "./core/api.js";
import auth from "./core/auth.js";
import { buildMediaUrl } from "./config.js";

/**
 * CivicEvents Events Module
 *
 * Events listing, search, filtering, details,
 * registration, cancellation, and feedback.
 */

const Events = {
  events: [],
  registrations: [],
  selectedEvent: null,
  filters: {
    search: "",
    location: "",
    status: ""
  },

  /**
   * Safely escape text before inserting it into HTML.
   */
  escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return entities[character];
    });
  },

  /**
   * Normalize common backend response formats.
   */
  getArray(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.events)) return response.events;
    if (Array.isArray(response?.results)) return response.results;

    return [];
  },

  /**
   * Format an event date.
   */
  formatDate(date) {
    if (!date) return "Date to be announced";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date to be announced";
    }

    return parsedDate.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  },

  /**
   * Format an event time.
   */
  formatTime(time) {
    if (!time) return "";

    return this.escapeHTML(time);
  },

  /**
   * Get a safe event image URL.
   */
  getImage(event) {
    let metadata = event.metadata || {};

    if (typeof metadata === "string") {
      try {
        metadata = JSON.parse(metadata);
      } catch {
        metadata = {};
      }
    }

    const image =
      event.image_url ||
      event.image ||
      metadata.image_url ||
      metadata.image ||
      "";

    if (!image) return "";

    if (/^https?:\/\//i.test(image)) {
      return image;
    }

    return buildMediaUrl(image);
  },

  /**
   * Load events from the backend.
   */
  async loadEvents() {
    const response = await api.get("/events");

    this.events = this.getArray(response);

    return this.events;
  },

  /**
   * Load the current user's registrations.
   */
  async loadRegistrations() {
    if (!auth.isAuthenticated()) {
      this.registrations = [];
      return [];
    }

    try {
      const response = await api.get(
        "/event-registrations/my-registrations"
      );

      this.registrations = this.getArray(response);

      return this.registrations;
    } catch (error) {
      console.error("Unable to load registrations:", error);
      this.registrations = [];
      return [];
    }
  },

  /**
   * Check whether the user is registered for an event.
   */
  isRegistered(eventId) {
    return this.registrations.some((registration) => {
      const registeredEventId =
        registration.event_id ||
        registration.event?.id ||
        registration.event?.event_id;

      return (
        registration.status === "registered" &&
        String(registeredEventId) === String(eventId)
      );
    });
  },

  /**
   * Render the events page.
   */
  async render() {
    const container = document.getElementById("page-content");

    if (!container) return;

    container.innerHTML = `
      <section class="page-header">
        <div>
          <p class="eyebrow">DISCOVER YOUR CITY</p>
          <h1>Events</h1>
          <p class="page-description">
            Find something happening near you.
          </p>
        </div>
      </section>

      <section class="events-toolbar">
        <div class="form-group">
          <label for="event-search">Search events</label>
          <input
            type="search"
            id="event-search"
            placeholder="Search by event name..."
          />
        </div>

        <div class="form-group">
          <label for="event-location-filter">Location</label>
          <input
            type="search"
            id="event-location-filter"
            placeholder="Filter by location..."
          />
        </div>

        <div class="form-group">
          <label for="event-status">Status</label>
          <select id="event-status">
            <option value="">All events</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
      </section>

      <div id="events-message" class="form-message hidden"></div>

      <section id="events-grid" class="events-grid">
        <div class="loading-state">
          Loading events...
        </div>
      </section>
    `;

    this.attachFilterEvents();

    try {
      await Promise.all([
        this.loadEvents(),
        this.loadRegistrations()
      ]);

      this.populateCategories();
      this.renderEventCards();
    } catch (error) {
      this.showMessage(
        error.message || "Unable to load events."
      );

      document.getElementById("events-grid").innerHTML = `
        <div class="empty-state">
          <h2>Events unavailable</h2>
          <p>
            We couldn't connect to the server.
            Please try again.
          </p>
          <button id="retry-events" class="btn btn-primary">
            Try Again
          </button>
        </div>
      `;

      document
        .getElementById("retry-events")
        ?.addEventListener("click", () => this.render());
    }
  },

  /**
   * Populate the category filter from available events.
   */
  populateCategories() {
    const select = document.getElementById("event-category");

    if (!select) return;

    const categories = [
      ...new Set(
        this.events
          .map((event) => event.category)
          .filter(Boolean)
      )
    ];

    select.innerHTML = `
      <option value="">All categories</option>
      ${categories
        .map(
          (category) => `
            <option value="${this.escapeHTML(category)}">
              ${this.escapeHTML(category)}
            </option>
          `
        )
        .join("")}
    `;
  },

  /**
   * Attach search and filter listeners.
   */
  attachFilterEvents() {
    const search = document.getElementById("event-search");
    const location = document.getElementById("event-location-filter");
    const status = document.getElementById("event-status");

    search?.addEventListener("input", (event) => {
      this.filters.search = event.target.value.toLowerCase().trim();
      this.renderEventCards();
    });

    location?.addEventListener("input", (event) => {
      this.filters.location = event.target.value.toLowerCase().trim();
      this.renderEventCards();
    });

    status?.addEventListener("change", (event) => {
      this.filters.status = event.target.value;
      this.renderEventCards();
    });
  },

  /**
   * Filter the events currently loaded.
   */
  getFilteredEvents() {
    const now = new Date();

    return this.events.filter((event) => {
      const title = (event.title || event.name || "").toLowerCase();
      const description = (event.description || "").toLowerCase();
      const location = (event.location || "").toLowerCase();

      const matchesSearch =
        title.includes(this.filters.search || "") ||
        description.includes(this.filters.search || "");

      const matchesLocation =
        !this.filters.location ||
        location.includes(this.filters.location);

      const rawDate = event.starts_at || event.start_date || event.date;
      const eventDate = rawDate ? new Date(rawDate) : null;

      const hasValidDate =
        eventDate && !Number.isNaN(eventDate.getTime());

      const isPast = hasValidDate && eventDate < now;

      const matchesStatus =
        !this.filters.status ||
        (this.filters.status === "past" && isPast) ||
        (this.filters.status === "upcoming" && hasValidDate && !isPast);

      return matchesSearch && matchesLocation && matchesStatus;
    });
  },

  /**
   * Render event cards.
   */
  renderEventCards() {
    const grid = document.getElementById("events-grid");

    if (!grid) return;

    const filteredEvents = this.getFilteredEvents();

    if (filteredEvents.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <h2>No events found</h2>
          <p>Try changing your search or filters.</p>
        </div>
      `;

      return;
    }

    grid.innerHTML = filteredEvents
      .map((event) => {
        const id = event.id || event.event_id;
        const title = event.title || event.name || "Untitled event";
        const image = this.getImage(event);
        const date = event.starts_at || event.start_date || event.date;
        const category = event.category || "General";
        const eventText = `${title} ${category}`.toLowerCase();

        let imageTheme = "community";
        let imageLabel = "Community gathering";

        if (/technology|digital|computer|literacy|software|coding/.test(eventText)) {
          imageTheme = "technology";
          imageLabel = "Technology & learning";
        } else if (/summit|conference|innovation|business|entrepreneur/.test(eventText)) {
          imageTheme = "summit";
          imageLabel = "Ideas & innovation";
        } else if (/music|concert|festival|art|culture|dance/.test(eventText)) {
          imageTheme = "culture";
          imageLabel = "Arts & culture";
        } else if (/sport|football|fitness|marathon|game/.test(eventText)) {
          imageTheme = "sports";
          imageLabel = "Sports & activities";
        }

        return `
          <article class="event-card">
            ${
              image
                ? `
                  <img
                    class="event-card-image"
                    src="${this.escapeHTML(image)}"
                    alt="${this.escapeHTML(title)}"
                    loading="lazy"
                  />
                `
                : `
                  <div class="event-card-image event-image-placeholder event-theme-${imageTheme}">
                    <span class="event-placeholder-orbit" aria-hidden="true"></span>
                    <span class="event-placeholder-label">${this.escapeHTML(imageLabel)}</span>
                  </div>
                `
            }

            <div class="event-card-content">
              <span class="badge">
                ${this.escapeHTML(category)}
              </span>

              <h2>${this.escapeHTML(title)}</h2>

              <p class="event-date">
                ${this.formatDate(date)}
                ${this.formatTime(event.start_time)}
              </p>

              <p class="event-location">
                ${this.escapeHTML(
                  event.location || "Location to be announced"
                )}
              </p>

              <button
                class="btn btn-primary event-details-button"
                data-event-id="${this.escapeHTML(id)}"
              >
                View Details
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    grid.querySelectorAll(".event-details-button").forEach((button) => {
      button.addEventListener("click", () => {
        this.showDetails(button.dataset.eventId);
      });
    });
  },

  /**
   * Show detailed information about an event.
   */
  async showDetails(eventId) {
    const event = this.events.find((item) => {
      return String(item.id || item.event_id) === String(eventId);
    });

    if (!event) {
      try {
        this.selectedEvent = await api.get(`/events/${eventId}`);
      } catch (error) {
        this.showMessage("Unable to load event details.");
        return;
      }
    } else {
      this.selectedEvent = event;
    }

    const selected = this.selectedEvent;
    const container = document.getElementById("page-content");

    if (!container) return;

    const id = selected.id || selected.event_id;
    const title = selected.title || selected.name || "Event";
    const image = this.getImage(selected);
    const date = selected.starts_at || selected.start_date || selected.date;
    const location = selected.location || "Location to be announced";
    const category = selected.category || "General";
    const description =
      selected.description || "No description available.";

    container.innerHTML = `
      <section class="event-detail-page">

        <div class="event-detail-topbar">
          <button id="back-to-events" class="event-back-button">
            <span aria-hidden="true">←</span>
            Back to Events
          </button>
          <span class="event-detail-breadcrumb">Events / Details</span>
        </div>

        <header class="event-detail-hero">
          ${
            image
              ? `
                <img
                  class="event-detail-image"
                  src="${this.escapeHTML(image)}"
                  alt="${this.escapeHTML(title)}"
                />
              `
              : `
                <div class="event-detail-image-placeholder">
                  <span>CivicEvents</span>
                  <strong>${this.escapeHTML(category)}</strong>
                </div>
              `
          }

          <div class="event-detail-hero-content">
            <span class="event-detail-category">
              ${this.escapeHTML(category)}
            </span>
            <h1>${this.escapeHTML(title)}</h1>
            <div class="event-detail-hero-meta">
              <span>
                <span aria-hidden="true">▦</span>
                ${this.formatDate(date)}
              </span>
              <span>
                <span aria-hidden="true">⌖</span>
                ${this.escapeHTML(location)}
              </span>
            </div>
          </div>
        </header>

        <div class="event-detail-main-grid">

          <main class="event-detail-information">
            <section class="event-detail-panel">
              <p class="eyebrow">ABOUT THIS EVENT</p>
              <h2>Event overview</h2>
              <div class="event-description">
                ${this.escapeHTML(description)}
              </div>
            </section>

            <section class="feedback-section event-feedback-section">
              <div class="feedback-section-heading">
                <div>
                  <p class="eyebrow">COMMUNITY VOICES</p>
                  <h2>Event feedback</h2>
                  <p>See what other attendees thought about this event.</p>
                </div>
              </div>

              <div id="event-feedback-list" aria-live="polite">
                <p>Loading event feedback...</p>
              </div>

              <div class="feedback-form-panel">
                <div class="feedback-form-heading">
                  <h3>Share your experience</h3>
                  <p>Your feedback helps improve future events.</p>
                </div>

                <form id="event-feedback-form">
                  <div class="form-group">
                    <label for="feedback-rating">Your rating</label>
                    <select id="feedback-rating" required>
                      <option value="">Choose a rating</option>
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Very poor</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="feedback-comment">Your comments</label>
                    <textarea
                      id="feedback-comment"
                      rows="4"
                      placeholder="Tell us about your experience..."
                    ></textarea>
                  </div>

                  <button type="submit" class="btn btn-primary">
                    Submit Feedback
                  </button>
                </form>

                <div id="feedback-message" class="form-message hidden"></div>
              </div>
            </section>
          </main>

          <aside class="event-detail-sidebar">
            <section class="event-registration-panel">
              <p class="eyebrow">TAKE PART</p>
              <h2>Join this event</h2>
              <p>
                Interested in attending? Use the option below to manage
                your event registration.
              </p>

              <div class="event-registration-divider"></div>

              <div id="event-action-area">
                <p>Loading registration options...</p>
              </div>
            </section>

            <section class="event-detail-note">
              <span class="event-note-icon" aria-hidden="true">✦</span>
              <h3>Be part of your community</h3>
              <p>
                Discover opportunities to connect, participate, and make
                a difference through local events.
              </p>
            </section>
          </aside>

        </div>
      </section>
    `;

    document
      .getElementById("back-to-events")
      ?.addEventListener("click", () => this.render());

    this.renderRegistrationAction(id);
    this.loadEventFeedback(id);
    this.attachFeedbackForm(id);
  },

  /**
   * Render the registration or cancellation button.
   */
  renderRegistrationAction(eventId) {
    const area = document.getElementById("event-action-area");
    if (!area) return;

    const selectedEvent = this.events.find(
      (event) => String(event.id) === String(eventId)
    );

    if (
      selectedEvent &&
      (selectedEvent.published !== true ||
        (selectedEvent.starts_at &&
          new Date(selectedEvent.starts_at).getTime() <= Date.now()))
    ) {
      area.innerHTML = `
        <p class="form-message">
          Registration is closed for this event.
        </p>
      `;
      return;
    }

    if (!auth.isAuthenticated()) {
      area.innerHTML = `
        <p>Sign in to register for this event.</p>
        <a href="#/login" class="btn btn-primary">Sign In</a>
      `;
      return;
    }

    const registered = this.isRegistered(eventId);

    area.innerHTML = registered
      ? `<button id="cancel-registration" class="btn btn-outline">
           Cancel Registration
         </button>`
      : `<button id="register-event" class="btn btn-primary">
           Register for Event
         </button>`;

    document.getElementById("register-event")
      ?.addEventListener("click", () => this.register(eventId));

    document.getElementById("cancel-registration")
      ?.addEventListener("click", () => this.cancelRegistration(eventId));
  },

  /**
   * Register the current user for an event.
   */
  async register(eventId) {
    try {
      await api.post("/event-registrations/register", {
        event_id: eventId
      });

      await this.loadRegistrations();
      this.renderRegistrationAction(eventId);

      this.showMessage("You have registered successfully.", "success");
    } catch (error) {
      this.showMessage(error.message || "Registration failed.");
    }
  },

  /**
   * Cancel an event registration.
   */
  async cancelRegistration(eventId) {
    try {
      await api.post("/event-registrations/cancel", {
        event_id: eventId
      });

      await this.loadRegistrations();
      this.renderRegistrationAction(eventId);

      this.showMessage("Your registration has been cancelled.", "success");
    } catch (error) {
      this.showMessage(error.message || "Unable to cancel registration.");
    }
  },

  /**
   * Load and display feedback for an event.
   */
  async loadEventFeedback(eventId) {
    const container = document.getElementById("event-feedback-list");
    if (!container) return;

    try {
      const response = await api.get(
        `/event-feedback/event/${encodeURIComponent(eventId)}`
      );

      const payload = response?.data ?? response;
      const feedback = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.feedback)
          ? payload.feedback
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      if (!feedback.length) {
        container.innerHTML = `
          <h2>Event feedback</h2>
          <p>No feedback has been submitted for this event yet.</p>
        `;
        return;
      }

      const average =
        feedback.reduce((total, item) => total + Number(item.rating || 0), 0) /
        feedback.length;

      container.innerHTML = `
        <h2>Event feedback</h2>
        <p class="feedback-average">
          <strong>${average.toFixed(1)} / 5</strong>
          average rating · ${feedback.length}
          ${feedback.length === 1 ? "review" : "reviews"}
        </p>
        <div class="feedback-list">
          ${feedback.map((item) => `
            <article class="feedback-card">
              <div class="feedback-card-heading">
                <strong>${this.escapeHTML(item.full_name || "CivicEvents user")}</strong>
                <span aria-label="${Number(item.rating)} out of 5 stars">
                  ${"★".repeat(Math.max(0, Math.min(5, Number(item.rating) || 0)))}
                  ${"☆".repeat(5 - Math.max(0, Math.min(5, Number(item.rating) || 0)))}
                </span>
              </div>
              ${item.comment
                ? `<p>${this.escapeHTML(item.comment)}</p>`
                : `<p>No written comment.</p>`}
              <small>${item.created_at
                ? this.formatDate(item.created_at)
                : ""}</small>
            </article>
          `).join("")}
        </div>
      `;
    } catch (error) {
      container.innerHTML = `
        <h2>Event feedback</h2>
        <p>Feedback could not be loaded. Please try again later.</p>
      `;
    }
  },

  /**
   * Attach the feedback form.
   */
  attachFeedbackForm(eventId) {
    const form = document.getElementById("event-feedback-form");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!auth.isAuthenticated()) {
        this.showFeedbackMessage("Please sign in to submit feedback.");
        return;
      }

      const rating = Number(
        document.getElementById("feedback-rating").value
      );

      const comment = document
        .getElementById("feedback-comment")
        .value
        .trim();

      try {
        await api.post("/event-feedback", {
          event_id: eventId,
          rating,
          comment
        });

        this.showFeedbackMessage(
          "Thank you for your feedback!",
          "success"
        );

        form.reset();
        await this.loadEventFeedback(eventId);
      } catch (error) {
        this.showFeedbackMessage(
          error.message || "Unable to submit feedback."
        );
      }
    });
  },

  /**
   * Display a general events message.
   */
  showMessage(message, type = "error") {
    const box = document.getElementById("events-message");

    if (!box) {
      const actionArea = document.getElementById("event-action-area");
      if (actionArea) {
        let detailMessage = document.getElementById("event-action-message");

        if (!detailMessage) {
          detailMessage = document.createElement("p");
          detailMessage.id = "event-action-message";
          detailMessage.setAttribute("role", "status");
          actionArea.appendChild(detailMessage);
        }

        detailMessage.textContent = message;
        detailMessage.className = `form-message ${type}`;
        return;
      }

      console.log(message);
      return;
    }

    box.textContent = message;
    box.className = `form-message ${type}`;
  },

  /**
   * Display a feedback message.
   */
  showFeedbackMessage(message, type = "error") {
    const box = document.getElementById("feedback-message");

    if (!box) return;

    box.textContent = message;
    box.className = `form-message ${type}`;
  }
};

/**
 * Render events whenever the events route is opened.
 */
window.addEventListener("route:change", (event) => {
  if (event.detail?.path === "/events") {
    Events.render();
  }
});

export default Events;
