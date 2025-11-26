const express = require('express');
const { auth } = require('../middleware/auth');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadNotificationCount
} = require('../controllers/notificationController');

const router = express.Router();

// All notification routes require a logged-in user
router.use(auth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadNotificationCount);
router.patch('/:id/read', markAsRead);
router.post('/mark-all-read', markAllAsRead);

module.exports = router;