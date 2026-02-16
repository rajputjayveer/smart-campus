const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getCoupons,
    getMyStallCoupons,
    createCoupon,
    toggleCouponStatus,
    deleteCoupon,
    validateCoupon,
    getAvailableOffers
} = require('../controllers/couponController');

router.post('/validate', protect, validateCoupon);
router.get('/available', getAvailableOffers);
router.get('/my', protect, authorize('shopkeeper'), getMyStallCoupons);

router.get('/', protect, authorize('admin'), getCoupons);
router.post('/', protect, authorize('admin', 'shopkeeper'), createCoupon);
router.put('/:id/toggle', protect, authorize('admin', 'shopkeeper'), toggleCouponStatus);
router.delete('/:id', protect, authorize('admin', 'shopkeeper'), deleteCoupon);

module.exports = router;
