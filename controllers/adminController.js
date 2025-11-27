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
    const { role } = req.query;

    let baseQuery = `SELECT id, full_name, email, role, subscription_plan, is_banned, created_at FROM users`;
    const params = [];

    if (role) {
      // Support multiple roles separated by comma e.g. role=Company,Admin
      const roles = role.split(',').map(r => r.trim().toLowerCase());
      const placeholders = roles.map(() => '?').join(',');
      baseQuery += ` WHERE LOWER(role) IN (${placeholders})`;
      params.push(...roles);
    }

    baseQuery += ` ORDER BY created_at DESC`;
    const [users] = await pool.execute(baseQuery, params);

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

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserListings = async (req, res) => {
  try {
    const { id } = req.params;
    const [listings] = await pool.execute(
      'SELECT * FROM listings WHERE author_id = ? ORDER BY created_at DESC',
      [id]
    );
    res.json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ----------------------- User Status & Promotion ----------------------
const toggleTrustedPosterStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { canPostWithoutApproval } = req.body;

    await pool.execute(
      'UPDATE users SET can_post_without_approval = ? WHERE id = ?',
      [!!canPostWithoutApproval, id]
    );
    res.json({ message: 'Trusted poster status updated', canPostWithoutApproval });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'deleted'].includes(status.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'User status updated', status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const promoteUserToAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // expected "SuperAdmin" | "Moderator"

    if (!['SuperAdmin', 'Moderator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: `User promoted to ${role}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const grantFreePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { planId } = req.body;

    // For now, simply update subscription_plan in users table
    await pool.execute('UPDATE users SET subscription_plan = ? WHERE id = ?', [planId, id]);
    res.json({ message: 'Plan granted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// -------------------------- Admin Users ----------------------------
const createAdminUser = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;
    await pool.execute(
      'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
      [full_name, email, password, role]
    );
    res.status(201).json({ message: 'Admin user created' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role } = req.body;
    await pool.execute(
      'UPDATE users SET full_name = ?, email = ?, role = ? WHERE id = ?',
      [full_name, email, role, id]
    );
    res.json({ message: 'Admin user updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Admin user deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAuditLog = async (req, res) => {
  try {
    const [logs] = await pool.execute(
      'SELECT * FROM admin_activity_log ORDER BY timestamp DESC LIMIT 100'
    );
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// -------------------------- Listing Detail -------------------------
const getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const [listings] = await pool.execute('SELECT * FROM listings WHERE id = ?', [id]);
    if (listings.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(listings[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAuditLog
};