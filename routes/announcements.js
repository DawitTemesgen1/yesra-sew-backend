const express = require('express');
const {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { adminAuth } = require('../middleware/auth'); // Assuming adminAuth is needed for CRUD ops

const router = express.Router();

// Public route to get all announcements
router.get('/', getAllAnnouncements);

// Admin-only routes for announcements management
router.post('/', adminAuth, createAnnouncement);
router.put('/:id', adminAuth, updateAnnouncement);
router.delete('/:id', adminAuth, deleteAnnouncement);

module.exports = router;
