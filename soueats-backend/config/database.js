const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'soueats',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    connection.release();
    return true;
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    return false;
  }
}

// Graceful shutdown
async function closePool() {
  try {
    await pool.end();
    console.log('🔌 Database connection pool closed');
  } catch (err) {
    console.error('❌ Error closing pool:', err.message);
  }
}

module.exports = {
  pool,
  testConnection,
  closePool
};
