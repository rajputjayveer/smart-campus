/**
 * Centralized error handling middleware
 */

// Custom error class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Not Found handler
const notFound = (req, res, next) => {
    const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode
        });
    } else {
        console.error('❌ Error:', err.message);
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error = new AppError('Resource not found', 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000 || err.code === 'ER_DUP_ENTRY') {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        error = new AppError(`Duplicate ${field} value`, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message);
        error = new AppError(message.join(', '), 400);
    }

    // MySQL errors
    if (err.code?.startsWith('ER_')) {
        switch (err.code) {
            case 'ER_NO_SUCH_TABLE':
                error = new AppError('Database table not found', 500);
                break;
            case 'ER_DUP_ENTRY':
                error = new AppError('Duplicate entry', 400);
                break;
            case 'ER_BAD_NULL_ERROR':
                error = new AppError('Required field is missing', 400);
                break;
            default:
                error = new AppError('Database error', 500);
        }
    }

    // Send error response
    res.status(error.statusCode || err.statusCode || 500).json({
        success: false,
        error: error.message || err.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = {
    AppError,
    notFound,
    errorHandler
};
