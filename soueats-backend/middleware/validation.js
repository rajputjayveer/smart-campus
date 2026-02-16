const { AppError } = require('./errorHandler');

/**
 * Validation middleware functions
 */

// Validate stall input
const validateStall = (req, res, next) => {
    const { stallName, specialty } = req.body;

    if (!stallName || !stallName.trim()) {
        return next(new AppError('Stall name is required', 400));
    }

    if (!specialty || !specialty.trim()) {
        return next(new AppError('Specialty is required', 400));
    }

    if (req.body.rating !== undefined) {
        const rating = parseFloat(req.body.rating);
        if (isNaN(rating) || rating < 0 || rating > 5) {
            return next(new AppError('Rating must be between 0 and 5', 400));
        }
        req.body.rating = rating;
    }

    next();
};

// Validate menu item input
const validateMenuItem = (req, res, next) => {
    const { name, price, stallId } = req.body;

    if (!name || !name.trim()) {
        return next(new AppError('Item name is required', 400));
    }

    if (!price || isNaN(price) || price <= 0) {
        return next(new AppError('Valid price is required', 400));
    }

    if (!stallId) {
        return next(new AppError('Stall ID is required', 400));
    }

    next();
};

// Validate order input
const validateOrder = (req, res, next) => {
    const { user, items, total } = req.body;

    if (!user || !user.id || !user.name) {
        return next(new AppError('Valid user information is required', 400));
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return next(new AppError('Order must contain at least one item', 400));
    }

    if (!total || isNaN(total) || total <= 0) {
        return next(new AppError('Valid total amount is required', 400));
    }

    // Validate each item
    for (const item of items) {
        if (!item.id || !item.name || !item.price || !item.quantity) {
            return next(new AppError('All items must have id, name, price, and quantity', 400));
        }
    }

    next();
};

// Validate feedback input
const validateFeedback = (req, res, next) => {
    const { stall, item, rating, comments } = req.body;

    if (!stall || !stall.trim()) {
        return next(new AppError('Stall name is required', 400));
    }

    if (!item || !item.trim()) {
        return next(new AppError('Item name is required for feedback', 400));
    }

    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
        return next(new AppError('Rating must be between 1 and 5', 400));
    }

    if (!comments || !comments.trim()) {
        return next(new AppError('Comments are required', 400));
    }

    next();
};

// Validate order status update
const validateOrderStatus = (req, res, next) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
        return next(new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400));
    }

    next();
};

// Validate UUID format
const validateUUID = (paramName) => (req, res, next) => {
    const value = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!value || !uuidRegex.test(value)) {
        return next(new AppError(`Invalid ${paramName} format`, 400));
    }

    next();
};

// Validate numeric ID
const validateNumericId = (paramName) => (req, res, next) => {
    const value = req.params[paramName];

    if (!value || isNaN(value) || parseInt(value) <= 0) {
        return next(new AppError(`Invalid ${paramName}`, 400));
    }

    next();
};

module.exports = {
    validateStall,
    validateMenuItem,
    validateOrder,
    validateFeedback,
    validateOrderStatus,
    validateUUID,
    validateNumericId
};
