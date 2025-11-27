const express = require('express');
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  getUserListings,
  toggleUserBan,
  toggleTrustedPosterStatus,
  updateUserStatus,
  promoteUserToAdmin,
  grantFreePlan,
  getAllListings,
  getListingById,
  updateListingStatus,
  deleteListing,
  getFeaturedListings,
  toggleFeaturedStatus,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAuditLog,
  getSystemConfig,
  updateSystemConfig
} = require('../controllers/adminController');
const {
  listPendingVerifications,
  approveVerification,
  rejectVerification
} = require('../controllers/verificationController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Protect all routes with Admin Authentication
router.use(adminAuth);

// Dashboard Stats
router.get('/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById); // Get single user details
router.get('/users/:id/listings', getUserListings); // Get user's listings
router.put('/users/:id/ban', toggleUserBan);
router.put('/users/:id/trusted-poster', toggleTrustedPosterStatus);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/promote', promoteUserToAdmin); // Promote user to admin/moderator
router.post('/users/:id/grant-plan', grantFreePlan);

// Verification Routes
router.get('/verifications/pending', listPendingVerifications);
router.put('/verifications/:userId/approve', approveVerification);
router.put('/verifications/:userId/reject', rejectVerification);

// Listing Management
router.get('/listings', getAllListings);
router.get('/listings/:id', getListingById); // Get single listing details
router.put('/listings/:id/status', updateListingStatus);
router.delete('/listings/:id', deleteListing);

// Featured Listings Routes
router.get('/listings/featured', getFeaturedListings);
router.put('/listings/:id/toggle-featured', toggleFeaturedStatus);

// Admin User Management Routes
router.post('/admins', createAdminUser);
router.put('/admins/:id', updateAdminUser);
router.delete('/admins/:id', deleteAdminUser);

// Audit Log Route
router.get('/audit-log', getAuditLog);

// System Configuration Routes
router.get('/system-config', getSystemConfig);
router.put('/system-config', updateSystemConfig);

module.exports = router;