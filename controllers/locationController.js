const pool = require('../config/database');

const getAllLocations = async (req, res) => {
  try {
    const [locations] = await pool.execute(
      'SELECT id, name, region FROM locations ORDER BY name'
    );
    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createLocation = async (req, res) => {
  try {
    const { name, region } = req.body;
    if (!name || !region) {
      return res.status(400).json({ message: 'Location name and region are required' });
    }
    const [result] = await pool.execute(
      'INSERT INTO locations (name, region) VALUES (?, ?)',
      [name, region]
    );
    res.status(201).json({ id: result.insertId, name, region });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, region } = req.body;
    if (!name || !region) {
      return res.status(400).json({ message: 'Location name and region are required' });
    }
    const [result] = await pool.execute(
      'UPDATE locations SET name = ?, region = ? WHERE id = ?',
      [name, region, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json({ id, name, region });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM locations WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
};
