-- ROLLBACK SCRIPT (if columns already exist)
-- Run this ONLY if you get "Duplicate column name" error

USE soueats;

-- Check what columns exist
DESCRIBE users;
DESCRIBE stalls;

-- If columns exist and migration failed, you may need to drop and recreate:
-- (ONLY run these if columns exist but are wrong type)

-- ALTER TABLE users DROP COLUMN IF EXISTS isApproved;
-- ALTER TABLE users DROP COLUMN IF EXISTS resetToken;
-- ALTER TABLE users DROP COLUMN IF EXISTS resetTokenExpiry;
-- ALTER TABLE stalls DROP COLUMN IF EXISTS shopkeeperId;

-- Then run FIXED_MIGRATION.sql again
