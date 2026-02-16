-- Simple Migration Runner - Copy and paste into MySQL Workbench

-- Step 1: Add columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS isApproved TINYINT(1) DEFAULT 1,
ADD COLUMN IF NOT EXISTS resetToken VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS resetTokenExpiry DATETIME NULL;

-- Step 2: Add column to stalls table  
ALTER TABLE stalls
ADD COLUMN IF NOT EXISTS shopkeeperId INT NULL,
ADD CONSTRAINT fk_stall_shopkeeper 
  FOREIGN KEY (shopkeeperId) REFERENCES users(id) ON DELETE SET NULL;

-- Step 3: Set shopkeepers to need approval by default (customers auto-approved)
UPDATE users SET isApproved = 1 WHERE role = 'customer';
UPDATE users SET isApproved = 0 WHERE role = 'shopkeeper' AND isApproved IS NULL;

-- Done! Now restart your backend server.
SELECT 'Migration completed successfully!' AS Status;
