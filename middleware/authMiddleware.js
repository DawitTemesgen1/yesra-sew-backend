// middleware/authMiddleware.js
// Re-export auth middleware with expected function names
const { auth } = require('./auth');

// Export 'protect' as an alias for 'auth'
module.exports = {
    protect: auth
};
