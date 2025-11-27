const express = require('express');
const {
  getAllEmailTemplates,
  getEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} = require('../controllers/emailTemplateController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.use(adminAuth); // All routes below this line require admin authentication

router.get('/', getAllEmailTemplates);
router.get('/:id', getEmailTemplateById);
router.post('/', createEmailTemplate);
router.put('/:id', updateEmailTemplate);
router.delete('/:id', deleteEmailTemplate);

module.exports = router;
