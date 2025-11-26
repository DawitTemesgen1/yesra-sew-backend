// controllers/verificationController.js
const db = require('../config/db');
const logger = require('../services/logger');

/**
 * Request company verification
 * POST /api/verification/request
 */
exports.requestVerification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { documents } = req.body; // Array of document URLs

        // Check if user is a company
        const [users] = await db.query(
            'SELECT account_type, verification_status FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        if (user.account_type !== 'company') {
            return res.status(400).json({
                error: 'Only company accounts can request verification'
            });
        }

        if (user.verification_status === 'pending') {
            return res.status(400).json({
                error: 'Verification request already pending'
            });
        }

        if (user.verification_status === 'approved') {
            return res.status(400).json({
                error: 'Account is already verified'
            });
        }

        // Update user with verification request
        await db.query(
            `UPDATE users 
       SET verification_status = 'pending',
           verification_documents = ?,
           verification_requested_at = NOW(),
           verification_rejection_reason = NULL
       WHERE id = ?`,
            [JSON.stringify(documents), userId]
        );

        logger.info(`Verification requested for user ${userId}`);

        res.json({
            message: 'Verification request submitted successfully',
            status: 'pending'
        });
    } catch (error) {
        logger.error('Error requesting verification:', error);
        res.status(500).json({ error: 'Failed to submit verification request' });
    }
};

/**
 * Get verification status for current user
 * GET /api/verification/status
 */
exports.getVerificationStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await db.query(
            `SELECT account_type, is_verified, verification_status, 
              verification_requested_at, verified_at, verification_rejection_reason
       FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        res.json({
            accountType: user.account_type,
            isVerified: user.is_verified,
            verificationStatus: user.verification_status,
            requestedAt: user.verification_requested_at,
            verifiedAt: user.verified_at,
            rejectionReason: user.verification_rejection_reason
        });
    } catch (error) {
        logger.error('Error getting verification status:', error);
        res.status(500).json({ error: 'Failed to get verification status' });
    }
};

/**
 * List all pending verification requests (Admin only)
 * GET /api/admin/verifications/pending
 */
exports.listPendingVerifications = async (req, res) => {
    try {
        const [verifications] = await db.query(
            `SELECT id, full_name, email, company_name, company_role, 
              verification_documents, verification_requested_at
       FROM users 
       WHERE verification_status = 'pending' 
       ORDER BY verification_requested_at ASC`
        );

        res.json({ verifications });
    } catch (error) {
        logger.error('Error listing pending verifications:', error);
        res.status(500).json({ error: 'Failed to list pending verifications' });
    }
};

/**
 * Approve company verification (Admin only)
 * PUT /api/admin/verifications/:userId/approve
 */
exports.approveVerification = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists and is pending verification
        const [users] = await db.query(
            'SELECT account_type, verification_status FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        if (user.account_type !== 'company') {
            return res.status(400).json({
                error: 'User is not a company account'
            });
        }

        if (user.verification_status !== 'pending') {
            return res.status(400).json({
                error: 'No pending verification request for this user'
            });
        }

        // Approve verification
        await db.query(
            `UPDATE users 
       SET is_verified = TRUE,
           verification_status = 'approved',
           verified_at = NOW(),
           verification_rejection_reason = NULL
       WHERE id = ?`,
            [userId]
        );

        logger.info(`Verification approved for user ${userId} by admin ${req.user.id}`);

        res.json({
            message: 'Company verification approved successfully',
            userId: parseInt(userId)
        });
    } catch (error) {
        logger.error('Error approving verification:', error);
        res.status(500).json({ error: 'Failed to approve verification' });
    }
};

/**
 * Reject company verification (Admin only)
 * PUT /api/admin/verifications/:userId/reject
 */
exports.rejectVerification = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                error: 'Rejection reason is required'
            });
        }

        // Check if user exists and is pending verification
        const [users] = await db.query(
            'SELECT account_type, verification_status FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        if (user.account_type !== 'company') {
            return res.status(400).json({
                error: 'User is not a company account'
            });
        }

        if (user.verification_status !== 'pending') {
            return res.status(400).json({
                error: 'No pending verification request for this user'
            });
        }

        // Reject verification
        await db.query(
            `UPDATE users 
       SET is_verified = FALSE,
           verification_status = 'rejected',
           verification_rejection_reason = ?,
           verified_at = NULL
       WHERE id = ?`,
            [reason, userId]
        );

        logger.info(`Verification rejected for user ${userId} by admin ${req.user.id}`);

        res.json({
            message: 'Company verification rejected',
            userId: parseInt(userId),
            reason
        });
    } catch (error) {
        logger.error('Error rejecting verification:', error);
        res.status(500).json({ error: 'Failed to reject verification' });
    }
};
