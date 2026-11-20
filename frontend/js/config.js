
/* =========================================================
   CIVICEVENTS
   Application Configuration
   ========================================================= */

/**
 * Central configuration for the CivicEvents frontend.
 *
 * Backend default:
 * http://localhost:4000
 *
 * Never put database passwords, JWT secrets or other
 * private credentials in this frontend file.
 */

const BACKEND_URL =
    window.CIVIC_EVENTS_CONFIG?.BACKEND_URL ||
    'http://localhost:4000';

const API_BASE_URL = `${BACKEND_URL}/api`;


/* =========================================================
   1. APPLICATION SETTINGS
   ========================================================= */

export const APP_CONFIG = {
    NAME: 'CivicEvents',

    DESCRIPTION:
        'Discover events, connect with your community and stay informed.',

    VERSION: '1.0.0',

    ENVIRONMENT: 'development',

    DEBUG: true,

    DEFAULT_PAGE_SIZE: 10,

    REQUEST_TIMEOUT: 20000
};


/* =========================================================
   2. BACKEND CONFIGURATION
   ========================================================= */

export const API_CONFIG = {
    BACKEND_URL,

    BASE_URL: API_BASE_URL,

    HEALTH_URL: `${BACKEND_URL}/health`,

    TIMEOUT: APP_CONFIG.REQUEST_TIMEOUT,

    HEADERS: {
        Accept: 'application/json'
    }
};


/* =========================================================
   3. API ENDPOINTS
   ========================================================= */

export const API_ENDPOINTS = {

    // Authentication
    AUTH: {
        SIGNUP: '/auth/signup',
        LOGIN: '/auth/login'
    },

    // Users
    USERS: {
        LIST: '/users',
        PROFILE: '/users/profile/me',
        DETAILS: (id) => `/users/${encodeURIComponent(id)}`,
        ENABLE: (id) => `/users/${encodeURIComponent(id)}/enable`,
        DISABLE: (id) => `/users/${encodeURIComponent(id)}/disable`
    },

    // Events
    EVENTS: {
        LIST: '/events',
        DETAILS: (id) => `/events/${encodeURIComponent(id)}`,
        CREATE: '/events',
        UPDATE: (id) => `/events/${encodeURIComponent(id)}`,
        DELETE: (id) => `/events/${encodeURIComponent(id)}`
    },

    // Event registrations
    REGISTRATIONS: {
        REGISTER: '/event-registrations/register',
        CANCEL: '/event-registrations/cancel',
        MY_REGISTRATIONS: '/event-registrations/my-registrations',
        ATTENDEES: (eventId) =>
            `/event-registrations/event/${encodeURIComponent(eventId)}/attendees`
    },

    // Event feedback
    FEEDBACK: {
        CREATE: '/event-feedback',
        UPDATE: (id) => `/event-feedback/${encodeURIComponent(id)}`,
        MY_FEEDBACK: '/event-feedback/my-feedback',
        EVENT_FEEDBACK: (eventId) =>
            `/event-feedback/event/${encodeURIComponent(eventId)}`
    },

    // Announcements
    ANNOUNCEMENTS: {
        LIST: '/announcements',
        DETAILS: (id) => `/announcements/${encodeURIComponent(id)}`,
        CREATE: '/announcements',
        UPDATE: (id) => `/announcements/${encodeURIComponent(id)}`,
        PUBLISH: (id) => `/announcements/${encodeURIComponent(id)}/publish`,
        UNPUBLISH: (id) => `/announcements/${encodeURIComponent(id)}/unpublish`,
        DELETE: (id) => `/announcements/${encodeURIComponent(id)}`
    },

    // Promotional videos
    PROMOS: {
        LIST: '/promos',
        DETAILS: (id) => `/promos/${encodeURIComponent(id)}`,
        CREATE: '/promos',
        UPDATE: (id) => `/promos/${encodeURIComponent(id)}`,
        PUBLISH: (id) => `/promos/${encodeURIComponent(id)}/publish`,
        UNPUBLISH: (id) => `/promos/${encodeURIComponent(id)}/unpublish`,
        DELETE: (id) => `/promos/${encodeURIComponent(id)}`
    },

    // Notifications
    NOTIFICATIONS: {
        LIST: '/notifications',
        DETAILS: (id) => `/notifications/${encodeURIComponent(id)}`,
        DELETE: (id) => `/notifications/${encodeURIComponent(id)}`
    },

    // Dashboard
    DASHBOARD: {
        ADMIN: '/dashboard/admin',
        USER: '/dashboard/me'
    }
};


/* =========================================================
   4. AUTHENTICATION STORAGE
   ========================================================= */

