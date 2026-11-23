
import api from "./core/api.js";
import { buildMediaUrl } from "./config.js";

/**
 * CivicEvents Media Module
 *
 * Announcements:
 * - Audio announcements
 * - Transcripts
 *
 * Promos:
 * - Promotional videos
 * - Captions when a caption file is available
 */

const Media = {
  announcements: [],
  promos: [],
  currentType: "announcements",

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

  getArray(response, key) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.[key])) return response[key];
    if (Array.isArray(response?.results)) return response.results;

    return [];
  },

  /**
   * Convert a backend media path into a usable URL.
   */
  getMediaUrl(path) {
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    return buildMediaUrl(path);
  },

  /**
   * Load announcements.
   */
  async loadAnnouncements() {
    const response = await api.get("/announcements");

    this.announcements = this.getArray(
      response,
      "announcements"
    );

    return this.announcements;
  },

  /**
   * Load promotional videos.
   */
  async loadPromos() {
    const response = await api.get("/promos");

    this.promos = this.getArray(response, "promos");

    return this.promos;
  },

  /**
   * Render the announcements page.
   */
  async renderAnnouncements() {
    this.currentType = "announcements";

    const container = document.getElementById("page-content");

    if (!container) return;

    container.innerHTML = `
      <section class="page-header">
        <div>
          <p class="eyebrow">STAY INFORMED</p>
          <h1>Announcements</h1>
          <p class="page-description">
            Listen to important updates from your city.
          </p>
        </div>
      </section>

      <div class="form-group media-search">
        <label for="announcement-search">Search announcements</label>
        <input
          type="search"
          id="announcement-search"
          placeholder="Search announcements..."
        />
      </div>

      <div id="announcements-message" class="form-message hidden"></div>

      <section id="announcements-list" class="media-grid">
        <p>Loading announcements...</p>
      </section>
    `;

    try {
      await this.loadAnnouncements();
      this.renderAnnouncementCards();

      document
        .getElementById("announcement-search")
        ?.addEventListener("input", (event) => {
          this.renderAnnouncementCards(event.target.value);
        });
    } catch (error) {
      this.showMediaMessage(
        "announcements-message",
        error.message || "Unable to load announcements."
      );
    }
  },

  /**
   * Render announcement cards.
   */
  renderAnnouncementCards(search = "") {
    const container = document.getElementById("announcements-list");

    if (!container) return;

    const query = search.toLowerCase();

    const filtered = this.announcements.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const description = (item.description || "").toLowerCase();

      return title.includes(query) || description.includes(query);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h2>No announcements found</h2>
          <p>Try another search.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = filtered
      .map((item) => {
        const id = item.id || item.announcement_id;
        const title = item.title || "Untitled announcement";
        const audio = this.getMediaUrl(
          item.audio_url || item.audio_path || item.audio
        );

        const audioExtension = audio
          ? audio.split("?")[0].split(".").pop().toLowerCase()
          : "";

        const audioMimeTypes = {
          mp3: "audio/mpeg",
          wav: "audio/wav",
          m4a: "audio/mp4",
          ogg: "audio/ogg"
        };

        const audioType = audioMimeTypes[audioExtension] || "audio/mpeg";

        return `
          <article class="media-card">
            <div class="media-card-content">
              <span class="badge">Announcement</span>

              <h2>${this.escapeHTML(title)}</h2>

              <p>
                ${this.escapeHTML(
                  item.description || "No description available."
                )}
              </p>

              ${
                audio
                  ? `
                    <audio controls preload="none">
                      <source
                        src="${this.escapeHTML(audio)}"
                        type="${audioType}"
                      />
                      Your browser does not support audio playback.
                    </audio>
                  `
                  : `
                    <p class="media-unavailable">
                      Audio is not available for this announcement.
                    </p>
                  `
              }

              <button
                class="btn btn-outline announcement-details-button"
                data-announcement-id="${this.escapeHTML(id)}"
              >
                View Announcement Details
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    container
      .querySelectorAll(".announcement-details-button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          this.showAnnouncementDetails(
            button.dataset.announcementId
          );
        });
      });
  },

  /**
   * Show announcement transcript and details.
   */
  async showAnnouncementDetails(id) {
    let announcement = this.announcements.find((item) => {
      return String(item.id || item.announcement_id) === String(id);
    });

    if (!announcement) {
      try {
        announcement = await api.get(`/announcements/${id}`);
        announcement = announcement?.data || announcement;
      } catch (error) {
        this.showMediaMessage(
          "announcements-message",
          "Unable to load announcement details."
        );
        return;
      }
    }

    const transcript =
      announcement.description ||
      "No additional information is available.";

    const container = document.getElementById("page-content");

    if (!container) return;

    container.innerHTML = `
      <section class="media-detail-page">
        <button
          id="back-to-announcements"
          class="btn btn-outline"
        >
          ← Back to Announcements
        </button>

        <div class="media-detail-content">
          <p class="eyebrow">ANNOUNCEMENT</p>

          <h1>${this.escapeHTML(announcement.title || "Announcement")}</h1>

          <p>
            ${this.escapeHTML(
              announcement.description || ""
            )}
          </p>

          <section class="transcript-section">
            <h2>Additional Information</h2>
            <p class="transcript-text">
              ${this.escapeHTML(transcript)}
            </p>
          </section>
        </div>
      </section>
    `;

    document
      .getElementById("back-to-announcements")
      ?.addEventListener("click", () => {
        this.renderAnnouncements();
      });
  },

  /**
   * Render the promos page.
   */
  async renderPromos() {
    this.currentType = "promos";

    const container = document.getElementById("page-content");

    if (!container) return;

    container.innerHTML = `
      <section class="page-header">
        <div>
          <p class="eyebrow">DISCOVER WHAT'S NEW</p>
          <h1>Promos</h1>
          <p class="page-description">
            Watch campaigns, local promotions, and city highlights.
          </p>
        </div>
      </section>

      <div class="form-group media-search">
        <label for="promo-search">Search promos</label>
        <input
          type="search"
          id="promo-search"
          placeholder="Search videos..."
        />
      </div>

      <div id="promos-message" class="form-message hidden"></div>

      <section id="promos-grid" class="media-grid">
        <p>Loading promos...</p>
      </section>
    `;

    try {
      await this.loadPromos();
      this.renderPromoCards();

      document
        .getElementById("promo-search")
        ?.addEventListener("input", (event) => {
          this.renderPromoCards(event.target.value);
        });
    } catch (error) {
      this.showMediaMessage(
        "promos-message",
        error.message || "Unable to load promos."
      );
    }
  },

  /**
   * Render promotional video cards.
   */
  renderPromoCards(search = "") {
    const container = document.getElementById("promos-grid");

    if (!container) return;

    const query = search.toLowerCase();

    const filtered = this.promos.filter((promo) => {
      const title = (promo.title || "").toLowerCase();
      const description = (promo.description || "").toLowerCase();

      return title.includes(query) || description.includes(query);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h2>No promos found</h2>
          <p>Try another search.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = filtered
      .map((promo) => {
        const id = promo.id || promo.promo_id;
        const title = promo.title || "Untitled promo";
        const video = this.getMediaUrl(
          promo.video_url || promo.video_path || promo.video
        );

        const videoExtension = video
          ? video.split("?")[0].split(".").pop().toLowerCase()
          : "";

        const videoMimeTypes = {
          mp4: "video/mp4",
          mov: "video/quicktime",
          avi: "video/x-msvideo",
          mkv: "video/x-matroska"
        };

        const videoType = videoMimeTypes[videoExtension] || "video/mp4";

        return `
          <article class="media-card">
            <div class="media-card-content">
              <span class="badge">Promo</span>

              <h2>${this.escapeHTML(title)}</h2>

              <p>
                ${this.escapeHTML(
                  promo.description || "No description available."
                )}
              </p>

              ${
                video
                  ? `
                    <video
                      controls
                      preload="metadata"
                      class="promo-video"
                    >
                      <source
                        src="${this.escapeHTML(video)}"
                        type="${videoType}"
                      />

                      ${
                        promo.captions_url
                          ? `
                            <track
                              kind="captions"
                              src="${this.escapeHTML(
                                this.getMediaUrl(promo.captions_url)
                              )}"
                              srclang="en"
                              label="English"
                              default
                            />
                          `
                          : ""
                      }

                      Your browser does not support video playback.
                    </video>
                  `
                  : `
                    <p class="media-unavailable">
                      Video is not available for this promo.
                    </p>
                  `
              }

              ${
                promo.caption_text
                  ? `
                    <details class="caption-details">
                      <summary>View captions / transcript</summary>
                      <p>
                        ${this.escapeHTML(promo.caption_text)}
                      </p>
                    </details>
                  `
                  : ""
              }
            </div>
          </article>
        `;
      })
      .join("");
  },

  /**
   * Display an error or status message.
   */
  showMediaMessage(elementId, message, type = "error") {
    const box = document.getElementById(elementId);

    if (!box) {
      console.error(message);
      return;
    }

    box.textContent = message;
    box.className = `form-message ${type}`;
  }
};

/**
 * Connect media pages to the router.
 */
window.addEventListener("route:change", (event) => {
  const path = event.detail?.path;

  if (path === "/announcements") {
    Media.renderAnnouncements();
  }

  if (path === "/promos") {
    Media.renderPromos();
  }
});

export default Media;
