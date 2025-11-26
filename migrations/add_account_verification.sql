-- Migration: Add account type and verification system to users table
-- Run this migration to enable company vs individual account differentiation
-- Date: 2025-11-25

-- Step 1: Add account_type column
ALTER TABLE users 
  ADD COLUMN account_type ENUM('individual', 'company') DEFAULT 'individual' AFTER role;

-- Step 2: Add verification status column
ALTER TABLE users 
  ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER account_type;

-- Step 3: Add verification_status column
ALTER TABLE users 
  ADD COLUMN verification_status ENUM('pending', 'approved', 'rejected') DEFAULT NULL AFTER is_verified;

-- Step 4: Add verification_documents JSON column
ALTER TABLE users 
  ADD COLUMN verification_documents JSON DEFAULT NULL AFTER verification_status;

-- Step 5: Add verification timestamp columns
ALTER TABLE users 
  ADD COLUMN verification_requested_at TIMESTAMP NULL AFTER verification_documents,
  ADD COLUMN verified_at TIMESTAMP NULL AFTER verification_requested_at,
  ADD COLUMN verification_rejection_reason TEXT NULL AFTER verified_at;

-- Step 6: Add indexes for better query performance
ALTER TABLE users
  ADD INDEX idx_account_type (account_type),
  ADD INDEX idx_is_verified (is_verified),
  ADD INDEX idx_verification_status (verification_status);

-- Step 7: Update existing users to have individual account type (already default)
-- This ensures all existing users are set as individuals
UPDATE users SET account_type = 'individual' WHERE account_type IS NULL;

-- Verify the changes
DESCRIBE users;
