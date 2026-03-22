-- Migration to add OTP verification and Seasonal Recommendations support

-- Add pickupOtp to orders table
ALTER TABLE orders ADD COLUMN pickupOtp VARCHAR(6) AFTER status;

-- Add season/category tags to menu table to support realistic recommendations
ALTER TABLE menu ADD COLUMN season VARCHAR(50) DEFAULT 'All' AFTER popular;

-- Update some existing items with seasons for testing
UPDATE menu SET season = 'Summer' WHERE name LIKE '%Cold%' OR name LIKE '%Shake%' OR name LIKE '%Salad%';
UPDATE menu SET season = 'Winter' WHERE name LIKE '%Hot%' OR name LIKE '%Soup%' OR name LIKE '%Chai%';
UPDATE menu SET season = 'Monsoon' WHERE name LIKE '%Vada%' OR name LIKE '%Samosa%';

-- Add some dummy seasonal data
-- Summer Items
INSERT INTO menu (id, stallId, name, price, description, image, category, isVeg, popular, season) 
SELECT UUID(), id, 'Mango Lassi', 60, 'Refreshing chilled mango yogurt drink', 'https://placehold.co/100x100/FFD700/FFFFFF?text=Lassi', 'Beverages', 1, 1, 'Summer' FROM stalls LIMIT 1;

INSERT INTO menu (id, stallId, name, price, description, image, category, isVeg, popular, season) 
SELECT UUID(), id, 'Watermelon Juice', 50, 'Freshly squeezed watermelon juice', 'https://placehold.co/100x100/FF5E5E/FFFFFF?text=Juice', 'Beverages', 1, 0, 'Summer' FROM stalls LIMIT 1;

-- Winter Items
INSERT INTO menu (id, stallId, name, price, description, image, category, isVeg, popular, season) 
SELECT UUID(), id, 'Hot Tomato Soup', 60, 'Creamy tomato soup served with croutons', 'https://placehold.co/100x100/FF0000/FFFFFF?text=Soup', 'Soups', 1, 1, 'Winter' FROM stalls LIMIT 1;

INSERT INTO menu (id, stallId, name, price, description, image, category, isVeg, popular, season) 
SELECT UUID(), id, 'Ginger Tea', 20, 'Hot tea infused with fresh ginger', 'https://placehold.co/100x100/A0522D/FFFFFF?text=Tea', 'Beverages', 1, 1, 'Winter' FROM stalls LIMIT 1;
