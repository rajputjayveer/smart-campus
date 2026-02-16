const express = require('express');
const router = express.Router();
const {
    getAllFeedbacks,
    getFeedbacksByStall,
    getFeedbacksByItem,
    getStallAverageRating,
    createFeedback,
    deleteFeedback
} = require('../controllers/feedbackController');
const {
    validateFeedback,
    validateNumericId
} = require('../middleware/validation');

// @route   GET /api/feedbacks
router.get('/', getAllFeedbacks);

// @route   GET /api/feedbacks/stall/:stallName
router.get('/stall/:stallName', getFeedbacksByStall);

// @route   GET /api/feedbacks/stall/:stallName/average
router.get('/stall/:stallName/average', getStallAverageRating);

// @route   GET /api/feedbacks/item/:itemName
router.get('/item/:itemName', getFeedbacksByItem);

// @route   POST /api/feedbacks
router.post('/', validateFeedback, createFeedback);

// @route   DELETE /api/feedbacks/:id
router.delete('/:id', validateNumericId('id'), deleteFeedback);

module.exports = router;
