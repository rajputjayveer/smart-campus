-- Migration: Add Coupons and Coupon Redemptions
USE soueats;

CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discountType ENUM('percentage', 'fixed') NOT NULL,
  discountValue DECIMAL(10, 2) NOT NULL,
  minOrderAmount DECIMAL(10, 2) DEFAULT 0,
  maxDiscount DECIMAL(10, 2) DEFAULT NULL,
  usageLimit INT DEFAULT NULL,
  usedCount INT DEFAULT 0,
  isActive TINYINT(1) DEFAULT 1,
  expiresAt DATETIME DEFAULT NULL,
  createdBy CHAR(36) DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  couponId INT NOT NULL,
  orderId CHAR(36) NOT NULL,
  userId CHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  orderAmount DECIMAL(10, 2) NOT NULL,
  discountAmount DECIMAL(10, 2) NOT NULL,
  finalAmount DECIMAL(10, 2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coupon_id (couponId),
  INDEX idx_order_id (orderId),
  INDEX idx_user_id (userId),
  CONSTRAINT fk_coupon_redemption_coupon
    FOREIGN KEY (couponId) REFERENCES coupons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
