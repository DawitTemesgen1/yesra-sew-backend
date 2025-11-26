const express = require('express');
const {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  applyForListing
} = require('../controllers/listingController');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getAllListings);
router.get('/:id', getListingById);

// Protected routes
router.post('/', auth, upload.array('images', 10), createListing);
router.put('/:id', auth, upload.array('images', 10), updateListing);
router.delete('/:id', auth, deleteListing);
router.post('/:id/apply', auth, applyForListing);

module.exports = router;