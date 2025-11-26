const express = require('express');
const { getPlans, updatePlan } = require('../controllers/planController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Apply the admin authentication middleware to all routes in this file.
// This ensures only users with the 'admin' role can access these endpoints.
router.use(adminAuth);

// Route to get all subscription plans
router.get('/', getPlans);

// Route to update a specific plan (currently a placeholder)
router.put('/:planName', updatePlan);

module.exports = router;