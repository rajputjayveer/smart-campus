-- Migration Script: Update SouEats Database for Authentication
-- This updates the existing schema to support the new authentication system

USE soueats;

-- Step 1: Add role column to users table
ALTER TABLE users 
ADD COLUMN role ENUM('customer', 'shopkeeper', 'admin') DEFAULT 'customer' AFTER password;

-- Step 2: Migrate existing isAdmin and isShopkeeper to role column
UPDATE users SET role = 'admin' WHERE isAdmin = 1;
UPDATE users SET role = 'shopkeeper' WHERE isShopkeeper = 1 AND isAdmin = 0;
UPDATE users SET role = 'customer' WHERE isAdmin = 0 AND isShopkeeper = 0;

-- Step 3: Add new columns to users table
ALTER TABLE users 
ADD COLUMN phone VARCHAR(20) AFTER department,
ADD COLUMN isActive TINYINT(1) DEFAULT 1 AFTER phone,
ADD COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt;

-- Step 4: Add userId column to orders (if using old schema with JSON user field)
-- First check if userId column exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
                  WHERE table_schema = 'soueats' 
                  AND table_name = 'orders' 
                  AND column_name = 'userId');

-- Add userId column if it doesn't exist
SET @sql = IF(@col_exists = 0,
              'ALTER TABLE orders ADD COLUMN userId CHAR(36) AFTER id',
              'SELECT "userId column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Add indexes for performance
ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_email (email),
ADD INDEX IF NOT EXISTS idx_role (role);

-- Step 6: Add new fields to stalls table
ALTER TABLE stalls 
ADD COLUMN IF NOT EXISTS isActive TINYINT(1) DEFAULT 1 AFTER image,
ADD COLUMN IF NOT EXISTS openTime TIME DEFAULT '08:00:00' AFTER isActive,
ADD COLUMN IF NOT EXISTS closeTime TIME DEFAULT '20:00:00' AFTER openTime,
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt;

-- Step 7: Add new fields to menu table
ALTER TABLE menu 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) AFTER image,
ADD COLUMN IF NOT EXISTS isVeg TINYINT(1) DEFAULT 1 AFTER category,
ADD COLUMN IF NOT EXISTS isAvailable TINYINT(1) DEFAULT 1 AFTER popular,
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt;

-- Step 8: Add payment tracking to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS paymentStatus ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending' AFTER status,
ADD COLUMN IF NOT EXISTS paymentId VARCHAR(255) AFTER paymentStatus,
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt;

-- Step 9: Update feedbacks table structure
-- Rename columns if they exist
SET @col_exists_stall = (SELECT COUNT(*) FROM information_schema.columns 
                        WHERE table_schema = 'soueats' 
                        AND table_name = 'feedbacks' 
                        AND column_name = 'stall');

SET @col_exists_item = (SELECT COUNT(*) FROM information_schema.columns 
                       WHERE table_schema = 'soueats' 
                       AND table_name = 'feedbacks' 
                       AND column_name = 'item');

-- Add userId to feedbacks if not exists
ALTER TABLE feedbacks 
ADD COLUMN IF NOT EXISTS userId CHAR(36) AFTER id;

-- Add stallId and menuItemId if they don't exist
ALTER TABLE feedbacks 
ADD COLUMN IF NOT EXISTS stallId INT AFTER userId,
ADD COLUMN IF NOT EXISTS menuItemId CHAR(36) AFTER stallId;

-- Step 10: Create favorites table if not exists
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId CHAR(36) NOT NULL,
  menuItemId CHAR(36) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorite (userId, menuItemId),
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 11: Add foreign key constraints (with error handling)
-- Note: These will only work if data integrity is maintained

-- For stalls
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE users
DROP FOREIGN KEY IF EXISTS users_ibfk_1;

ALTER TABLE users
ADD CONSTRAINT users_ibfk_1 
FOREIGN KEY (stallId) REFERENCES stalls(id) ON DELETE SET NULL;

-- For favorites
ALTER TABLE favorites
DROP FOREIGN KEY IF EXISTS favorites_ibfk_1,
DROP FOREIGN KEY IF EXISTS favorites_ibfk_2;

ALTER TABLE favorites
ADD CONSTRAINT favorites_ibfk_1 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT favorites_ibfk_2 
FOREIGN KEY (menuItemId) REFERENCES menu(id) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- Verification queries
SELECT 'Migration complete!' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_stalls FROM stalls;
SELECT COUNT(*) AS total_menu_items FROM menu;
SELECT role, COUNT(*) AS count FROM users GROUP BY role;
