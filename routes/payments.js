const express = require('express');
const {
    initializePayment,
    handleWebhook,
    verifyPayment,
    getPaymentStatus,
    getPaymentHistory
} = require('../controllers/paymentController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// The webhook endpoint from Chapa does not require user authentication
router.post('/webhook', handleWebhook);

// All other payment routes require a logged-in user
router.use(auth);

router.post('/initialize', initializePayment);
router.post('/verify/:txRef', verifyPayment);
router.get('/status/:txRef', getPaymentStatus);

// Admin-only payment routes
router.use(adminAuth);
router.get('/history', getPaymentHistory);

module.exports = router;