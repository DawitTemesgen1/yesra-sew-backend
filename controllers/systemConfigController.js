const pool = require('../config/database');
// For environment variables related to API keys
require('dotenv').config();

const getSystemConfig = async (req, res) => {
  try {
    // For now, return hardcoded values. In a real app, these would come from a DB or config service.
    // API key statuses are inferred from environment variables.
    const config = {
      apiStatus: {
        chapaConfigured: process.env.CHAPA_API_KEY ? true : false,
        smsConfigured: process.env.GEEZSMS_API_KEY ? true : false,
        emailConfigured: process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS ? true : false,
      },
      featureFlags: {
        forceModeration: false, // Default value
        enableSmsNotifications: false, // Default value
      },
    };
    // In a real application, you might fetch these from a 'settings' or 'configurations' table
    // For example: const [dbConfig] = await pool.execute('SELECT * FROM system_settings WHERE id = 1');
    // And then merge with API key statuses

    res.json(config);
  } catch (error) {
    console.error('Error fetching system config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSystemConfig = async (req, res) => {
  try {
    const { featureFlags } = req.body;

    // This is a placeholder for updating. In a real application, you would update a database.
    // For example: await pool.execute('UPDATE system_settings SET force_moderation = ?, enable_sms_notifications = ? WHERE id = 1', [featureFlags.forceModeration, featureFlags.enableSmsNotifications]);

    // For demonstration, we'll just acknowledge the update
    res.json({ message: 'System configuration updated successfully', featureFlags });
  } catch (error) {
    console.error('Error updating system config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSystemConfig,
  updateSystemConfig,
};
