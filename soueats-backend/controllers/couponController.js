const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { pool } = require('../config/database');

const columnExists = async (tableName, columnName) => {
    const [rows] = await pool.execute(
        `SELECT COUNT(*) AS count
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND table_name = ?
           AND column_name = ?`,
        [tableName, columnName]
    );
    return Number(rows?.[0]?.count || 0) > 0;
};

const addColumnIfMissing = async (tableName, columnName, columnDefinition) => {
    const exists = await columnExists(tableName, columnName);
    if (!exists) {
        await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    }
};

const ensureCouponTables = async () => {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS coupons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            discountType ENUM('percentage', 'fixed') NOT NULL,
            discountValue DECIMAL(10,2) NOT NULL,
            minOrderAmount DECIMAL(10,2) DEFAULT 0,
            maxDiscount DECIMAL(10,2) DEFAULT NULL,
            usageLimit INT DEFAULT NULL,
            usedCount INT DEFAULT 0,
            stallId INT DEFAULT NULL,
            isActive TINYINT(1) DEFAULT 1,
            expiresAt DATETIME DEFAULT NULL,
            createdBy CHAR(36) DEFAULT NULL,
            createdByRole ENUM('admin', 'shopkeeper') DEFAULT 'admin',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Backward compatibility: add missing columns for older installs.
    await addColumnIfMissing('coupons', 'stallId', 'INT DEFAULT NULL');
    await addColumnIfMissing('coupons', 'createdByRole', 'ENUM("admin", "shopkeeper") DEFAULT "admin"');

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS coupon_redemptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            couponId INT NOT NULL,
            orderId CHAR(36) NOT NULL,
            userId CHAR(36) NOT NULL,
            stallId INT DEFAULT NULL,
            code VARCHAR(50) NOT NULL,
            orderAmount DECIMAL(10,2) NOT NULL,
            discountAmount DECIMAL(10,2) NOT NULL,
            finalAmount DECIMAL(10,2) NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_coupon_id (couponId),
            INDEX idx_order_id (orderId),
            INDEX idx_user_id (userId),
            CONSTRAINT fk_coupon_redemption_coupon
                FOREIGN KEY (couponId) REFERENCES coupons(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await addColumnIfMissing('coupon_redemptions', 'stallId', 'INT DEFAULT NULL');
};

const calculateDiscount = (coupon, orderAmount) => {
    const amount = Number(orderAmount) || 0;
    if (amount <= 0) return 0;

    let discount = 0;
    if (coupon.discountType === 'percentage') {
        discount = (amount * Number(coupon.discountValue || 0)) / 100;
    } else {
        discount = Number(coupon.discountValue || 0);
    }

    if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
    }

    discount = Math.max(0, Math.min(discount, amount));
    return Number(discount.toFixed(2));
};

const findAndValidateCoupon = async (code, orderAmount, stallId = null) => {
    const normalizedCode = String(code || '').trim().toUpperCase();
    if (!normalizedCode) {
        throw new AppError('Coupon code is required', 400);
    }

    const amount = Number(orderAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new AppError('Valid order amount is required', 400);
    }

    const [rows] = await pool.execute(
        'SELECT * FROM coupons WHERE code = ? LIMIT 1',
        [normalizedCode]
    );

    if (rows.length === 0) {
        throw new AppError('Invalid coupon code', 404);
    }

    const coupon = rows[0];

    if (!coupon.isActive) {
        throw new AppError('Coupon is inactive', 400);
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        throw new AppError('Coupon has expired', 400);
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new AppError('Coupon usage limit reached', 400);
    }

    if (coupon.stallId && String(coupon.stallId) !== String(stallId)) {
        throw new AppError('This coupon is only valid for another stall', 400);
    }

    if (amount < Number(coupon.minOrderAmount || 0)) {
        throw new AppError(
            `Minimum order amount for this coupon is INR ${Number(coupon.minOrderAmount).toFixed(2)}`,
            400
        );
    }

    const discountAmount = calculateDiscount(coupon, amount);
    if (discountAmount <= 0) {
        throw new AppError('Coupon does not apply to this order', 400);
    }

    return {
        coupon,
        discountAmount,
        finalAmount: Number((amount - discountAmount).toFixed(2))
    };
};

