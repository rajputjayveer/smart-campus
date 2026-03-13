const express = require('express');
const { getFeedbackSuggestions, chat, getFeedbackAnalysis, getRecommendations } = require('../controllers/aiController');

const router = express.Router();

router.post('/feedback-suggestions', getFeedbackSuggestions);
router.post('/chat', chat);
router.get('/feedback-analysis', getFeedbackAnalysis);
router.post('/recommendations', getRecommendations);

module.exports = router;
