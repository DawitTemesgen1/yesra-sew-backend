-- Add new columns to users table
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN is_phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN company_name VARCHAR(255);
ALTER TABLE users ADD COLUMN company_role VARCHAR(255);
ALTER TABLE users ADD COLUMN logo_url VARCHAR(255);
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);
ALTER TABLE users ADD COLUMN address VARCHAR(255);
ALTER TABLE users ADD COLUMN about_me TEXT;
ALTER TABLE users ADD COLUMN website VARCHAR(255);
ALTER TABLE users ADD COLUMN social_links JSON;
ALTER TABLE users ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE;

-- Make email optional (if supported by DB, otherwise we might need to allow NULLs or dummy values)
ALTER TABLE users MODIFY email VARCHAR(255) NULL;

-- Create OTP codes table
CREATE TABLE otp_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone_number VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to listings table
ALTER TABLE listings ADD COLUMN property_type VARCHAR(50);
ALTER TABLE listings ADD COLUMN furnishing VARCHAR(50);
ALTER TABLE listings ADD COLUMN make VARCHAR(50);
ALTER TABLE listings ADD COLUMN model VARCHAR(50);
ALTER TABLE listings ADD COLUMN year INT;
ALTER TABLE listings ADD COLUMN transmission VARCHAR(50);
ALTER TABLE listings ADD COLUMN fuel_type VARCHAR(50);
ALTER TABLE listings ADD COLUMN mileage INT;
ALTER TABLE listings ADD COLUMN `condition` VARCHAR(50);
ALTER TABLE listings ADD COLUMN experience_level VARCHAR(50);
ALTER TABLE listings ADD COLUMN education_level VARCHAR(50);
ALTER TABLE listings ADD COLUMN deadline DATE;
ALTER TABLE listings ADD COLUMN salary_type VARCHAR(50);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  related_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
