const express = require('express');
const {
  getAllCategories,
  getCategoryBySlug
} = require('../controllers/categoryController');

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

module.exports = router;