/**
 * Session storage is used by default.
 *
 * The token is removed when the browser session ends.
 *
 * This is not a substitute for backend security.
 * Avoid storing sensitive information in browser storage.
 */

export const STORAGE_CONFIG = {
    TYPE: 'session',

    TOKEN_KEY: 'civicevents_token',

    USER_KEY: 'civicevents_user',

    SESSION_KEY: 'civicevents_session'
};


/* =========================================================
   5. USER ROLES
   ========================================================= */

export const USER_ROLES = {
    ADMIN: 'admin',
    USER: 'user'
};


/* =========================================================
   6. APPLICATION ROUTES
   ========================================================= */

export const APP_ROUTES = {

    HOME: '#/home',

    LOGIN: '#/login',

    SIGNUP: '#/signup',

    DASHBOARD: '#/dashboard',

    EVENTS: '#/events',

    EVENT_DETAILS: '#/events/',

    ANNOUNCEMENTS: '#/announcements',

    PROMOS: '#/promos',

    NOTIFICATIONS: '#/notifications',

    PROFILE: '#/profile',

    MY_EVENTS: '#/my-events',

    ADMIN: '#/admin',

    ADMIN_EVENTS: '#/admin/events',

    ADMIN_USERS: '#/admin/users',

    ADMIN_ANNOUNCEMENTS: '#/admin/announcements',

    ADMIN_PROMOS: '#/admin/promos'
};


/* =========================================================
   7. MEDIA CONFIGURATION
   ========================================================= */

export const MEDIA_CONFIG = {

    UPLOADS_URL: `${BACKEND_URL}/uploads`,

    EVENT_IMAGES: `${BACKEND_URL}/uploads/events`,

    AUDIO: `${BACKEND_URL}/uploads/announcements`,

    VIDEOS: `${BACKEND_URL}/uploads/promos`
};


/* =========================================================
   8. PAGINATION
   ========================================================= */

export const PAGINATION_CONFIG = {
    DEFAULT_LIMIT: 10,

    MAX_LIMIT: 50,

    INITIAL_PAGE: 1
};


/* =========================================================
   9. VALIDATION RULES
   ========================================================= */

export const VALIDATION_CONFIG = {

    PASSWORD: {
        MIN_LENGTH: 8,

        REQUIRE_UPPERCASE: true,

        REQUIRE_LOWERCASE: true,

        REQUIRE_NUMBER: true,

        REQUIRE_SPECIAL_CHARACTER: true
    },

    NAME: {
        MIN_LENGTH: 2,

        MAX_LENGTH: 100
    },

    EMAIL: {
        PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },

    FEEDBACK: {
        MIN_RATING: 1,

        MAX_RATING: 5,

        MAX_COMMENT_LENGTH: 1000
    }
};


/* =========================================================
   10. HELPER FUNCTIONS
   ========================================================= */

/**
 * Builds a complete API URL.
 *
 * Example:
 * buildApiUrl('/events')
 *
 * Result:
 * http://localhost:4000/api/events
 */

export function buildApiUrl(endpoint) {
    const cleanEndpoint = String(endpoint).replace(/^\/+/, '');

    return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
}


/**
 * Builds a public media URL.
 *
 * Accepts:
 * - Full URLs
 * - Relative upload paths
 * - Filenames
 */

export function buildMediaUrl(path) {

    if (!path) {
        return '';
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const cleanPath = String(path).replace(/^\/+/, '');

    if (cleanPath.startsWith('uploads/')) {
        return `${BACKEND_URL}/${cleanPath}`;
    }

    return `${MEDIA_CONFIG.UPLOADS_URL}/${cleanPath}`;
}


/**
 * Returns the configured backend health endpoint.
 */

export function getHealthUrl() {
    return API_CONFIG.HEALTH_URL;
}


/**
 * Checks whether the frontend is running in development mode.
 */

export function isDevelopment() {
    return APP_CONFIG.ENVIRONMENT === 'development';
}


/**
 * Development logging helper.
 */

export function debugLog(...messages) {

    if (APP_CONFIG.DEBUG && isDevelopment()) {
        console.log('[CivicEvents]', ...messages);
    }

}


/* =========================================================
   11. DEFAULT EXPORT
   ========================================================= */

const CONFIG = {
    APP_CONFIG,
    API_CONFIG,
    API_ENDPOINTS,
    STORAGE_CONFIG,
    USER_ROLES,
    APP_ROUTES,
    MEDIA_CONFIG,
    PAGINATION_CONFIG,
    VALIDATION_CONFIG,
    buildApiUrl,
    buildMediaUrl,
    getHealthUrl,
    isDevelopment,
    debugLog
};

export default CONFIG;
