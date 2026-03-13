const express = require('express');
const router = express.Router();
const {
    getAllMenuItems,
    getMenuByStall,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem
} = require('../controllers/menuController');
const {
    validateMenuItem,
    validateId,
    validateNumericId
} = require('../middleware/validation');

// @route   GET /api/menu
router.get('/', getAllMenuItems);

// @route   GET /api/menu/stall/:stallId
router.get('/stall/:stallId', validateNumericId('stallId'), getMenuByStall);

// @route   GET /api/menu/:id
router.get('/:id', validateId('id'), getMenuItemById);

// @route   POST /api/menu
router.post('/', validateMenuItem, createMenuItem);

// @route   PUT /api/menu/:id
router.put('/:id', validateId('id'), validateMenuItem, updateMenuItem);

// @route   DELETE /api/menu/:id
router.delete('/:id', validateId('id'), deleteMenuItem);

module.exports = router;
