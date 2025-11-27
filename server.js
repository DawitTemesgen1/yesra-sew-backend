const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { securityHeaders, authLimiter, apiLimiter, sqlInjectionProtection } = require('./middleware/security');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const listingRoutes = require('./routes/listings');
const categoryRoutes = require('./routes/categories');
const chatRoutes = require('./routes/chat');
const verificationRoutes = require('./routes/verification');
const companyRoutes = require('./routes/companies');
const adminRoutes = require('./routes/admin');
const planRoutes = require('./routes/plans');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const locationRoutes = require('./routes/locations');
const announcementRoutes = require('./routes/announcements');
const emailTemplateRoutes = require('./routes/emailTemplates');
const systemConfigRoutes = require('./routes/systemConfig');

const app = express();

// Security Middleware
app.use(securityHeaders);
app.use(sqlInjectionProtection);

// CORS Configuration
app.use(cors());

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting
app.use('/api/auth', authLimiter);
app.use('/api/', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/admin', adminRoutes); // <--- This now handles /api/admin/system-config
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/system-config', systemConfigRoutes); // Generic public config if needed

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});