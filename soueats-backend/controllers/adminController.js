// Admin Controller - Shopkeeper approval and management
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { pool } = require('../config/database');

// Get all pending shopkeepers
exports.getPendingShopkeepers = asyncHandler(async (req, res, next) => {
    const [shopkeepers] = await pool.execute(
        `SELECT u.id, u.name, u.email, u.department, u.stallId, u.createdAt,
            s.stallName, s.specialty
     FROM users u
     LEFT JOIN stalls s ON u.stallId = s.id
     WHERE u.role = 'shopkeeper' AND u.isApproved = 0
     ORDER BY u.createdAt DESC`
    );

    res.json({
        success: true,
        data: shopkeepers
    });
});

// Approve or reject shopkeeper
exports.approveShopkeeper = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { approve } = req.body; // true to approve, false to reject

    if (approve === undefined) {
        return next(new AppError('Please specify approve status', 400));
    }

    if (approve) {
        // Approve shopkeeper
        await pool.execute(
            'UPDATE users SET isApproved = 1, updatedAt = NOW() WHERE id = ? AND role = "shopkeeper"',
            [id]
        );

        // Update stall's shopkeeperId
        await pool.execute(
            'UPDATE stalls SET shopkeeperId = ? WHERE id = (SELECT stallId FROM users WHERE id = ?)',
            [id, id]
        );

        res.json({
            success: true,
            message: 'Shopkeeper approved successfully'
        });
    } else {
        // Reject - delete the user
        await pool.execute('DELETE FROM users WHERE id = ? AND role = "shopkeeper"', [id]);

        res.json({
            success: true,
            message: 'Shopkeeper registration rejected'
        });
    }
});

// Get all shopkeepers (approved)
exports.getAllShopkeepers = asyncHandler(async (req, res, next) => {
    const [shopkeepers] = await pool.execute(
        `SELECT u.id, u.name, u.email, u.department, u.stallId, u.isActive, u.createdAt,
            s.stallName, s.specialty, s.rating
     FROM users u
     LEFT JOIN stalls s ON u.stallId = s.id
     WHERE u.role = 'shopkeeper' AND u.isApproved = 1
     ORDER BY s.stallName`
    );

    res.json({
        success: true,
        data: shopkeepers
    });
});

// Toggle shopkeeper active status
exports.toggleShopkeeperStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const [result] = await pool.execute(
        'UPDATE users SET isActive = NOT isActive, updatedAt = NOW() WHERE id = ? AND role = "shopkeeper"',
        [id]
    );

    if (result.affectedRows === 0) {
        return next(new AppError('Shopkeeper not found', 404));
    }

    res.json({
        success: true,
        message: 'Shopkeeper status updated'
    });
});

// Get available stalls for shopkeeper registration
exports.getAvailableStalls = asyncHandler(async (req, res, next) => {
    const [stalls] = await pool.execute(
        `SELECT s.id, s.stallName, s.description, s.specialty
     FROM stalls s
     WHERE s.shopkeeperId IS NULL OR NOT EXISTS (
       SELECT 1 FROM users u 
       WHERE u.stallId = s.id AND u.role = 'shopkeeper' AND u.isActive = 1
     )
     ORDER BY s.stallName`
    );

    res.json({
        success: true,
        data: stalls
    });
});
