const express = require('express');
const router = express.Router();

const {
    register,
    login,
    getMe,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;