const getCoupons = asyncHandler(async (req, res) => {
    await ensureCouponTables();
    const [rows] = await pool.execute(
        'SELECT * FROM coupons WHERE createdByRole = "admin" ORDER BY createdAt DESC'
    );
    res.json({ success: true, data: rows });
});

const getMyStallCoupons = asyncHandler(async (req, res, next) => {
    await ensureCouponTables();

    const [users] = await pool.execute(
        'SELECT stallId FROM users WHERE id = ? LIMIT 1',
        [req.user.id]
    );

    if (users.length === 0 || !users[0].stallId) {
        return next(new AppError('Shopkeeper stall not found', 400));
    }

    const stallId = users[0].stallId;
    const [rows] = await pool.execute(
        'SELECT * FROM coupons WHERE stallId = ? AND createdByRole = "shopkeeper" ORDER BY createdAt DESC',
        [stallId]
    );

    res.json({ success: true, data: rows });
});

const createCoupon = asyncHandler(async (req, res, next) => {
    await ensureCouponTables();

    const {
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount,
        usageLimit,
        expiresAt
    } = req.body;

    const normalizedCode = String(code || '').trim().toUpperCase();
    if (!normalizedCode) return next(new AppError('Coupon code is required', 400));
    if (!['percentage', 'fixed'].includes(discountType)) {
        return next(new AppError('discountType must be percentage or fixed', 400));
    }

    const parsedDiscountValue = Number(discountValue);
    if (!Number.isFinite(parsedDiscountValue) || parsedDiscountValue <= 0) {
        return next(new AppError('Valid discountValue is required', 400));
    }

    if (discountType === 'percentage' && parsedDiscountValue > 100) {
        return next(new AppError('Percentage discount cannot exceed 100', 400));
    }

    const parsedMinOrder = Number(minOrderAmount || 0);
    const parsedMaxDiscount =
        maxDiscount === null || maxDiscount === '' || maxDiscount === undefined
            ? null
            : Number(maxDiscount);
    const parsedUsageLimit =
        usageLimit === null || usageLimit === '' || usageLimit === undefined
            ? null
            : Number(usageLimit);

    if (!Number.isFinite(parsedMinOrder) || parsedMinOrder < 0) {
        return next(new AppError('minOrderAmount must be 0 or greater', 400));
    }
    if (parsedMaxDiscount !== null && (!Number.isFinite(parsedMaxDiscount) || parsedMaxDiscount <= 0)) {
        return next(new AppError('maxDiscount must be greater than 0', 400));
    }
    if (parsedUsageLimit !== null && (!Number.isInteger(parsedUsageLimit) || parsedUsageLimit <= 0)) {
        return next(new AppError('usageLimit must be a positive integer', 400));
    }

    let parsedExpiry = null;
    if (expiresAt) {
        parsedExpiry = new Date(expiresAt);
        if (Number.isNaN(parsedExpiry.getTime())) {
            return next(new AppError('Invalid expiry date', 400));
        }
    }

    let targetStallId = null;
    let creatorRole = 'admin';

    if (req.user.role === 'shopkeeper') {
        creatorRole = 'shopkeeper';
        const [users] = await pool.execute(
            'SELECT stallId FROM users WHERE id = ? LIMIT 1',
            [req.user.id]
        );
        if (users.length === 0 || !users[0].stallId) {
            return next(new AppError('Shopkeeper stall not found', 400));
        }
        targetStallId = users[0].stallId;
    } else if (req.user.role === 'admin') {
        creatorRole = 'admin';
        targetStallId = null; // Admin coupon is global by requirement.
    } else {
        return next(new AppError('Not authorized to create coupons', 403));
    }

    try {
        const [result] = await pool.execute(
            `INSERT INTO coupons
            (code, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, stallId, expiresAt, createdBy, createdByRole)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                normalizedCode,
                discountType,
                parsedDiscountValue,
                parsedMinOrder,
                parsedMaxDiscount,
                parsedUsageLimit,
                targetStallId,
                parsedExpiry,
                req.user?.id || null,
                creatorRole
            ]
        );

        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                code: normalizedCode,
                discountType,
                discountValue: parsedDiscountValue,
                minOrderAmount: parsedMinOrder,
                maxDiscount: parsedMaxDiscount,
                usageLimit: parsedUsageLimit,
                stallId: targetStallId,
                createdByRole: creatorRole,
                expiresAt: parsedExpiry
            }
        });
    } catch (error) {
        if (error && error.code === 'ER_DUP_ENTRY') {
            return next(new AppError('Coupon code already exists', 400));
        }
        throw error;
    }
});

const toggleCouponStatus = asyncHandler(async (req, res, next) => {
    await ensureCouponTables();
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id, isActive, stallId, createdByRole FROM coupons WHERE id = ?', [id]);
    if (existing.length === 0) {
        return next(new AppError('Coupon not found', 404));
    }

    const coupon = existing[0];
    if (req.user.role === 'shopkeeper') {
        const [users] = await pool.execute('SELECT stallId FROM users WHERE id = ? LIMIT 1', [req.user.id]);
        if (users.length === 0 || !users[0].stallId || String(users[0].stallId) !== String(coupon.stallId)) {
            return next(new AppError('Not authorized for this coupon', 403));
        }
    } else if (req.user.role !== 'admin') {
        return next(new AppError('Not authorized', 403));
    }

    const nextStatus = existing[0].isActive ? 0 : 1;
    await pool.execute('UPDATE coupons SET isActive = ? WHERE id = ?', [nextStatus, id]);

    res.json({
        success: true,
        data: { id: Number(id), isActive: Boolean(nextStatus) }
    });
});

const deleteCoupon = asyncHandler(async (req, res, next) => {
    await ensureCouponTables();
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id, stallId FROM coupons WHERE id = ?', [id]);
    if (existing.length === 0) {
        return next(new AppError('Coupon not found', 404));
    }

    if (req.user.role === 'shopkeeper') {
        const [users] = await pool.execute('SELECT stallId FROM users WHERE id = ? LIMIT 1', [req.user.id]);
        if (users.length === 0 || !users[0].stallId || String(users[0].stallId) !== String(existing[0].stallId)) {
            return next(new AppError('Not authorized for this coupon', 403));
        }
    } else if (req.user.role !== 'admin') {
        return next(new AppError('Not authorized', 403));
    }

    const [result] = await pool.execute('DELETE FROM coupons WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
        return next(new AppError('Coupon not found', 404));
    }
    res.json({ success: true, message: 'Coupon deleted successfully' });
});

const validateCoupon = asyncHandler(async (req, res) => {
    await ensureCouponTables();
    const { code, orderAmount, stallId } = req.body;
    const validated = await findAndValidateCoupon(code, orderAmount, stallId);

    res.json({
        success: true,
        data: {
            id: validated.coupon.id,
            code: validated.coupon.code,
            discountType: validated.coupon.discountType,
            discountValue: Number(validated.coupon.discountValue),
            discountAmount: validated.discountAmount,
            orderAmount: Number(orderAmount),
            finalAmount: validated.finalAmount,
            stallId: validated.coupon.stallId,
            minOrderAmount: Number(validated.coupon.minOrderAmount || 0),
            maxDiscount: validated.coupon.maxDiscount !== null ? Number(validated.coupon.maxDiscount) : null
        }
    });
});

const getAvailableOffers = asyncHandler(async (req, res, next) => {
    await ensureCouponTables();
    const { stallId } = req.query;

    if (!stallId) {
        return next(new AppError('stallId is required', 400));
    }

    const [rows] = await pool.execute(
        `SELECT id, code, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, usedCount, stallId, expiresAt
         FROM coupons
         WHERE isActive = 1
           AND (expiresAt IS NULL OR expiresAt > NOW())
           AND (stallId IS NULL OR stallId = ?)
         ORDER BY stallId DESC, createdAt DESC`,
        [stallId]
    );

    const offers = rows.filter((coupon) => {
        if (coupon.usageLimit === null) return true;
        return Number(coupon.usedCount) < Number(coupon.usageLimit);
    });

    res.json({ success: true, data: offers });
});

module.exports = {
    ensureCouponTables,
    findAndValidateCoupon,
    getCoupons,
    getMyStallCoupons,
    createCoupon,
    toggleCouponStatus,
    deleteCoupon,
    validateCoupon,
    getAvailableOffers
};
