
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

    const query = search.trim().toLowerCase();

    const filtered = this.announcements.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const description = (item.description || "").toLowerCase();
      return title.includes(query) || description.includes(query);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state announcement-empty">
          <div class="announcement-empty-icon" aria-hidden="true">♫</div>
          <h2>${query ? "No matching announcements" : "No announcements yet"}</h2>
          <p>${query
            ? "Try a different search term."
            : "New community updates will appear here when they are published."}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((item, index) => {
      const id = item.id || item.announcement_id;
      const title = item.title || "Untitled announcement";
      const description = item.description || "No description available.";
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
      const date = item.created_at || item.published_at || item.date || "";
      const dateLabel = date && !Number.isNaN(Date.parse(date))
        ? new Date(date).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric"
          })
        : "Community update";

      return `
        <article class="media-card announcement-card">
          <div class="announcement-card-top">
            <div class="announcement-icon" aria-hidden="true">♫</div>
            <span class="badge">Public announcement</span>
            <span class="announcement-number">${String(index + 1).padStart(2, "0")}</span>
          </div>

          <div class="media-card-content announcement-card-content">
            <p class="announcement-date">${this.escapeHTML(dateLabel)}</p>
            <h2>${this.escapeHTML(title)}</h2>
            <p class="announcement-description">
              ${this.escapeHTML(description)}
            </p>

            <div class="announcement-audio-section">
              <div class="announcement-audio-heading">
                <span class="announcement-audio-indicator"></span>
                <span>${audio ? "Listen to this announcement" : "Audio unavailable"}</span>
              </div>

              ${
                audio
                  ? `
                    <audio controls preload="none">
                      <source src="${this.escapeHTML(audio)}" type="${audioType}" />
                      Your browser does not support audio playback.
                    </audio>
                  `
                  : `
                    <p class="media-unavailable">
                      The audio recording is not available at the moment.
                    </p>
                  `
              }
            </div>

            <button
              class="btn btn-outline announcement-details-button"
              data-announcement-id="${this.escapeHTML(id)}"
              type="button"
            >
              Read announcement details →
            </button>
          </div>
        </article>
      `;
    }).join("");

    container
      .querySelectorAll(".announcement-details-button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          this.showAnnouncementDetails(button.dataset.announcementId);
        });
      });
  },

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
      <section class="page-header promo-page-header">
        <div>
          <p class="eyebrow">CITY STORIES & CAMPAIGNS</p>
          <h1>Discover what's happening.</h1>
          <p class="page-description">
            Explore campaigns, community initiatives, local promotions,
            and highlights from across the city.
          </p>
        </div>
        <div class="promo-header-art" aria-hidden="true">
          <span class="promo-play-icon">▶</span>
          <span class="promo-header-label">CIVIC<br />STORIES</span>
        </div>
      </section>

      <section class="promo-library-heading">
        <div>
          <p class="eyebrow">THE VIDEO LIBRARY</p>
          <h2>Featured promotions</h2>
          <p>Watch the latest updates from your community.</p>
        </div>
        <div class="promo-library-count" id="promo-library-count">
          Loading videos...
        </div>
      </section>

      <div class="form-group media-search promo-search">
        <label for="promo-search">Find a video</label>
        <input
          type="search"
          id="promo-search"
          placeholder="Search by title or description..."
        />
      </div>

      <div id="promos-message" class="form-message hidden"></div>

      <section id="promos-grid" class="media-grid promo-grid">
        <p class="loading-state">Loading promos...</p>
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

    const query = search.trim().toLowerCase();

    const filtered = this.promos.filter((promo) => {
      const title = (promo.title || "").toLowerCase();
      const description = (promo.description || "").toLowerCase();

      return title.includes(query) || description.includes(query);
    });

    const count = document.getElementById("promo-library-count");
    if (count) {
      count.textContent = `${filtered.length} ${
        filtered.length === 1 ? "video" : "videos"
      }`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state promo-empty">
          <div class="promo-empty-icon" aria-hidden="true">▶</div>
          <h2>${query ? "No matching videos" : "No promotions yet"}</h2>
          <p>
            ${
              query
                ? "Try another title or search term."
                : "New community campaigns and video updates will appear here."
            }
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((promo, index) => {
      const id = promo.id || promo.promo_id;
      const title = promo.title || "Untitled promo";
      const description = promo.description || "No description available.";

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

      const captionsUrl = promo.captions_url
        ? this.getMediaUrl(promo.captions_url)
        : "";

      const hasTranscript = Boolean(
        promo.caption_text && promo.caption_text.trim()
      );

      return `
        <article class="media-card promo-card">
          <div class="promo-card-top">
            <span class="promo-category">COMMUNITY VIDEO</span>
            <span class="promo-number">${String(index + 1).padStart(2, "0")}</span>
          </div>

          <div class="promo-video-wrapper">
            ${
              video
                ? `
                  <video
                    controls
                    preload="metadata"
                    class="promo-video"
                    playsinline
                  >
                    <source
                      src="${this.escapeHTML(video)}"
                      type="${videoType}"
                    />

                    ${
                      captionsUrl
                        ? `
                          <track
                            kind="captions"
                            src="${this.escapeHTML(captionsUrl)}"
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
                  <div class="promo-video-unavailable">
                    <span aria-hidden="true">▶</span>
                    <p>Video currently unavailable</p>
                  </div>
                `
            }
          </div>

          <div class="media-card-content promo-card-content">
            <h2>${this.escapeHTML(title)}</h2>

            <p class="promo-description">
              ${this.escapeHTML(description)}
            </p>

            <div class="promo-card-footer">
              ${
                captionsUrl || hasTranscript
                  ? `
                    <span class="promo-caption-status">
                      <span aria-hidden="true">CC</span>
                      Captions available
                    </span>
                  `
                  : `
                    <span class="promo-caption-status promo-no-captions">
                      Captions unavailable
                    </span>
                  `
              }
            </div>

            ${
              hasTranscript
                ? `
                  <details class="caption-details">
                    <summary>
                      <span>Read video transcript</span>
                      <span class="caption-toggle-icon" aria-hidden="true">+</span>
                    </summary>
                    <p>${this.escapeHTML(promo.caption_text)}</p>
                  </details>
                `
                : ""
            }
          </div>
        </article>
      `;
    }).join("");
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
