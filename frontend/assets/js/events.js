
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
    category: "",
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
    const image = event.image_url || event.image || "";

    if (!image) {
      return "";
    }

    if (image.startsWith("http://") || image.startsWith("https://")) {
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

      return String(registeredEventId) === String(eventId);
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
          <label for="event-category">Category</label>
          <select id="event-category">
            <option value="">All categories</option>
          </select>
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
    const category = document.getElementById("event-category");
    const status = document.getElementById("event-status");

    search?.addEventListener("input", (event) => {
      this.filters.search = event.target.value.toLowerCase();
      this.renderEventCards();
    });

    category?.addEventListener("change", (event) => {
      this.filters.category = event.target.value;
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

      const matchesSearch =
        title.includes(this.filters.search) ||
        description.includes(this.filters.search);

      const matchesCategory =
        !this.filters.category ||
        event.category === this.filters.category;

      const eventDate = new Date(
        event.start_date || event.date || ""
      );

      const isPast =
        !Number.isNaN(eventDate.getTime()) &&
        eventDate < now;

      const matchesStatus =
        !this.filters.status ||
        (this.filters.status === "past" && isPast) ||
        (this.filters.status === "upcoming" && !isPast);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
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
        const date = event.start_date || event.date;
        const category = event.category || "General";

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
                  <div class="event-card-image event-image-placeholder">
                    <span>CivicEvents</span>
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

    container.innerHTML = `
      <section class="event-detail-page">
        <button id="back-to-events" class="btn btn-outline">
          ← Back to Events
        </button>

        ${
          image
            ? `
              <img
                class="event-detail-image"
                src="${this.escapeHTML(image)}"
                alt="${this.escapeHTML(title)}"
              />
            `
            : ""
        }

        <div class="event-detail-content">
          <span class="badge">
            ${this.escapeHTML(selected.category || "General")}
          </span>

          <h1>${this.escapeHTML(title)}</h1>

          <p class="event-date">
            ${this.formatDate(selected.start_date || selected.date)}
          </p>

          <p class="event-location">
            ${this.escapeHTML(
              selected.location || "Location to be announced"
            )}
          </p>

          <div class="event-description">
            ${this.escapeHTML(
              selected.description || "No description available."
            )}
          </div>

          <div id="event-action-area"></div>

          <section class="feedback-section">
            <h2>Share your feedback</h2>

            <form id="event-feedback-form">
              <div class="form-group">
                <label for="feedback-rating">Rating</label>
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
                <label for="feedback-comment">Comment</label>
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
          </section>
        </div>
      </section>
    `;

    document
      .getElementById("back-to-events")
      ?.addEventListener("click", () => this.render());

    this.renderRegistrationAction(id);
    this.attachFeedbackForm(id);
  },

  /**
   * Render the registration or cancellation button.
   */
  renderRegistrationAction(eventId) {
    const area = document.getElementById("event-action-area");

    if (!area) return;

    if (!auth.isAuthenticated()) {
      area.innerHTML = `
        <p>Sign in to register for this event.</p>
        <a href="#/login" class="btn btn-primary">
          Sign In
        </a>
      `;

      return;
    }

    const registered = this.isRegistered(eventId);

    area.innerHTML = registered
      ? `
        <button id="cancel-registration" class="btn btn-outline">
          Cancel Registration
        </button>
      `
      : `
        <button id="register-event" class="btn btn-primary">
          Register for Event
        </button>
      `;

    document
      .getElementById("register-event")
      ?.addEventListener("click", () => this.register(eventId));

    document
      .getElementById("cancel-registration")
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
