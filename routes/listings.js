const express = require('express');
const {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  applyForListing,
  getListingComments,
  addListingComment
} = require('../controllers/listingController');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getAllListings);
router.get('/:id', getListingById);
router.get('/:id/comments', getListingComments);

// Protected routes
router.post('/', auth, upload.array('images', 10), createListing);
router.put('/:id', auth, upload.array('images', 10), updateListing);
router.delete('/:id', auth, deleteListing);
router.post('/:id/apply', auth, applyForListing);
router.post('/:id/comments', auth, addListingComment);

module.exports = router;