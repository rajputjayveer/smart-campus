const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Feedback Controller
 * Handles all feedback-related requests
 */

// @desc    Get all feedbacks
// @route   GET /api/feedbacks
// @access  Public
const getAllFeedbacks = asyncHandler(async (req, res, next) => {
    const { stall, item, minRating, maxRating } = req.query;

    let query = 'SELECT * FROM feedbacks WHERE 1=1';
    const params = [];

    if (stall) {
        query += ' AND stall = ?';
        params.push(stall);
    }

    if (item) {
        query += ' AND item = ?';
        params.push(item);
    }

    if (minRating) {
        query += ' AND rating >= ?';
        params.push(parseInt(minRating));
    }

    if (maxRating) {
        query += ' AND rating <= ?';
        params.push(parseInt(maxRating));
    }

    query += ' ORDER BY timestamp DESC';

    const [rows] = await pool.execute(query, params);

    res.status(200).json({
        success: true,
        count: rows.length,
        data: rows
    });
});

// @desc    Get feedbacks by stall
// @route   GET /api/feedbacks/stall/:stallName
// @access  Public
const getFeedbacksByStall = asyncHandler(async (req, res, next) => {
    const { stallName } = req.params;

    const [rows] = await pool.execute(
        'SELECT * FROM feedbacks WHERE stall = ? ORDER BY timestamp DESC',
        [stallName]
    );

    res.status(200).json({
        success: true,
        count: rows.length,
        data: rows
    });
});

// @desc    Get feedbacks by item
// @route   GET /api/feedbacks/item/:itemName
// @access  Public
const getFeedbacksByItem = asyncHandler(async (req, res, next) => {
    const { itemName } = req.params;

    const [rows] = await pool.execute(
        'SELECT * FROM feedbacks WHERE item = ? ORDER BY timestamp DESC',
        [itemName]
    );

    res.status(200).json({
        success: true,
        count: rows.length,
        data: rows
    });
});

// @desc    Get average rating for a stall
// @route   GET /api/feedbacks/stall/:stallName/average
// @access  Public
const getStallAverageRating = asyncHandler(async (req, res, next) => {
    const { stallName } = req.params;

    const [rows] = await pool.execute(
        'SELECT AVG(rating) as averageRating, COUNT(*) as totalFeedbacks FROM feedbacks WHERE stall = ?',
        [stallName]
    );

    const result = rows[0];

    res.status(200).json({
        success: true,
        data: {
            stall: stallName,
            averageRating: result.averageRating ? parseFloat(result.averageRating.toFixed(2)) : null,
            totalFeedbacks: result.totalFeedbacks
        }
    });
});

// @desc    Create new feedback
// @route   POST /api/feedbacks
// @access  Authenticated users
const createFeedback = asyncHandler(async (req, res, next) => {
    const { stall, item, rating, comments, userId } = req.body;

    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let stallId = null;
    let menuItemId = null;

    try {
        const [stalls] = await pool.execute('SELECT id FROM stalls WHERE stallName = ?', [stall]);
        stallId = stalls.length > 0 ? stalls[0].id : null;
        if (stallId && item && item !== 'General') {
            const [menuItems] = await pool.execute(
                'SELECT id FROM menu WHERE name = ? AND stallId = ? LIMIT 1',
                [item, stallId]
            );
            menuItemId = menuItems.length > 0 ? menuItems[0].id : null;
        }
    } catch (error) {
        // If lookup fails, continue with fallback insert
    }

    let result;
    try {
        [result] = await pool.execute(
            'INSERT INTO feedbacks (userId, stallId, menuItemId, rating, comments, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
            [userId || null, stallId, menuItemId, rating, comments, timestamp]
        );
    } catch (error) {
        if (error && error.code === 'ER_BAD_FIELD_ERROR') {
            [result] = await pool.execute(
                'INSERT INTO feedbacks (timestamp, stall, item, rating, comments) VALUES (?, ?, ?, ?, ?)',
                [timestamp, stall, item, rating, comments]
            );
        } else {
            throw error;
        }
    }

    res.status(201).json({
        success: true,
        data: {
            id: result?.insertId || null,
            timestamp,
            stall,
            item,
            rating,
            comments
        }
    });
});

// @desc    Delete feedback
// @route   DELETE /api/feedbacks/:id
// @access  Admin
const deleteFeedback = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id FROM feedbacks WHERE id = ?', [id]);

    if (existing.length === 0) {
        return next(new AppError(`Feedback not found with id: ${id}`, 404));
    }

    await pool.execute('DELETE FROM feedbacks WHERE id = ?', [id]);

    res.status(200).json({
        success: true,
        message: 'Feedback deleted successfully'
    });
});

module.exports = {
    getAllFeedbacks,
    getFeedbacksByStall,
    getFeedbacksByItem,
    getStallAverageRating,
    createFeedback,
    deleteFeedback
};
