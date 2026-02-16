/**
 * Search Routes
 */

const express = require('express');
const router = express.Router();
const {
    search,
    getPopularSearches,
    getSuggestions
} = require('../controllers/searchController');
// Rate limiting removed for development - uncomment if needed in production
// const { apiRateLimiter } = require('../middleware/rateLimiter');
// router.use(apiRateLimiter);

// Routes
router.get('/', search);
router.get('/popular', getPopularSearches);
router.get('/suggestions', getSuggestions);

module.exports = router;
