const pool = require('../config/database');

const getAllEmailTemplates = async (req, res) => {
  try {
    const [templates] = await pool.execute(
      'SELECT id, name, subject, body, created_at, updated_at FROM email_templates ORDER BY name ASC'
    );
    res.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getEmailTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const [templates] = await pool.execute(
      'SELECT id, name, subject, body, created_at, updated_at FROM email_templates WHERE id = ?',
      [id]
    );

    if (templates.length === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    res.json(templates[0]);
  } catch (error) {
    console.error('Error fetching email template by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createEmailTemplate = async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    if (!name || !subject || !body) {
      return res.status(400).json({ message: 'Name, subject, and body are required' });
    }
    const [result] = await pool.execute(
      'INSERT INTO email_templates (name, subject, body, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [name, subject, body]
    );
    res.status(201).json({ id: result.insertId, name, subject, body });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ message: 'Name, subject, and body are required' });
    }

    const [result] = await pool.execute(
      'UPDATE email_templates SET name = ?, subject = ?, body = ?, updated_at = NOW() WHERE id = ?',
      [name, subject, body, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    res.json({ id, name, subject, body });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM email_templates WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllEmailTemplates,
  getEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
};
