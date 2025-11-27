const express = require('express');
const {
  getAllCategories,
  getCategoryBySlug,
  createCategory, // Added for category creation
  updateCategory, // Added for category update
  deleteCategory, // Added for category deletion
  getCategoryFields, // Added for getting category fields
  updateCategoryFields, // Added for updating category fields
} = require('../controllers/categoryController');
const { adminAuth } = require('../middleware/auth'); // Assuming adminAuth is needed for CRUD ops

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

// Admin-only routes for categories
router.post('/', adminAuth, createCategory);
router.put('/:id', adminAuth, updateCategory);
router.delete('/:id', adminAuth, deleteCategory);

// New routes for category fields management
router.get('/:id/fields', adminAuth, getCategoryFields);
router.put('/:id/fields', adminAuth, updateCategoryFields);

module.exports = router;