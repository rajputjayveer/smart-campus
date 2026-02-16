const express = require('express');
const router = express.Router();
const {
    getAllStalls,
    getStallById,
    createStall,
    updateStall,
    deleteStall
} = require('../controllers/stallController');
const {
    validateStall,
    validateNumericId
} = require('../middleware/validation');

// @route   GET /api/stalls
router.get('/', getAllStalls);

// @route   GET /api/stalls/:id
router.get('/:id', validateNumericId('id'), getStallById);

// @route   POST /api/stalls
router.post('/', validateStall, createStall);

// @route   PUT /api/stalls/:id
router.put('/:id', validateNumericId('id'), validateStall, updateStall);

// @route   DELETE /api/stalls/:id
router.delete('/:id', validateNumericId('id'), deleteStall);

module.exports = router;
