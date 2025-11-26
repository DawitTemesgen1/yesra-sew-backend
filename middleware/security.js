const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased for development
  message: {
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development
  message: {
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// SQL injection protection
const sqlInjectionProtection = (req, res, next) => {
  const sqlKeywords = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b)/i;

  // Check query parameters
  const checkObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string' && sqlKeywords.test(obj[key])) {
        return res.status(400).json({ message: 'Invalid input detected' });
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkObject(obj[key]);
      }
    }
  };

  checkObject(req.body);
  checkObject(req.query);
  next();
};

module.exports = {
  securityHeaders,
  authLimiter,
  apiLimiter,
  sqlInjectionProtection
};