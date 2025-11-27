const express = require('express');
const { getPlans, createPlan, updatePlan, deletePlan } = require('../controllers/planController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Public route to get all subscription plans (can be accessed by anyone)
router.get('/', getPlans);

// Admin-only routes for plan management
router.use(adminAuth); // Apply adminAuth middleware to all routes below this line

router.post('/', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;