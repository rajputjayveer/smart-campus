// Admin routes for shopkeeper approval and management
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Shopkeeper management
router.get('/pending-shopkeepers', adminController.getPendingShopkeepers);
router.put('/approve-shopkeeper/:id', adminController.approveShopkeeper);
router.get('/shopkeepers', adminController.getAllShopkeepers);
router.put('/shopkeeper/:id/toggle-status', adminController.toggleShopkeeperStatus);

// Available stalls
router.get('/available-stalls', adminController.getAvailableStalls);

module.exports = router;
