const pool = require('../config/database');

const updateSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;

    const validPlans = ['Free', 'Standard', 'Premium'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }

    await pool.execute(
      'UPDATE users SET subscription_plan = ? WHERE id = ?',
      [plan, userId]
    );

    res.json({ message: `Successfully upgraded to ${plan} plan!` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const [favorites] = await pool.execute(`
      SELECT l.*, c.name as category_name 
      FROM favorites f 
      JOIN listings l ON f.listing_id = l.id 
      JOIN categories c ON l.category_id = c.id 
      WHERE f.user_id = ? AND l.status = 'approved'
    `, [userId]);

    res.json(favorites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingId } = req.params;

    // Check if already favorited
    const [existing] = await pool.execute(
      'SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?',
      [userId, listingId]
    );

    if (existing.length > 0) {
      // Remove from favorites
      await pool.execute(
        'DELETE FROM favorites WHERE user_id = ? AND listing_id = ?',
        [userId, listingId]
      );
      res.json({ message: 'Removed from favorites', isFavorited: false });
    } else {
      // Add to favorites
      await pool.execute(
        'INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)',
        [userId, listingId]
      );
      res.json({ message: 'Added to favorites', isFavorited: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyListings = async (req, res) => {
  try {
    const userId = req.user.id;

    const [listings] = await pool.execute(`
      SELECT l.*, c.name as category_name 
      FROM listings l 
      JOIN categories c ON l.category_id = c.id 
      WHERE l.author_id = ?
      ORDER BY l.created_at DESC
    `, [userId]);

    res.json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    // FIX: Joined 'users' table and selected 'u.full_name' instead of non-existent 'l.company_name'
    const [applications] = await pool.execute(`
      SELECT 
        a.*, 
        l.title as listing_title, 
        u.full_name as company_name 
      FROM applications a 
      JOIN listings l ON a.listing_id = l.id
      JOIN users u ON l.author_id = u.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `, [userId]);

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      full_name,
      company_name,
      company_role,
      logo_url,
      avatar_url,
      address,
      about_me,
      website,
      social_links
    } = req.body;

    // Construct update query dynamically
    let fields = [];
    let params = [];

    if (full_name !== undefined) { fields.push('full_name = ?'); params.push(full_name); }
    if (company_name !== undefined) { fields.push('company_name = ?'); params.push(company_name); }
    if (company_role !== undefined) { fields.push('company_role = ?'); params.push(company_role); }
    if (logo_url !== undefined) { fields.push('logo_url = ?'); params.push(logo_url); }
    if (avatar_url !== undefined) { fields.push('avatar_url = ?'); params.push(avatar_url); }
    if (address !== undefined) { fields.push('address = ?'); params.push(address); }
    if (about_me !== undefined) { fields.push('about_me = ?'); params.push(about_me); }
    if (website !== undefined) { fields.push('website = ?'); params.push(website); }
    if (social_links !== undefined) {
      fields.push('social_links = ?');
      // Ensure social_links is a JSON string if it's an object
      params.push(typeof social_links === 'object' ? JSON.stringify(social_links) : social_links);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(userId);

    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    // Fetch updated user
    const [users] = await pool.execute(
      'SELECT id, full_name, email, phone_number, role, subscription_plan, is_phone_verified, company_name, company_role, logo_url, avatar_url, address, about_me, website, social_links FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: users[0]
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  updateSubscription,
  getFavorites,
  toggleFavorite,
  getMyListings,
  getMyApplications,
  updateProfile
};