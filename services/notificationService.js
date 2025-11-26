const pool = require('../config/database');

/**
 * Creates a notification for a user. This is a reusable utility function.
 * @param {number} userId - The ID of the user to notify.
 * @param {string} title - The title of the notification.
 * @param {string} message - The message body of the notification.
 * @param {string} [type='info'] - The type of notification (e.g., 'info', 'success', 'warning').
 * @param {number|null} [relatedId=null] - An ID related to the notification (e.g., a listing ID).
 */
const createNotification = async (userId, title, message, type = 'info', relatedId = null) => {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)',
      [userId, title, message, type, relatedId]
    );
    console.log(`Notification created for user ${userId}: ${title}`);
  } catch (error) {
    // We log the error but don't throw it, so a failed notification
    // doesn't crash the main operation (e.g., creating a listing).
    console.error('Error creating notification:', error);
  }
};

module.exports = {
  createNotification,
};