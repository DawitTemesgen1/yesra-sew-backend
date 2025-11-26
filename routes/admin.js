const express = require('express');
const {
  getDashboardStats,
  getAllUsers,
  toggleUserBan,
  getAllListings,
  updateListingStatus,
  deleteListing
} = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.use(adminAuth);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleUserBan);
router.get('/listings', getAllListings);
router.put('/listings/:id/status', updateListingStatus);
router.delete('/listings/:id', deleteListing);

module.exports = router;