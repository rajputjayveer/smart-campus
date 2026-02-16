/**
 * Search Controller
 * Handles search functionality for stalls and menu items
 */

const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Search stalls and menu items
 * GET /api/search?q=query&type=all|stalls|menu
 */
const search = asyncHandler(async (req, res) => {
    const { q, type = 'all' } = req.query;

    if (!q || q.trim().length < 2) {
        return res.status(400).json({
            success: false,
            error: 'Search query must be at least 2 characters'
        });
    }

    const searchTerm = `%${q.trim()}%`;
    const results = {
        stalls: [],
        menu: []
    };

    try {
        // Search stalls
        if (type === 'all' || type === 'stalls') {
            const [stalls] = await pool.execute(
                `SELECT id, stallName, description, specialty, rating, image 
                 FROM stalls 
                 WHERE stallName LIKE ? 
                    OR description LIKE ? 
                    OR specialty LIKE ?
                 ORDER BY 
                    CASE 
                        WHEN stallName LIKE ? THEN 1
                        WHEN specialty LIKE ? THEN 2
                        ELSE 3
                    END,
                    rating DESC
                 LIMIT 20`,
                [searchTerm, searchTerm, searchTerm, `%${q.trim()}%`, `%${q.trim()}%`]
            );
            results.stalls = stalls;
        }

        // Search menu items
        if (type === 'all' || type === 'menu') {
            const [menuItems] = await pool.execute(
                `SELECT m.id, m.name, m.price, m.description, m.image, m.popular, 
                        m.stallId, s.stallName
                 FROM menu m
                 JOIN stalls s ON m.stallId = s.id
                 WHERE m.name LIKE ? 
                    OR m.description LIKE ?
                 ORDER BY 
                    CASE 
                        WHEN m.name LIKE ? THEN 1
                        ELSE 2
                    END,
                    m.popular DESC,
                    m.price ASC
                 LIMIT 30`,
                [searchTerm, searchTerm, `%${q.trim()}%`]
            );
            results.menu = menuItems;
        }

        res.json({
            success: true,
            query: q,
            type,
            results,
            counts: {
                stalls: results.stalls.length,
                menu: results.menu.length,
                total: results.stalls.length + results.menu.length
            }
        });
    } catch (error) {
        throw new AppError('Search failed', 500);
    }
});

/**
 * Get popular searches
 * GET /api/search/popular
 */
const getPopularSearches = asyncHandler(async (req, res) => {
    // This could be enhanced with a search_logs table
    // For now, return popular items and stalls
    try {
        const [popularItems] = await pool.execute(
            `SELECT name FROM menu WHERE popular = 1 LIMIT 10`
        );
        
        const [popularStalls] = await pool.execute(
            `SELECT stallName FROM stalls ORDER BY rating DESC LIMIT 5`
        );

        res.json({
            success: true,
            popular: {
                items: popularItems.map(item => item.name),
                stalls: popularStalls.map(stall => stall.stallName)
            }
        });
    } catch (error) {
        throw new AppError('Failed to fetch popular searches', 500);
    }
});

/**
 * Get search suggestions (autocomplete)
 * GET /api/search/suggestions?q=query
 */
const getSuggestions = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
        return res.json({
            success: true,
            suggestions: []
        });
    }

    const searchTerm = `%${q.trim()}%`;

    try {
        // Get menu item suggestions
        const [menuItems] = await pool.execute(
            `SELECT DISTINCT name FROM menu 
             WHERE name LIKE ? 
             ORDER BY popular DESC, name ASC
             LIMIT 10`,
            [searchTerm]
        );

        // Get stall suggestions
        const [stalls] = await pool.execute(
            `SELECT DISTINCT stallName as name FROM stalls 
             WHERE stallName LIKE ? 
             ORDER BY rating DESC
             LIMIT 5`,
            [searchTerm]
        );

        const suggestions = [
            ...menuItems.map(item => ({ type: 'menu', name: item.name })),
            ...stalls.map(stall => ({ type: 'stall', name: stall.name }))
        ];

        res.json({
            success: true,
            suggestions: suggestions.slice(0, 10)
        });
    } catch (error) {
        throw new AppError('Failed to fetch suggestions', 500);
    }
});

module.exports = {
    search,
    getPopularSearches,
    getSuggestions
};
