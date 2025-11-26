// middleware/listingPermissions.js
const db = require('../config/db');
const logger = require('../services/logger');

/**
 * Middleware to check if user has permission to post in a specific category
 * - Jobs (category_id=1): Requires company account + verified
 * - Tenders (category_id=2): Requires company account + verified
 * - Homes (category_id=3): Allowed for all
 * - Cars (category_id=4): Allowed for all
 */
const checkPostingPermission = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { category_id } = req.body;

        if (!category_id) {
            return res.status(400).json({ error: 'Category ID is required' });
        }

        // Get user's account type and verification status
        const [users] = await db.query(
            'SELECT account_type, is_verified FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        const categoryId = parseInt(category_id);

        // Check permissions based on category
        // Category 1 = Jobs, Category 2 = Tenders
        if (categoryId === 1 || categoryId === 2) {
            // Jobs and Tenders require company account
            if (user.account_type !== 'company') {
                return res.status(403).json({
                    error: 'Only company accounts can post jobs and tenders',
                    requiresCompanyAccount: true
                });
            }

            // Company must be verified
            if (!user.is_verified) {
                return res.status(403).json({
                    error: 'Your company account must be verified to post jobs and tenders',
                    requiresVerification: true
                });
            }
        }

        // Category 3 = Homes, Category 4 = Cars - allowed for all users
        // No additional checks needed

        // User has permission, proceed to next middleware
        next();
    } catch (error) {
        logger.error('Error checking posting permission:', error);
        res.status(500).json({ error: 'Failed to verify posting permissions' });
    }
};

module.exports = { checkPostingPermission };
