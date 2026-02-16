-- Enhanced SouEats Database Schema with User Authentication
-- Production-ready schema with proper relationships

CREATE DATABASE IF NOT EXISTS soueats CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE soueats;

-- ============================================
-- Users Table (NEW - For Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'shopkeeper', 'admin') DEFAULT 'customer',
  stallId INT DEFAULT NULL,
  department VARCHAR(255),
  phone VARCHAR(20),
  isActive TINYINT(1) DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (stallId) REFERENCES stalls(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_stallId (stallId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Stalls Table
-- ============================================
CREATE TABLE IF NOT EXISTS stalls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stallName VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  rating DECIMAL(2, 1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  specialty VARCHAR(255) NOT NULL,
  image VARCHAR(255),
  isActive TINYINT(1) DEFAULT 1,
  openTime TIME DEFAULT '08:00:00',
  closeTime TIME DEFAULT '20:00:00',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rating (rating),
  INDEX idx_stallName (stallName),
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Menu Table
-- ============================================
CREATE TABLE IF NOT EXISTS menu (
  id CHAR(36) PRIMARY KEY,
  stallId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  description TEXT,
  image VARCHAR(255),
  category VARCHAR(100),
  isVeg TINYINT(1) DEFAULT 1,
  popular TINYINT(1) DEFAULT 0,
  isAvailable TINYINT(1) DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (stallId) REFERENCES stalls(id) ON DELETE CASCADE,
  INDEX idx_stallId (stallId),
  INDEX idx_popular (popular),
  INDEX idx_price (price),
  INDEX idx_category (category),
  INDEX idx_isAvailable (isAvailable)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Orders Table (UPDATED - With User Foreign Key)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) PRIMARY KEY,
  userId CHAR(36) NOT NULL,
  items JSON NOT NULL,
  total DECIMAL(10, 2) NOT NULL CHECK (total > 0),
  pickupTime VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
  paymentStatus ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  paymentId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_timestamp (timestamp),
  INDEX idx_paymentStatus (paymentStatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Feedbacks Table (UPDATED - With User Foreign Key)
-- ============================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId CHAR(36) NOT NULL,
  stallId INT NOT NULL,
  menuItemId CHAR(36),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (stallId) REFERENCES stalls(id) ON DELETE CASCADE,
  FOREIGN KEY (menuItemId) REFERENCES menu(id) ON DELETE SET NULL,
  INDEX idx_userId (userId),
  INDEX idx_stallId (stallId),
  INDEX idx_rating (rating),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Favorites Table (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId CHAR(36) NOT NULL,
  menuItemId CHAR(36) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (menuItemId) REFERENCES menu(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (userId, menuItemId),
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample Data
-- ============================================

-- Insert sample stalls
INSERT INTO stalls (stallName, description, rating, specialty, image, openTime, closeTime) VALUES
  ('Spicy Corner', 'Authentic South Indian flavors with a spicy twist', 4.5, 'Dosas & Vadas', 'https://placehold.co/400x300/FF6B35/FFFFFF?text=Spicy+Corner', '08:00:00', '20:00:00'),
  ('Healthy Bites', 'Fresh salads and nutritious bowls', 4.2, 'Salads & Wraps', 'https://placehold.co/400x300/10B981/FFFFFF?text=Healthy+Bites', '08:00:00', '18:00:00'),
  ('Burger Hub', 'Juicy burgers and fries', 4.7, 'Burgers & Shakes', 'https://placehold.co/400x300/8B4513/FFFFFF?text=Burger+Hub', '10:00:00', '22:00:00')
ON DUPLICATE KEY UPDATE stallName=stallName;

-- Get stall IDs
SET @spicy_id = (SELECT id FROM stalls WHERE stallName = 'Spicy Corner');
SET @healthy_id = (SELECT id FROM stalls WHERE stallName = 'Healthy Bites');
SET @burger_id = (SELECT id FROM stalls WHERE stallName = 'Burger Hub');

-- Insert sample users (password: 'password123' - hashed)
-- Note: In production, use proper bcrypt hashing
INSERT INTO users (id, name, email, password, role, stallId, department) VALUES
  (UUID(), 'Admin User', 'admin@soueats.com', '$2b$10$YourHashedPasswordHere', 'admin', NULL, NULL),
  (UUID(), 'John Doe', 'john@student.com', '$2b$10$YourHashedPasswordHere', 'customer', NULL, 'Computer Engineering'),
  (UUID(), 'Spicy Corner Owner', 'spicycorner@soueats.com', '$2b$10$YourHashedPasswordHere', 'shopkeeper', @spicy_id, NULL)
ON DUPLICATE KEY UPDATE email=email;

-- Insert sample menu items
INSERT INTO menu (id, stallId, name, price, description, image, category, isVeg, popular) VALUES
  (UUID(), @spicy_id, 'Masala Dosa', 80, 'Crispy dosa filled with potato masala', 'https://placehold.co/100x100/FF6B35/FFFFFF?text=Dosa', 'South Indian', 1, 1),
  (UUID(), @spicy_id, 'Idli Sambhar', 50, 'Steamed idlis with flavorful sambhar', 'https://placehold.co/100x100/FF6B35/FFFFFF?text=Idli', 'South Indian', 1, 0),
  (UUID(), @spicy_id, 'Vada Pav', 40, 'Mumbai''s favorite street food', 'https://placehold.co/100x100/FF6B35/FFFFFF?text=Vada', 'Street Food', 1, 1),
  (UUID(), @healthy_id, 'Caesar Salad', 120, 'Classic salad with grilled chicken', 'https://placehold.co/100x100/10B981/FFFFFF?text=Salad', 'Salads', 0, 1),
  (UUID(), @healthy_id, 'Veggie Wrap', 90, 'Fresh veggies in whole wheat wrap', 'https://placehold.co/100x100/10B981/FFFFFF?text=Wrap', 'Wraps', 1, 0),
  (UUID(), @healthy_id, 'Quinoa Bowl', 150, 'Superfood quinoa with toppings', 'https://placehold.co/100x100/10B981/FFFFFF?text=Bowl', 'Bowls', 1, 1),
  (UUID(), @burger_id, 'Classic Burger', 130, 'Beef patty with cheese', 'https://placehold.co/100x100/8B4513/FFFFFF?text=Burger', 'Burgers', 0, 1),
  (UUID(), @burger_id, 'Veggie Burger', 110, 'Plant-based delight', 'https://placehold.co/100x100/8B4513/FFFFFF?text=Veggie', 'Burgers', 1, 0),
  (UUID(), @burger_id, 'Milkshake', 70, 'Creamy vanilla shake', 'https://placehold.co/100x100/8B4513/FFFFFF?text=Shake', 'Beverages', 1, 1)
ON DUPLICATE KEY UPDATE id=id;
