const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');
const { v4: uuidv4 } = require('uuid');
const { findAndValidateCoupon, ensureCouponTables } = require('./couponController');

/**
 * Order Controller
 * Handles all order-related requests
 */

// @desc    Get all orders
// @route   GET /api/orders
// @access  Admin/Shopkeeper/User (filtered)
const getAllOrders = asyncHandler(async (req, res, next) => {
    const { userId, stallId, status } = req.query;

    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (userId) {
        query += ' AND JSON_EXTRACT(user, "$.id") = ?';
        params.push(userId);
    }

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    query += ' ORDER BY timestamp DESC';

    let rows = [];

    if (stallId) {
        // Prefer direct stallId column if it exists, fallback to JSON search in items
        try {
            const stallQuery = query.replace('WHERE 1=1', 'WHERE 1=1 AND stallId = ?');
            const stallParams = [stallId, ...params];
            [rows] = await pool.execute(stallQuery, stallParams);
        } catch (error) {
            if (error && error.code === 'ER_BAD_FIELD_ERROR') {
                const jsonQuery = query.replace('WHERE 1=1', 'WHERE 1=1 AND JSON_SEARCH(items, "one", ?, NULL, "$[*].stallId") IS NOT NULL');
                const jsonParams = [stallId, ...params];
                [rows] = await pool.execute(jsonQuery, jsonParams);
            } else {
                throw error;
            }
        }
    } else {
        [rows] = await pool.execute(query, params);
    }

    // Parse JSON fields
    const orders = rows.map(order => ({
        ...order,
        user: typeof order.user === 'string' ? JSON.parse(order.user) : order.user,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    }));

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders
    });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Admin/Shopkeeper/User (own orders)
