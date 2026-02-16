const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection, closePool } = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const { securityHeaders, sanitizeInput } = require('./middleware/security');
const { apiRateLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const stallRoutes = require('./routes/stallRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const searchRoutes = require('./routes/searchRoutes');
const aiRoutes = require('./routes/aiRoutes');
const couponRoutes = require('./routes/couponRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// ========== Middleware ==========
// Disable ETag to prevent 304 responses for API data
app.set('etag', false);

// Security headers (apply first)
app.use(securityHeaders);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Logging
app.use(logger);

// Rate limiting - Only in production, or disabled for development
// Uncomment the line below to enable rate limiting in production
// if (process.env.NODE_ENV === 'production') {
//     app.use('/api', apiRateLimiter);
// }

// ========== Routes ==========
// Disable caching for all API responses (always fetch fresh data)
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/stalls', stallRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/coupons', couponRoutes);

// Admin routes (requires admin role)
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// ========== Error Handling ==========
app.use(notFound);
app.use(errorHandler);

// ========== Server Initialization ==========
let server;

async function startServer() {
  try {
    // Test database connection
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start server
    server = app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════╗');
      console.log('║      🍽️  SouEats API Server             ║');
      console.log('╠══════════════════════════════════════════╣');
      console.log(`║  Environment: ${process.env.NODE_ENV || 'development'}`.padEnd(43) + '║');
      console.log(`║  Port: ${PORT}`.padEnd(43) + '║');
      console.log(`║  Health: http://localhost:${PORT}/health`.padEnd(43) + '║');
      console.log('╚══════════════════════════════════════════╝');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// ========== Graceful Shutdown ==========
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('\n🛑 Received shutdown signal. Closing server...');

  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed');
      await closePool();
      console.log('👋 Server shutdown complete');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⏰ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    await closePool();
    process.exit(0);
  }
}

// Start the server
startServer();

module.exports = app;
