/**
 * Async handler wrapper to catch errors in async route handlers
 * Eliminates the need for try-catch blocks in every route
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
