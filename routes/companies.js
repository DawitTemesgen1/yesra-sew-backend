const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get all verified companies
router.get('/verified', async (req, res) => {
    try {
        const [companies] = await db.query(`
      SELECT 
        id, full_name, company_name, company_role, 
        logo_url, website, email
      FROM users 
      WHERE account_type = 'company' 
        AND is_verified = TRUE
      ORDER BY company_name
    `);

        res.json({ companies });
    } catch (error) {
        console.error('Error fetching verified companies:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
