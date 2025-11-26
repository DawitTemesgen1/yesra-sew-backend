const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20, // Increased for production
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Connection test
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('✅ Database connected successfully');
  connection.release();
});

// Error handling
pool.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Database connection was closed.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.log('Database has too many connections.');
  }
  if (err.code === 'ECONNREFUSED') {
    console.log('Database connection was refused.');
  }
});

const promisePool = pool.promise();

module.exports = promisePool;