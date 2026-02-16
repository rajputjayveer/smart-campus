-- CORRECTED Migration - Fix Data Types
-- Copy this entire script into MySQL Workbench and execute

USE soueats;

-- Step 1: Add columns to users table (no IF NOT EXISTS for compatibility)
-- Check if columns exist first by running: DESCRIBE users;

ALTER TABLE users 
ADD COLUMN isApproved TINYINT(1) DEFAULT 1 COMMENT 'Approval status',
ADD COLUMN resetToken VARCHAR(255) NULL COMMENT 'Password reset token',
ADD COLUMN resetTokenExpiry DATETIME NULL COMMENT 'Token expiration';

-- Step 2: Add shopkeeper reference to stalls (VARCHAR to match UUID)
ALTER TABLE stalls
ADD COLUMN shopkeeperId VARCHAR(36) NULL COMMENT 'Shopkeeper user ID';

-- Step 3: Set default approval status
UPDATE users SET isApproved = 1 WHERE role = 'customer';
UPDATE users SET isApproved = 0 WHERE role = 'shopkeeper';

-- Done!
SELECT 'Migration completed successfully!' AS Status;
SELECT COUNT(*) AS total_users, 
       SUM(CASE WHEN isApproved = 1 THEN 1 ELSE 0 END) AS approved,
       SUM(CASE WHEN resetToken IS NULL THEN 1 ELSE 0 END) AS no_reset_token
FROM users;
