const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const asyncHandler = require('./asyncHandler');

/**
 * Authentication middleware
 * Protects routes that require authentication
 */
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('Not authorized to access this route', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Add user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        return next(new AppError('Not authorized to access this route', 401));
    }
});

/**
 * Role-based authorization middleware
 * Restricts access to specific roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Not authenticated', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError(`Role '${req.user.role}' is not authorized to access this route`, 403));
        }

        next();
    };
};

module.exports = {
    protect,
    authorize
};
