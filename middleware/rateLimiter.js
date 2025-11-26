const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for OTP requests
 * Limits to 3 requests per 15 minutes per IP
 */
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 requests per windowMs
    message: 'Too many OTP requests from this IP. Please try again after 15 minutes.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Use identifier (email/phone) as key instead of just IP
    keyGenerator: (req) => {
        return req.body.phone_number || req.body.identifier || req.body.email || req.ip;
    },
});

/**
 * General API rate limiter
 * Limits to 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits to 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    otpLimiter,
    apiLimiter,
    authLimiter,
};
