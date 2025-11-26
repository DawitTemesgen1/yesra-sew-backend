// routes/verification.js
const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// User routes (protected)
router.post('/request', protect, verificationController.requestVerification);
router.get('/status', protect, verificationController.getVerificationStatus);

// Admin routes (protected + admin only)
router.get('/pending', protect, adminOnly, verificationController.listPendingVerifications);
router.put('/:userId/approve', protect, adminOnly, verificationController.approveVerification);
router.put('/:userId/reject', protect, adminOnly, verificationController.rejectVerification);

module.exports = router;
