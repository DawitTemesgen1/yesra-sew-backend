const express = require('express');
const {
  getSystemConfig,
  updateSystemConfig,
} = require('../controllers/systemConfigController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.use(adminAuth); // All routes below this line require admin authentication

router.get('/', getSystemConfig);
router.put('/', updateSystemConfig);

module.exports = router;
