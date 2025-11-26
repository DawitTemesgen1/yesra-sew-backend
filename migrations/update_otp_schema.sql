-- Migration: Update OTP codes table to support both email and phone identifiers
-- Run this migration before deploying the updated OTP system

-- Step 1: Rename phone_number column to identifier
ALTER TABLE otp_codes 
  CHANGE COLUMN phone_number identifier VARCHAR(255) NOT NULL;

-- Step 2: Add type column to distinguish OTP purposes
ALTER TABLE otp_codes 
  ADD COLUMN type ENUM('registration', 'password_reset', 'verification') DEFAULT 'registration' AFTER code;

-- Step 3: Update indexes for better performance
ALTER TABLE otp_codes
  DROP INDEX IF EXISTS idx_phone_number,
  ADD INDEX idx_identifier_code (identifier, code),
  ADD INDEX idx_expires (expires_at);

-- Verify the changes
DESCRIBE otp_codes;
