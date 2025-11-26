// services/logger.js
// Simple logger service for consistent logging across the application

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
    info: (message, ...args) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    },

    error: (message, ...args) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
    },

    warn: (message, ...args) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    },

    debug: (message, ...args) => {
        if (isDevelopment) {
            console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
        }
    }
};

module.exports = logger;