const getOrderById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);

    if (rows.length === 0) {
        return next(new AppError(`Order not found with id: ${id}`, 404));
    }

    const order = {
        ...rows[0],
        user: typeof rows[0].user === 'string' ? JSON.parse(rows[0].user) : rows[0].user,
        items: typeof rows[0].items === 'string' ? JSON.parse(rows[0].items) : rows[0].items
    };

    res.status(200).json({
        success: true,
        data: order
    });
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Authenticated users
const createOrder = asyncHandler(async (req, res, next) => {
    const {
        user,
        items,
        total,
        pickupTime,
        paymentId,
        paymentOrderId,
        paymentSignature,
        couponCode
    } = req.body;

    if (!user || !user.id) {
        return next(new AppError('User information is required', 400));
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return next(new AppError('Order must contain at least one item', 400));
    }

    const rawTotal = Number(
        items.reduce((sum, item) => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;
            return sum + price * quantity;
        }, 0).toFixed(2)
    );

    if (rawTotal <= 0) {
        return next(new AppError('Valid total amount is required', 400));
    }

    let finalTotal = rawTotal;
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
        await ensureCouponTables();
        const validated = await findAndValidateCoupon(couponCode, rawTotal);
        appliedCoupon = validated.coupon;
        discountAmount = validated.discountAmount;
        finalTotal = validated.finalAmount;
    }

    if (total !== undefined && total !== null) {
        const requestTotal = Number(total);
        if (!Number.isFinite(requestTotal) || Math.abs(requestTotal - finalTotal) > 0.01) {
            return next(new AppError('Order total mismatch. Please re-apply coupon and try again.', 400));
        }
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Determine payment status based on paymentId
    const paymentStatus = paymentId ? 'completed' : 'pending';

    // Insert order (support multiple schemas: user JSON vs userId, and optional payment columns)
    const orderStallId = items && items.length > 0 ? items[0].stallId : null;

    const insertWithUserJson = async (includePaymentFields, includeStallId) => {
        if (includePaymentFields) {
            return pool.execute(
                includeStallId
                    ? 'INSERT INTO orders (id, userId, user, items, total, pickupTime, timestamp, status, stallId, paymentStatus, paymentId) VALUES (?, ?, ?, ?, ?, ?, ?, "pending", ?, ?, ?)'
                    : 'INSERT INTO orders (id, userId, user, items, total, pickupTime, timestamp, status, paymentStatus, paymentId) VALUES (?, ?, ?, ?, ?, ?, ?, "pending", ?, ?)',
                includeStallId
                    ? [id, user.id, JSON.stringify(user), JSON.stringify(items), finalTotal, pickupTime || null, timestamp, orderStallId, paymentStatus, paymentId || null]
                    : [id, user.id, JSON.stringify(user), JSON.stringify(items), finalTotal, pickupTime || null, timestamp, paymentStatus, paymentId || null]
            );
        }
        return pool.execute(
            includeStallId
                ? 'INSERT INTO orders (id, userId, user, items, total, pickupTime, timestamp, status, stallId) VALUES (?, ?, ?, ?, ?, ?, ?, "pending", ?)'
                : 'INSERT INTO orders (id, userId, user, items, total, pickupTime, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, "pending")',
            includeStallId
                ? [id, user.id, JSON.stringify(user), JSON.stringify(items), finalTotal, pickupTime || null, timestamp, orderStallId]
                : [id, user.id, JSON.stringify(user), JSON.stringify(items), finalTotal, pickupTime || null, timestamp]
        );
    };

    const insertWithUserId = async (includePaymentFields, includeStallId) => {
        if (includePaymentFields) {
            return pool.execute(
                includeStallId
                    ? 'INSERT INTO orders (id, userId, user, items, total, pickupTime, timestamp, status, stallId, paymentStatus, paymentId) VALUES (?, ?, ?, ?, ?, ?, ?, "pending", ?, ?, ?)'
                    : 'INSERT INTO orders (id, userId, user, items, total, pickupTime, timestamp, status, paymentStatus, paymentId) VALUES (?, ?, ?, ?, ?, ?, ?, "pending", ?, ?)',
                includeStallId
                    ? [id, user.id, JSON.stringify(user), JSON.stringify(items), finalTotal, pickupTime || null, timestamp, orderStallId, paymentStatus, paymentId || null]
                    : [id, user.id, JSON.stringify(user), JSON.stringify(items), finalTotal, pickupTime || null, timestamp, paymentStatus, paymentId || null]
            );
        }
        return pool.execute(
            includeStallId
                ? 'INSERT INTO orders (id, userId, user, items, total, pickupTime, timestamp, status, stallId) VALUES (?, ?, ?, ?, ?, ?, ?, "pending", ?)'
                : 'INSERT INTO orders (id, userId, user, items, total, pickupTime, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, "pending")',
            includeStallId
                ? [id, user.id, JSON.stringify(user), JSON.stringify(items), finalTotal, pickupTime || null, timestamp, orderStallId]
                : [id, user.id, JSON.stringify(user), JSON.stringify(items), finalTotal, pickupTime || null, timestamp]
        );
    };

    let inserted = false;
    try {
        await insertWithUserJson(true, true);
        inserted = true;
    } catch (error) {
        if (error && error.code === 'ER_BAD_FIELD_ERROR' && String(error.message || '').includes('stallId')) {
            try {
                await insertWithUserJson(true, false);
                inserted = true;
            } catch (innerError) {
                error = innerError;
            }
        }
        if (!inserted && error && error.code === 'ER_BAD_FIELD_ERROR' && String(error.message || '').includes('payment')) {
            try {
                await insertWithUserJson(false, true);
                inserted = true;
            } catch (innerError) {
                error = innerError;
            }
        }
        if (!inserted) {
            try {
            await insertWithUserId(true, true);
                inserted = true;
            } catch (innerError) {
                if (innerError && innerError.code === 'ER_BAD_FIELD_ERROR' && String(innerError.message || '').includes('stallId')) {
                    await insertWithUserId(true, false);
                    inserted = true;
                } else if (innerError && innerError.code === 'ER_BAD_FIELD_ERROR' && String(innerError.message || '').includes('payment')) {
                    await insertWithUserId(false, true);
                    inserted = true;
                } else {
                    throw innerError;
                }
            }
        }
    }

    if (appliedCoupon) {
        try {
            await pool.execute('UPDATE coupons SET usedCount = usedCount + 1 WHERE id = ?', [appliedCoupon.id]);
            await pool.execute(
                `INSERT INTO coupon_redemptions
                (couponId, orderId, userId, code, orderAmount, discountAmount, finalAmount)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [appliedCoupon.id, id, user.id, appliedCoupon.code, rawTotal, discountAmount, finalTotal]
            );
        } catch (error) {
            console.error('Coupon redemption save failed:', error.message);
        }
    }

    res.status(201).json({
        success: true,
        data: {
            id,
            user,
            items,
            total: finalTotal,
            originalTotal: rawTotal,
            discountAmount,
            couponCode: appliedCoupon ? appliedCoupon.code : null,
            pickupTime: pickupTime || null,
            timestamp,
            status: 'pending',
            paymentStatus,
            paymentId: paymentId || null
        }
    });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Admin/Shopkeeper
const updateOrderStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    // Check if order exists
    const [existing] = await pool.execute('SELECT id FROM orders WHERE id = ?', [id]);

    if (existing.length === 0) {
        return next(new AppError(`Order not found with id: ${id}`, 404));
    }

    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: { id, status }
    });
});

// @desc    Update individual item status in order
// @route   PUT /api/orders/:orderId/items/:itemId
// @access  Admin/Shopkeeper
const updateOrderItemStatus = asyncHandler(async (req, res, next) => {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);

    if (orders.length === 0) {
        return next(new AppError(`Order not found with id: ${orderId}`, 404));
    }

    const order = orders[0];
    let items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    if (!Array.isArray(items)) {
        return next(new AppError('Invalid items data in order', 500));
    }

    const itemIndex = items.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
        return next(new AppError(`Item not found in order with id: ${itemId}`, 404));
    }

    items[itemIndex].status = status;

    await pool.execute('UPDATE orders SET items = ? WHERE id = ?', [JSON.stringify(items), orderId]);

    res.status(200).json({
        success: true,
        message: 'Item status updated successfully',
        data: { orderId, itemId, status }
    });
});

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Authenticated users (or with userId in query)
const getMyOrders = asyncHandler(async (req, res, next) => {
    // Get user ID from multiple sources (auth middleware, query parameter, or body)
    let userId = req.user?.id || req.query.userId || req.body?.userId;
    
    // If still no userId, try to extract from Authorization header manually
    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const jwt = require('jsonwebtoken');
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            userId = decoded.id;
            req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
            console.log('User authenticated via token:', userId);
        } catch (error) {
            // Token invalid, continue to check other methods
            console.log('Token verification failed, will use userId from query if provided');
        }
    }
    
    if (!userId) {
        console.error('getMyOrders: No user ID found', {
            hasUser: !!req.user,
            userId: req.user?.id,
            queryUserId: req.query.userId,
            hasAuthHeader: !!req.headers.authorization,
            queryParams: req.query
        });
        return res.status(400).json({
            success: false,
            error: 'User ID is required. Please provide userId in query parameter (e.g., ?userId=YOUR_USER_ID) or ensure you are authenticated with a valid token.'
        });
    }
    
    console.log('getMyOrders: Using userId:', userId);

    // Get orders for this user - try both user JSON format and userId column
    let rows;
    try {
        [rows] = await pool.execute(
            'SELECT * FROM orders WHERE JSON_EXTRACT(user, "$.id") = ? ORDER BY timestamp DESC',
            [userId]
        );
    } catch (error) {
        // If JSON_EXTRACT fails, try with userId column
        try {
            [rows] = await pool.execute(
                'SELECT * FROM orders WHERE userId = ? ORDER BY timestamp DESC',
                [userId]
            );
        } catch (err) {
            return next(new AppError('Failed to fetch orders', 500));
        }
    }

    // Parse JSON fields and enrich with stall information
    const orders = await Promise.all(rows.map(async (order) => {
        const parsedOrder = {
            ...order,
            user: typeof order.user === 'string' ? JSON.parse(order.user) : order.user,
            items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
        };

        // Get stall information from first item
        if (parsedOrder.items && parsedOrder.items.length > 0) {
            const firstItem = parsedOrder.items[0];
            if (firstItem.stallId) {
                const [stalls] = await pool.execute('SELECT stallName, specialty FROM stalls WHERE id = ?', [firstItem.stallId]);
                if (stalls.length > 0) {
                    parsedOrder.stallName = stalls[0].stallName;
                    parsedOrder.stallSpecialty = stalls[0].specialty;
                }
            }
        }

        return parsedOrder;
    }));

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders
    });
});

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  User (own orders)/Admin
const cancelOrder = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT status FROM orders WHERE id = ?', [id]);

    if (existing.length === 0) {
        return next(new AppError(`Order not found with id: ${id}`, 404));
    }

    // Only allow cancellation of pending/preparing orders
    if (existing[0].status === 'completed' || existing[0].status === 'cancelled') {
        return next(new AppError('Cannot cancel a completed or already cancelled order', 400));
    }

    await pool.execute('UPDATE orders SET status = "cancelled" WHERE id = ?', [id]);

    res.status(200).json({
        success: true,
        message: 'Order cancelled successfully'
    });
});

module.exports = {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    updateOrderItemStatus,
    cancelOrder,
    getMyOrders
};
