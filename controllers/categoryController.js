const pool = require('../config/database');

const getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM categories ORDER BY name'
    );
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE slug = ?',
      [slug]
    );

    if (categories.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(categories[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllCategories,
  getCategoryBySlug
};