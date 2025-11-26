const pool = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [listingCount] = await pool.execute('SELECT COUNT(*) as count FROM listings');
    const [pendingCount] = await pool.execute('SELECT COUNT(*) as count FROM listings WHERE status = "pending"');
    const [revenueResult] = await pool.execute(`
      SELECT COUNT(*) as premium_users FROM users WHERE subscription_plan = 'Premium'
    `);

    const stats = {
      totalUsers: userCount[0].count,
      totalListings: listingCount[0].count,
      pendingApprovals: pendingCount[0].count,
      premiumUsers: revenueResult[0].premium_users
    };

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT id, full_name, email, role, subscription_plan, is_banned, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      'SELECT is_banned FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newStatus = !users[0].is_banned;

    await pool.execute(
      'UPDATE users SET is_banned = ? WHERE id = ?',
      [newStatus, id]
    );

    res.json({ 
      message: `User ${newStatus ? 'banned' : 'unbanned'} successfully`,
      is_banned: newStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllListings = async (req, res) => {
  try {
    const [listings] = await pool.execute(`
      SELECT l.*, u.full_name as author_name, c.name as category_name 
      FROM listings l 
      JOIN users u ON l.author_id = u.id 
      JOIN categories c ON l.category_id = c.id 
      ORDER BY l.created_at DESC
    `);
    res.json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [result] = await pool.execute(
      'UPDATE listings SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ message: `Listing ${status} successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM listings WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  toggleUserBan,
  getAllListings,
  updateListingStatus,
  deleteListing
};