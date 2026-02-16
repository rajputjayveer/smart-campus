const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');
const { v4: uuidv4 } = require('uuid');

/**
 * Menu Controller
 * Handles all menu-related requests
 */

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
const getAllMenuItems = asyncHandler(async (req, res, next) => {
    const { stallId, popular, minPrice, maxPrice } = req.query;

    let query = 'SELECT * FROM menu WHERE 1=1';
    const params = [];

    if (stallId) {
        query += ' AND stallId = ?';
        params.push(stallId);
    }

    if (popular === 'true') {
        query += ' AND popular = 1';
    }

    if (minPrice) {
        query += ' AND price >= ?';
        params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
        query += ' AND price <= ?';
        params.push(parseFloat(maxPrice));
    }

    query += ' ORDER BY popular DESC, name ASC';

    const [rows] = await pool.execute(query, params);

    res.status(200).json({
        success: true,
        count: rows.length,
        data: rows
    });
});

// @desc    Get menu items by stall ID
// @route   GET /api/menu/stall/:stallId
// @access  Public
const getMenuByStall = asyncHandler(async (req, res, next) => {
    const { stallId } = req.params;

    const [rows] = await pool.execute(
        'SELECT * FROM menu WHERE stallId = ? ORDER BY popular DESC, name ASC',
        [stallId]
    );

    res.status(200).json({
        success: true,
        count: rows.length,
        data: rows
    });
});

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
const getMenuItemById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const [rows] = await pool.execute('SELECT * FROM menu WHERE id = ?', [id]);

    if (rows.length === 0) {
        return next(new AppError(`Menu item not found with id: ${id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: rows[0]
    });
});

// @desc    Create new menu item
// @route   POST /api/menu
// @access  Shopkeeper/Admin
const createMenuItem = asyncHandler(async (req, res, next) => {
    const { stallId, name, price, description, image, popular } = req.body;

    // Verify stall exists
    const [stalls] = await pool.execute('SELECT id FROM stalls WHERE id = ?', [stallId]);

    if (stalls.length === 0) {
        return next(new AppError(`Stall not found with id: ${stallId}`, 404));
    }

    const id = uuidv4();

    await pool.execute(
        'INSERT INTO menu (id, stallId, name, price, description, image, popular) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, stallId, name, price, description || null, image || null, popular ? 1 : 0]
    );

    res.status(201).json({
        success: true,
        data: {
            id,
            stallId,
            name,
            price,
            description,
            image,
            popular: Boolean(popular)
        }
    });
});

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Shopkeeper/Admin
const updateMenuItem = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { stallId, name, price, description, image, popular } = req.body;

    // Check if menu item exists
    const [existing] = await pool.execute('SELECT id FROM menu WHERE id = ?', [id]);

    if (existing.length === 0) {
        return next(new AppError(`Menu item not found with id: ${id}`, 404));
    }

    // Verify stall exists if stallId is being updated
    if (stallId) {
        const [stalls] = await pool.execute('SELECT id FROM stalls WHERE id = ?', [stallId]);

        if (stalls.length === 0) {
            return next(new AppError(`Stall not found with id: ${stallId}`, 404));
        }
    }

    await pool.execute(
        'UPDATE menu SET stallId = ?, name = ?, price = ?, description = ?, image = ?, popular = ? WHERE id = ?',
        [stallId, name, price, description || null, image || null, popular ? 1 : 0, id]
    );

    res.status(200).json({
        success: true,
        data: {
            id,
            stallId,
            name,
            price,
            description,
            image,
            popular: Boolean(popular)
        }
    });
});

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Shopkeeper/Admin
const deleteMenuItem = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // Check if menu item exists
    const [existing] = await pool.execute('SELECT id FROM menu WHERE id = ?', [id]);

    if (existing.length === 0) {
        return next(new AppError(`Menu item not found with id: ${id}`, 404));
    }

    await pool.execute('DELETE FROM menu WHERE id = ?', [id]);

    res.status(200).json({
        success: true,
        message: 'Menu item deleted successfully'
    });
});

module.exports = {
    getAllMenuItems,
    getMenuByStall,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem
};
