const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * User/Auth Controller
 * Handles authentication and user management
 */

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
    const { name, email, password, department, phone, role, stallId } = req.body;

    // Check if user exists
    const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
    );

    if (existing.length > 0) {
        return next(new AppError('User with this email already exists', 400));
    }

    // Validate role
    const userRole = role || 'customer';
    if (!['customer', 'shopkeeper'].includes(userRole)) {
        return next(new AppError('Invalid role. Must be customer or shopkeeper', 400));
    }

    // If shopkeeper, validate stall selection
    if (userRole === 'shopkeeper') {
        if (!stallId) {
            return next(new AppError('Please select a stall for shopkeeper registration', 400));
        }

        // Check if stall already has an active shopkeeper
        const [existingShopkeepers] = await pool.execute(
            'SELECT id FROM users WHERE stallId = ? AND role = "shopkeeper" AND isActive = 1',
            [stallId]
        );

        if (existingShopkeepers.length > 0) {
            return next(new AppError('This stall already has a shopkeeper. Please choose another stall.', 400));
        }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const isApproved = userRole === 'customer' ? 1 : 0; // Auto-approve customers, shopkeepers need approval

    await pool.execute(
        'INSERT INTO users (id, name, email, password, role, department, phone, stallId, isApproved, isShopkeeper) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, name, email, hashedPassword, userRole, department || null, phone || null, stallId || null, isApproved, userRole === 'shopkeeper' ? 1 : 0]
    );

    // If customer, generate token and auto-login
    if (userRole === 'customer') {
        const token = jwt.sign(
            { id: userId, email, role: userRole },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            success: true,
            data: {
                id: userId,
                name,
                email,
                role: userRole,
                department,
                token
            }
        });
    }

    // If shopkeeper, return pending status (no token)
    res.status(201).json({
        success: true,
        message: 'Registration successful! Your account is pending admin approval. You will be notified once approved.',
        data: {
            id: userId,
            name,
            email,
            role: userRole,
            stallId,
            isApproved: false,
            requiresApproval: true
        }
    });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // Get user
    const [users] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );

    if (users.length === 0) {
        return next(new AppError('Invalid credentials', 401));
    }

    const user = users[0];

    // Check if account is active
    if (!user.isActive) {
        return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return next(new AppError('Invalid credentials', 401));
    }

    // Check if shopkeeper is approved
    if (user.role === 'shopkeeper' && user.isApproved === 0) {
        return next(new AppError('Your account is pending admin approval. Please check back later.', 403));
    }

    // Generate token
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
    );

    res.status(200).json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            stallId: user.stallId,
            department: user.department,
            token
        }
    });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
    const [users] = await pool.execute(
        'SELECT id, name, email, role, stallId, department, phone, createdAt FROM users WHERE id = ?',
        [req.user.id]
    );

    if (users.length === 0) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json({
        success: true,
        data: users[0]
    });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
    const { name, department, phone } = req.body;

    await pool.execute(
        'UPDATE users SET name = ?, department = ?, phone = ? WHERE id = ?',
        [name, department || null, phone || null, req.user.id]
    );

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully'
    });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new AppError('Please provide current and new password', 400));
    }

    // Get user
    const [users] = await pool.execute(
        'SELECT password FROM users WHERE id = ?',
        [req.user.id]
    );

    const user = users[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
        return next(new AppError('Current password is incorrect', 401));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, req.user.id]
    );

    res.status(200).json({
        success: true,
        message: 'Password changed successfully'
    });
});

// @desc    Forgot password - send reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('Please provide email address', 400));
    }

    const [users] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );

    const user = users[0];

    // Always return success (don't reveal if email exists - security)
    if (!user) {
        return res.json({
            success: true,
            message: 'If your email is registered, you will receive a password reset link.'
        });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await pool.execute(
        'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?',
        [resetToken, resetTokenExpiry, user.id]
    );

    // In production, send email here
    // For development, log token to console
    console.log('\n🔑 Password Reset Token for', user.email, ':', resetToken);
    console.log(`🔗 Reset URL: http://localhost:5173/reset-password?token=${resetToken}\n`);

    res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link.',
        // Only for development - remove in production
        devToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
});

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return next(new AppError('Please provide reset token and new password', 400));
    }

    if (newPassword.length < 6) {
        return next(new AppError('Password must be at least 6 characters long', 400));
    }

    const [users] = await pool.execute(
        'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()',
        [token]
    );

    const user = users[0];

    if (!user) {
        return next(new AppError('Invalid or expired reset token', 400));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await pool.execute(
        'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
        [hashedPassword, user.id]
    );

    res.json({
        success: true,
        message: 'Password reset successful. Please login with your new password.'
    });
});

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword
};
