/**
 * Rate Limiting Middleware
 * Prevents abuse and brute force attacks
 */

const rateLimitStore = new Map();

// Clean up old entries every 15 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.resetTime > 0) {
            rateLimitStore.delete(key);
        }
    }
}, 15 * 60 * 1000);

/**
 * Create a rate limiter middleware
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.maxRequests - Maximum requests per window (default: 100)
 * @param {string} options.message - Error message (default: 'Too many requests')
 * @param {Function} options.keyGenerator - Function to generate unique key (default: uses IP)
 */
const rateLimiter = (options = {}) => {
    const {
        windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message = 'Too many requests, please try again later',
        keyGenerator = (req) => req.ip || req.connection.remoteAddress
    } = options;

    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();
        const record = rateLimitStore.get(key);

        if (!record || now > record.resetTime) {
            // Create new record or reset expired one
            rateLimitStore.set(key, {
                count: 1,
                resetTime: now + windowMs,
                firstRequest: now
            });
            return next();
        }

        // Increment count
        record.count++;

        // Check if limit exceeded
        if (record.count > maxRequests) {
            const retryAfter = Math.ceil((record.resetTime - now) / 1000);
            return res.status(429).json({
                success: false,
                error: message,
                retryAfter,
                resetTime: new Date(record.resetTime).toISOString()
            });
        }

        // Add rate limit headers
        res.set({
            'X-RateLimit-Limit': maxRequests,
            'X-RateLimit-Remaining': Math.max(0, maxRequests - record.count),
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
        });

        next();
    };
};

// Specific rate limiters for different endpoints
const loginRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50, // 50 login attempts per 15 minutes
    message: 'Too many login attempts, please try again after 15 minutes'
});

const orderRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 10 orders per minute
    message: 'Too many orders, please slow down'
});

const apiRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10000, // 10000 requests per 15 minutes (increased for development)
    message: 'API rate limit exceeded'
});

module.exports = {
    rateLimiter,
    loginRateLimiter,
    orderRateLimiter,
    apiRateLimiter
};
