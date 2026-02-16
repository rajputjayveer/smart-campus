/**
 * Security Middleware
 * Adds security headers and protections
 */

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Strict Transport Security (HTTPS only in production)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Content Security Policy
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.razorpay.com https://generativelanguage.googleapis.com;"
    );
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
};

/**
 * Input sanitization middleware
 * Removes potentially dangerous characters from user input
 */
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            // Remove script tags and dangerous HTML
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
        }
        
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }
        
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                sanitized[key] = sanitize(obj[key]);
            }
            return sanitized;
        }
        
        return obj;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }
    
    if (req.query) {
        req.query = sanitize(req.query);
    }
    
    if (req.params) {
        req.params = sanitize(req.params);
    }

    next();
};

/**
 * Request size limiter
 */
const requestSizeLimiter = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = req.get('content-length');
        
        if (contentLength) {
            const sizeInMB = parseInt(contentLength) / (1024 * 1024);
            const maxSizeInMB = parseFloat(maxSize);
            
            if (sizeInMB > maxSizeInMB) {
                return res.status(413).json({
                    success: false,
                    error: `Request too large. Maximum size is ${maxSize}`
                });
            }
        }
        
        next();
    };
};

/**
 * IP whitelist middleware (optional, for admin routes)
 */
const ipWhitelist = (allowedIPs = []) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        
        if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied from this IP address'
            });
        }
        
        next();
    };
};

module.exports = {
    securityHeaders,
    sanitizeInput,
    requestSizeLimiter,
    ipWhitelist
};
