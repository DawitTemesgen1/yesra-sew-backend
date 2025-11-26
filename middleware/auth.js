const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Middleware to authenticate any logged-in user
const auth = async (req, res, next) => {
  // Check if the Authorization header exists and is correctly formatted
  if (req.header('Authorization') && req.header('Authorization').startsWith('Bearer ')) {
    try {
      // 1. Extract token from the header (e.g., "Bearer eyJ...")
      const token = req.header('Authorization').replace('Bearer ', '');

      // 2. Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user from the token's payload in the database
      const [users] = await pool.execute(
        'SELECT id, full_name, email, role, is_banned FROM users WHERE id = ?',
        [decoded.userId]
      );

      // 4. Handle cases where the user doesn't exist or is banned
      if (users.length === 0) {
        return res.status(401).json({ message: 'Authorization denied: User not found.' });
      }
      if (users[0].is_banned) {
        return res.status(403).json({ message: 'Authorization denied: This account has been suspended.' });
      }

      // 5. Success! Attach user info to the request and proceed
      req.user = users[0];
      next();

    } catch (error) {
      // Handle errors like expired or malformed tokens
      console.error('Auth Error:', error.message);
      res.status(401).json({ message: 'Authorization denied: Token is not valid.' });
    }
  } else {
    // This block runs if no 'Authorization' header is found.
    // This is what will fix your timeout issue.
    res.status(401).json({ message: 'Authorization denied: No token provided.' });
  }
};

// Middleware to authenticate AND authorize an admin user
const adminAuth = (req, res, next) => {
  // First, run the standard 'auth' middleware to check for a valid token
  auth(req, res, () => {
    // This part only runs if the 'auth' middleware was successful and called next()

    // Now, check if the authenticated user has the 'admin' role
    if (req.user && req.user.role === 'admin') {
      // If user is an admin, proceed to the admin-specific route
      next();
    } else {
      // If user is not an admin, send a Forbidden error
      res.status(403).json({ message: 'Access denied: Admin rights required.' });
    }
  });
};

// Export both functions so they can be imported correctly
module.exports = {
  auth,
  adminAuth,
};