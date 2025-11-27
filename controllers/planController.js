const pool = require('../config/database');

/**
 * @desc    Get all available subscription plans
 * @route   GET /api/plans
 * @access  Public
 */
const getPlans = async (req, res) => {
  try {
    const [plans] = await pool.execute(
      'SELECT id, name, description, price, listing_limit, can_feature_posts FROM plans ORDER BY price ASC'
    );
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Server Error while fetching plans' });
  }
};

/**
 * @desc    Create a new subscription plan
 * @route   POST /api/plans
 * @access  Admin
 */
const createPlan = async (req, res) => {
  try {
    const { name, description, price, listing_limit, can_feature_posts } = req.body;

    if (!name || !description || price == null || listing_limit == null || can_feature_posts == null) {
      return res.status(400).json({ message: 'All plan fields are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO plans (name, description, price, listing_limit, can_feature_posts) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, listing_limit, can_feature_posts]
    );

    res.status(201).json({ id: result.insertId, name, description, price, listing_limit, can_feature_posts });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ message: 'Server Error while creating plan' });
  }
};

/**
 * @desc    Update an existing subscription plan
 * @route   PUT /api/plans/:id
 * @access  Admin
 */
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, listing_limit, can_feature_posts } = req.body;

    if (!name || !description || price == null || listing_limit == null || can_feature_posts == null) {
      return res.status(400).json({ message: 'All plan fields are required' });
    }

    const [result] = await pool.execute(
      'UPDATE plans SET name = ?, description = ?, price = ?, listing_limit = ?, can_feature_posts = ? WHERE id = ?',
      [name, description, price, listing_limit, can_feature_posts, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({ id, name, description, price, listing_limit, can_feature_posts });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ message: 'Server Error while updating plan' });
  }
};

/**
 * @desc    Delete a subscription plan
 * @route   DELETE /api/plans/:id
 * @access  Admin
 */
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM plans WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.status(204).send(); // No content for successful deletion
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ message: 'Server Error while deleting plan' });
  }
};

module.exports = {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
};