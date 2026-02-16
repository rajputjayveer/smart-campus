/**
 * Request logging middleware
 */
const logger = (req, res, next) => {
    const start = Date.now();

    // Log on response finish
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const statusEmoji = statusCode >= 500 ? '❌' : statusCode >= 400 ? '⚠️' : '✅';

        console.log(
            `${statusEmoji} ${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms`
        );
    });

    next();
};

module.exports = logger;
