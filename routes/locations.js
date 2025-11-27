const express = require('express');
const {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../controllers/locationController');
const { adminAuth } = require('../middleware/auth'); // Assuming adminAuth is needed for CRUD ops

const router = express.Router();

// Public route to get all locations
router.get('/', getAllLocations);

// Admin-only routes for locations management
router.post('/', adminAuth, createLocation);
router.put('/:id', adminAuth, updateLocation);
router.delete('/:id', adminAuth, deleteLocation);

module.exports = router;
