// middleware/roleMiddleware.js
// Middleware for role-based authorization
const { adminAuth } = require('./auth');

// Export 'adminOnly' as an alias for 'adminAuth'
module.exports = {
    adminOnly: adminAuth
};
