const pool = require('../config/database');
const { createNotification } = require('../services/notificationService');

const getAllListings = async (req, res) => {
  try {
    const {
      category,
      type,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let query = `
      SELECT l.*, 
      u.full_name as author_name, 
      u.phone_number as author_phone,
      u.email as author_email,
      c.name as category_name,
      c.icon as category_icon,
      EXISTS(SELECT 1 FROM favorites f WHERE f.listing_id = l.id AND f.user_id = ?) as is_favorited
      FROM listings l 
      JOIN users u ON l.author_id = u.id 
      JOIN categories c ON l.category_id = c.id 
      WHERE l.status = 'approved'
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM listings l 
      JOIN categories c ON l.category_id = c.id 
      WHERE l.status = 'approved'
    `;

    const params = [req.user?.id || 0];
    const countParams = [];

    if (category) {
      query += ' AND c.id = ?';
      countQuery += ' AND c.id = ?';
      params.push(category);
      countParams.push(category);
    }

    if (type) {
      query += ' AND l.type = ?';
      countQuery += ' AND l.type = ?';
      params.push(type);
      countParams.push(type);
    }

    if (search) {
      query += ' AND (l.title LIKE ? OR l.description LIKE ? OR l.location LIKE ?)';
      countQuery += ' AND (l.title LIKE ? OR l.description LIKE ? OR l.location LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const validSortColumns = ['created_at', 'price', 'title'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY l.${sortColumn} ${order} LIMIT ? OFFSET ?`;
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), offset);

    const [listings] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const [listings] = await pool.execute(`
        SELECT l.*, 
        u.full_name as author_name, 
        u.phone_number as author_phone,
        u.email as author_email,
        c.name as category_name,
        c.icon as category_icon,
        EXISTS(SELECT 1 FROM favorites f WHERE f.listing_id = l.id AND f.user_id = ?) as is_favorited
        FROM listings l 
        JOIN users u ON l.author_id = u.id 
        JOIN categories c ON l.category_id = c.id 
        WHERE l.id = ?
      `, [req.user?.id || 0, id]);

    if (listings.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(listings[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createListing = async (req, res) => {
  try {
    const author_id = req.user.id;
    const { ...listingData } = req.body;

    const fields = {
      author_id,
      category_id: listingData.category_id,
      title: listingData.title,
      description: listingData.description,
      price: parseFloat(listingData.price) || 0,
      location: listingData.specific_location,
      city: listingData.city,
      subcity: listingData.subcity,
      specific_location: listingData.specific_location,
      type: listingData.type,
      bedrooms: listingData.bedrooms ? parseInt(listingData.bedrooms) : null,
      bathrooms: listingData.bathrooms ? parseInt(listingData.bathrooms) : null,
      area_sqft: listingData.area_sqft ? parseInt(listingData.area_sqft) : null,
      property_type: listingData.property_type,
      furnishing: listingData.furnishing,
      make: listingData.make,
      model: listingData.model,
      year: listingData.year ? parseInt(listingData.year) : null,
      transmission: listingData.transmission,
      fuel_type: listingData.fuel_type,
      mileage: listingData.mileage ? parseInt(listingData.mileage) : null,
      condition: listingData.condition,
      experience_level: listingData.experience_level,
      education_level: listingData.education_level,
      deadline: listingData.deadline || null,
      job_location_type: listingData.job_location_type,
      responsibilities: listingData.responsibilities,
      requirements: listingData.requirements,
      salary_type: listingData.salary_type,
      tender_type: listingData.tender_type,
      tender_category: listingData.tender_category,
      specific_home_type: listingData.specific_home_type,
      payment_method: listingData.payment_method,
      bank_payment_style: listingData.bank_payment_style,
      car_status: listingData.car_status,
    };

    if (req.files && req.files.length > 0) {
      fields.images = JSON.stringify(req.files.map(file => `/${file.path.replace(/\\/g, '/')}`));
    }

    const columns = Object.keys(fields).filter(key => fields[key] !== undefined).join(', ');
    const placeholders = Object.keys(fields).filter(key => fields[key] !== undefined).map(() => '?').join(', ');
    const values = Object.values(fields).filter(val => val !== undefined);

    const [result] = await pool.execute(
      `INSERT INTO listings (${columns}) VALUES (${placeholders})`,
      values
    );

    const [newListing] = await pool.execute('SELECT * FROM listings WHERE id = ?', [result.insertId]);

    // Notify admin (assuming admin user has ID 1)
    await createNotification(1, 'New Listing Pending', `A new listing "${fields.title}" requires approval.`, 'info', result.insertId);

    res.status(201).json(newListing[0]);
  } catch (error) {
    console.error('Create Listing Error:', error);
    res.status(500).json({ message: 'Server error during listing creation.' });
  }
};

const updateListing = async (req, res) => {
  res.status(501).json({ message: "Update not implemented yet." });
};

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM listings WHERE id = ? AND author_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Listing not found or access denied' });
    }

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const applyForListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const [listings] = await pool.execute(
      'SELECT author_id FROM listings WHERE id = ? AND status = "approved"',
      [id]
    );

    if (listings.length === 0) {
      return res.status(404).json({ message: 'Listing not found or not available' });
    }

    await pool.execute(
      'INSERT INTO applications (user_id, listing_id, message) VALUES (?, ?, ?)',
      [req.user.id, id, message || '']
    );

    // Notify the listing author
    await createNotification(listings[0].author_id, 'New Application', `You have a new application for your listing.`, 'success', id);

    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getListingComments = async (req, res) => {
  try {
    const { id } = req.params;

    const [comments] = await pool.execute(`
      SELECT lc.id, lc.listing_id, lc.user_id, lc.comment, lc.created_at, lc.updated_at,
        u.full_name as author_name, u.avatar_url as author_avatar
      FROM listing_comments lc
      JOIN users u ON lc.user_id = u.id
      WHERE lc.listing_id = ?
      ORDER BY lc.created_at DESC
    `, [id]);

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addListingComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const trimmedComment = comment.trim();

    const [listingRows] = await pool.execute(
      'SELECT id FROM listings WHERE id = ? AND status = "approved"',
      [id]
    );

    if (listingRows.length === 0) {
      return res.status(404).json({ message: 'Listing not found or not available' });
    }

    const [result] = await pool.execute(
      'INSERT INTO listing_comments (listing_id, user_id, comment) VALUES (?, ?, ?)',
      [id, req.user.id, trimmedComment]
    );

    const [newCommentRows] = await pool.execute(`
      SELECT lc.id, lc.listing_id, lc.user_id, lc.comment, lc.created_at, lc.updated_at,
        u.full_name as author_name, u.avatar_url as author_avatar
      FROM listing_comments lc
      JOIN users u ON lc.user_id = u.id
      WHERE lc.id = ?
    `, [result.insertId]);

    res.status(201).json(newCommentRows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  applyForListing,
  getListingComments,
  addListingComment
};