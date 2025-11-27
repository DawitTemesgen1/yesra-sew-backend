-- Complete Database Schema for YesraSew Classifieds App
-- Drop existing tables if needed (uncomment if you want to reset)
-- DROP TABLE IF EXISTS notifications;
-- DROP TABLE IF EXISTS chat_messages;
-- DROP TABLE IF EXISTS chat_conversations;
-- DROP TABLE IF EXISTS favorites;
-- DROP TABLE IF EXISTS applications;
-- DROP TABLE IF EXISTS payment_transactions;
-- DROP TABLE IF EXISTS listings;
-- DROP TABLE IF EXISTS email_templates;
-- DROP TABLE IF EXISTS announcements;
-- DROP TABLE IF EXISTS system_config;
-- DROP TABLE IF EXISTS otp_codes;
-- DROP TABLE IF EXISTS locations;
-- DROP TABLE IF EXISTS categories;
-- DROP TABLE IF EXISTS users;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE DEFAULT NULL,
  phone_number VARCHAR(20) UNIQUE DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('User', 'Company', 'Moderator', 'SuperAdmin') DEFAULT 'User',
  account_type ENUM('Individual', 'Company') DEFAULT 'Individual',
  company_name VARCHAR(255) DEFAULT NULL,
  company_role VARCHAR(255) DEFAULT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  subscription_plan ENUM('Free', 'Standard', 'Premium') DEFAULT 'Free',
  is_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  can_post_without_approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone_number)
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
);

-- 3. Locations Table
CREATE TABLE IF NOT EXISTS locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'ETB',
  location VARCHAR(255),
  location_id INT DEFAULT NULL,
  category_id INT,
  type ENUM('For Sale', 'For Rent', 'Full-time', 'Part-time', 'Tender') NOT NULL,
  author_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  images JSON,
  image_urls JSON,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Home/Property Fields
  bedrooms INT,
  bathrooms INT,
  area_sqft INT,
  property_type VARCHAR(100),
  furnishing VARCHAR(100),
  specific_home_type VARCHAR(100),
  
  -- Car/Vehicle Fields
  make VARCHAR(100),
  model VARCHAR(100),
  `year` INT,
  transmission VARCHAR(50),
  fuel_type VARCHAR(50),
  mileage INT,
  `condition` VARCHAR(50),
  car_status VARCHAR(50),
  
  -- Job Fields
  experience_level VARCHAR(100),
  education_level VARCHAR(100),
  deadline DATE,
  salary_type VARCHAR(50),
  job_location_type VARCHAR(50),
  responsibilities TEXT,
  requirements TEXT,
  
  -- Tender Fields
  tender_type VARCHAR(50),
  tender_category VARCHAR(100),
  
  -- Location Details
  city VARCHAR(100),
  subcity VARCHAR(100),
  specific_location VARCHAR(255),
  
  -- Payment Fields
  payment_method VARCHAR(100),
  bank_payment_style VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  
  INDEX idx_status (status),
  INDEX idx_category (category_id),
  INDEX idx_author (author_id),
  INDEX idx_featured (is_featured)
);

-- 5. Listing Comments Table
CREATE TABLE IF NOT EXISTS listing_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  listing_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_listing (listing_id),
  INDEX idx_user (user_id)
);

-- 6. Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tx_ref VARCHAR(100) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  plan_name VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ETB',
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  chapa_reference VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tx_ref (tx_ref),
  INDEX idx_user (user_id),
  INDEX idx_status (status)
);

-- 7. OTP Codes Table
CREATE TABLE IF NOT EXISTS otp_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  identifier VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(50) DEFAULT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_identifier (identifier),
  INDEX idx_expires (expires_at)
);

CREATE TABLE IF NOT EXISTS announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 9. Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
);

-- 10. System Config Table
CREATE TABLE IF NOT EXISTS system_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (config_key)
);

-- 11. Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  listing_id INT NOT NULL,
  message TEXT,
  status ENUM('Submitted', 'Viewed', 'Rejected', 'Accepted') DEFAULT 'Submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_listing (listing_id),
  INDEX idx_status (status)
);

-- 12. Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  listing_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (user_id, listing_id),
  INDEX idx_user (user_id),
  INDEX idx_listing (listing_id)
);

-- 13. Chat Conversations Table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  participant1_id INT NOT NULL,
  participant2_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_participant1 (participant1_id),
  INDEX idx_participant2 (participant2_id)
);

-- 14. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_conversation (conversation_id),
  INDEX idx_sender (sender_id),
  INDEX idx_read (is_read)
);

-- 15. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  type VARCHAR(50),
  related_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read),
  INDEX idx_type (type)
);

-- Insert Default Data
INSERT INTO system_config (config_key, config_value) VALUES 
('feature_flags', '{"forceModeration": false, "enableSmsNotifications": false}'),
('api_status', '{"chapaConfigured": true, "smsConfigured": false, "emailConfigured": true}')
ON DUPLICATE KEY UPDATE config_key = config_key;

INSERT INTO categories (name, slug, description) VALUES
('Jobs', 'jobs', 'Employment opportunities'),
('Tenders', 'tenders', 'Business tenders and contracts'),
('Homes', 'homes', 'Properties for sale and rent'),
('Cars', 'cars', 'Vehicles for sale')
ON DUPLICATE KEY UPDATE name = name;

-- Create default admin user (password: admin123)
-- You should change this password immediately after first login
INSERT INTO users (full_name, email, password, role, subscription_plan, is_verified, account_type) 
VALUES (
  'Platform Admin', 
  'admin@yesrasew.com', 
  '$2a$10$YourHashedPasswordHere', 
  'SuperAdmin', 
  'Premium',
  TRUE,
  'Individual'
)
ON DUPLICATE KEY UPDATE email = email;
