const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getCoupons,
    createCoupon,
    toggleCouponStatus,
    deleteCoupon,
    validateCoupon
} = require('../controllers/couponController');

router.post('/validate', protect, validateCoupon);

router.get('/', protect, authorize('admin'), getCoupons);
router.post('/', protect, authorize('admin'), createCoupon);
router.put('/:id/toggle', protect, authorize('admin'), toggleCouponStatus);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

module.exports = router;
