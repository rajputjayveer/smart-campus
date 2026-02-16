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
    validateUUID,
    validateNumericId
} = require('../middleware/validation');

// @route   GET /api/menu
router.get('/', getAllMenuItems);

// @route   GET /api/menu/stall/:stallId
router.get('/stall/:stallId', validateNumericId('stallId'), getMenuByStall);

// @route   GET /api/menu/:id
router.get('/:id', validateUUID('id'), getMenuItemById);

// @route   POST /api/menu
router.post('/', validateMenuItem, createMenuItem);

// @route   PUT /api/menu/:id
router.put('/:id', validateUUID('id'), validateMenuItem, updateMenuItem);

// @route   DELETE /api/menu/:id
router.delete('/:id', validateUUID('id'), deleteMenuItem);

module.exports = router;
