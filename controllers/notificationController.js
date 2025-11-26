const pool = require('../config/database');

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [notifications] = await pool.execute(
      `SELECT id, title, message, type, is_read, related_id, created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.status(200).json(notifications);

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error while fetching notifications.' });
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found or permission denied.' });
    }

    res.status(200).json({ message: 'Notification marked as read.' });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Mark all of the user's notifications as read
 * @route   POST /api/notifications/mark-all-read
 * @access  Private
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.status(200).json({ message: 'All notifications marked as read.' });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * @desc    Get the count of unread notifications
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadNotificationCount = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const [result] = await pool.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
  
      res.json({ unread_count: result[0].count });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadNotificationCount,
};