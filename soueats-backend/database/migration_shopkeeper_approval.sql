-- Migration: Add Shopkeeper Approval and Password Reset Features
-- Updated to work with existing users and stalls schema
-- Run this migration after importing the base schema

USE soueats;

-- Add new columns to users table (only what's missing)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS isApproved TINYINT(1) DEFAULT 1 COMMENT 'Approval status for shopkeepers',
  ADD COLUMN IF NOT EXISTS resetToken VARCHAR(255) DEFAULT NULL COMMENT 'Password reset token',
  ADD COLUMN IF NOT EXISTS resetTokenExpiry DATETIME DEFAULT NULL COMMENT 'Reset token expiration';

-- Update existing users to approved status
UPDATE users SET isApproved = 1 WHERE isApproved IS NULL;

-- Add shopkeeper reference to stalls (links stall to its shopkeeper)
ALTER TABLE stalls 
  ADD COLUMN IF NOT EXISTS shopkeeperId VARCHAR(36) DEFAULT NULL COMMENT 'Reference to shopkeeper user',
  ADD CONSTRAINT fk_stall_shopkeeper 
    FOREIGN KEY (shopkeeperId) REFERENCES users(id) 
    ON DELETE SET NULL;

-- Create default shopkeepers for each stall with password "12345"
-- First, we need to generate the bcrypt hash for "12345"
-- Hash: $2b$10$N9qo8uLOickgx2ZoE5/YEuHLmIKOk.PzPEXmQPhOvNL8bCh6K0V8y (bcrypt "12345")

SET @defaultPassword = '$2b$10$N9qo8uLOickgx2ZoE5/YEuHLmIKOk.PzPEXmQPhOvNL8bCh6K0V8y';

-- Insert shopkeepers for stalls that don't have one yet
INSERT INTO users (id, name, email, password, role, department, stallId, isApproved, isActive, isAdmin, isShopkeeper, createdAt)
SELECT
  UUID() as id,
  CONCAT(s.stallName, ' Shopkeeper') as name,
  CONCAT(LOWER(REPLACE(REPLACE(s.stallName, ' ', '_'), '''', '')), '@soueats.com') as email,
  @defaultPassword as password,
  'shopkeeper' as role,
  'Food Service' as department,
  s.id as stallId,
  1 as isApproved,
  1 as isActive,
  0 as isAdmin,
  1 as isShopkeeper,
  NOW() as createdAt
FROM stalls s
WHERE NOT EXISTS (
  SELECT 1 FROM users u 
  WHERE u.stallId = s.id AND u.role = 'shopkeeper'
)
AND s.id IS NOT NULL;

-- Link shopkeepers to their stalls
UPDATE stalls s
SET shopkeeperId = (
  SELECT u.id FROM users u 
  WHERE u.stallId = s.id AND u.role = 'shopkeeper'
  ORDER BY u.createdAt ASC
  LIMIT 1
)
WHERE shopkeeperId IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role_approved ON users(role, isApproved);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(resetToken);
CREATE INDEX IF NOT EXISTS idx_stalls_shopkeeper ON stalls(shopkeeperId);
CREATE INDEX IF NOT EXISTS idx_users_stall ON users(stallId);

-- Display all shopkeepers created (for verification)
SELECT 
  u.id,
  u.name,
  u.email,
  s.stallName as stall,
  u.role,
  u.isApproved,
  u.isActive,
  'Password: 12345' as defaultPassword
FROM users u
JOIN stalls s ON u.stallId = s.id
WHERE u.role = 'shopkeeper'
ORDER BY s.id;

-- Summary
SELECT 
  COUNT(*) as total_shopkeepers,
  SUM(CASE WHEN isApproved = 1 THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN isApproved = 0 THEN 1 ELSE 0 END) as pending
FROM users
WHERE role = 'shopkeeper';

COMMIT;

-- NOTES:
-- 1. All shopkeepers created with this migration are auto-approved (isApproved=1)
-- 2. Default password for all shopkeepers: 12345
-- 3. Email format: stallname@soueats.com (spaces replaced with underscores)
-- 4. Each stall now has shopkeeperId linking to its shopkeeper
-- 5. Users table is ready for password reset functionality
