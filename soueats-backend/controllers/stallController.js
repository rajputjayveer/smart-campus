const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Stall Controller
 * Handles all stall-related requests
 */

// @desc    Get all stalls
// @route   GET /api/stalls
// @access  Public
const getAllStalls = asyncHandler(async (req, res, next) => {
    const [rows] = await pool.execute('SELECT * FROM stalls ORDER BY rating DESC');

    res.status(200).json({
        success: true,
        count: rows.length,
        data: rows
    });
});

// @desc    Get single stall by ID
// @route   GET /api/stalls/:id
// @access  Public
const getStallById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const [rows] = await pool.execute('SELECT * FROM stalls WHERE id = ?', [id]);

    if (rows.length === 0) {
        return next(new AppError(`Stall not found with id: ${id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: rows[0]
    });
});

// @desc    Create new stall
// @route   POST /api/stalls
// @access  Admin
const createStall = asyncHandler(async (req, res, next) => {
    const { stallName, description, rating, specialty, image } = req.body;

    // Check if stall name already exists
    const [existing] = await pool.execute(
        'SELECT id FROM stalls WHERE stallName = ?',
        [stallName]
    );

    if (existing.length > 0) {
        return next(new AppError(`Stall with name '${stallName}' already exists`, 400));
    }

    const [result] = await pool.execute(
        'INSERT INTO stalls (stallName, description, rating, specialty, image) VALUES (?, ?, ?, ?, ?)',
        [stallName, description, rating || 0, specialty, image || null]
    );

    res.status(201).json({
        success: true,
        data: {
            id: result.insertId,
            stallName,
            description,
            rating: rating || 0,
            specialty,
            image
        }
    });
});

// @desc    Update stall
// @route   PUT /api/stalls/:id
// @access  Admin
const updateStall = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { stallName, description, rating, specialty, image } = req.body;

    // Check if stall exists
    const [existing] = await pool.execute('SELECT id FROM stalls WHERE id = ?', [id]);

    if (existing.length === 0) {
        return next(new AppError(`Stall not found with id: ${id}`, 404));
    }

    await pool.execute(
        'UPDATE stalls SET stallName = ?, description = ?, rating = ?, specialty = ?, image = ? WHERE id = ?',
        [stallName, description, rating, specialty, image || null, id]
    );

    res.status(200).json({
        success: true,
        data: {
            id,
            stallName,
            description,
            rating,
            specialty,
            image
        }
    });
});

// @desc    Delete stall
// @route   DELETE /api/stalls/:id
// @access  Admin
const deleteStall = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // Check if stall exists
    const [existing] = await pool.execute('SELECT id FROM stalls WHERE id = ?', [id]);

    if (existing.length === 0) {
        return next(new AppError(`Stall not found with id: ${id}`, 404));
    }

    // Delete associated menu items first (cascade)
    await pool.execute('DELETE FROM menu WHERE stallId = ?', [id]);

    // Delete stall
    await pool.execute('DELETE FROM stalls WHERE id = ?', [id]);

    res.status(200).json({
        success: true,
        message: 'Stall and associated menu items deleted successfully'
    });
});

module.exports = {
    getAllStalls,
    getStallById,
    createStall,
    updateStall,
    deleteStall
};
