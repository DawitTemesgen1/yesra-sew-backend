const express = require('express');
const {
  updateSubscription,
  getFavorites,
  toggleFavorite,
  getMyListings,
  getMyApplications,
  updateProfile
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.put('/subscription', updateSubscription);
router.get('/favorites', getFavorites);
router.post('/favorites/:listingId', toggleFavorite);
router.delete('/favorites/:listingId', toggleFavorite);
router.get('/listings', getMyListings);
router.get('/applications', getMyApplications);
router.put('/profile', updateProfile);

module.exports = router;