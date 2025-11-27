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

const createCategory = async (req, res) => {
  try {
    const { name, slug, icon } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: 'Category name and slug are required' });
    }
    const [result] = await pool.execute(
      'INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?)',
      [name, slug, icon || null]
    );
    res.status(201).json({ id: result.insertId, name, slug, icon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, icon } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: 'Category name and slug are required' });
    }
    const [result] = await pool.execute(
      'UPDATE categories SET name = ?, slug = ?, icon = ? WHERE id = ?',
      [name, slug, icon || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ id, name, slug, icon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(204).send(); // No content for successful deletion
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCategoryFields = async (req, res) => {
  try {
    const { id } = req.params;

    const [categories] = await pool.execute(
      'SELECT custom_fields FROM categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const customFields = categories[0].custom_fields
      ? JSON.parse(categories[0].custom_fields)
      : [];

    res.json(customFields);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCategoryFields = async (req, res) => {
  try {
    const { id } = req.params;
    const { fields } = req.body; // Expects an array of field objects

    if (!Array.isArray(fields)) {
      return res.status(400).json({ message: 'Fields must be an array' });
    }

    await pool.execute(
      'UPDATE categories SET custom_fields = ? WHERE id = ?',
      [JSON.stringify(fields), id]
    );

    res.json({ message: 'Category fields updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryFields,
  updateCategoryFields,
};