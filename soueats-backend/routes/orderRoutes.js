const express = require('express');
const router = express.Router();
const {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    updateOrderItemStatus,
    cancelOrder,
    getMyOrders
} = require('../controllers/orderController');
const {
    validateOrder,
    validateOrderStatus,
    validateUUID
} = require('../middleware/validation');
const { protect } = require('../middleware/auth');

// @route   GET /api/orders
router.get('/', getAllOrders);

// @route   GET /api/orders/my-orders
// Allow both authenticated and query parameter approaches
router.get('/my-orders', getMyOrders);

// @route   GET /api/orders/:id
router.get('/:id', validateUUID('id'), getOrderById);

// @route   POST /api/orders
router.post('/', validateOrder, createOrder);

// @route   PUT /api/orders/:id/status
router.put('/:id/status', validateUUID('id'), validateOrderStatus, updateOrderStatus);

// @route   PUT /api/orders/:orderId/items/:itemId
router.put(
    '/:orderId/items/:itemId',
    validateUUID('orderId'),
    validateUUID('itemId'),
    validateOrderStatus,
    updateOrderItemStatus
);

// @route   DELETE /api/orders/:id (Cancel order)
router.delete('/:id', validateUUID('id'), cancelOrder);

module.exports = router;
