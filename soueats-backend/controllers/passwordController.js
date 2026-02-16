// Backend: Password Management & Admin Controllers
// Add to existing authController.js

const crypto = require('crypto');

// Forgot Password - generates reset token
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('Email is required', 400));
    }

    const [users] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );

    const user = users[0];

    // Always return success (don't reveal if email exists)
    if (!user) {
        return res.json({
            success: true,
            message: 'If email exists, password reset link has been sent'
        });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
        'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?',
        [resetToken, resetTokenExpiry, user.id]
    );

    // In production, send email here
    // For development, log token to console
    console.log('\n🔑 Password Reset Token:', resetToken);
    console.log(`🔗 Reset URL: http://localhost:5173/reset-password?token=${resetToken}\n`);

    res.json({
        success: true,
        message: 'If email exists, password reset link has been sent',
        // Only for development - remove in production
        devToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
});

// Reset Password - validates token and updates password
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return next(new AppError('Token and new password are required', 400));
    }

    if (newPassword.length < 6) {
        return next(new AppError('Password must be at least 6 characters', 400));
    }

    const [users] = await pool.query(
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
    await pool.query(
        'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
        [hashedPassword, user.id]
    );

    res.json({
        success: true,
        message: 'Password reset successful. Please login with your new password.'
    });
});

// Change Password - for logged-in users
exports.changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!currentPassword || !newPassword) {
        return next(new AppError('Current and new passwords are required', 400));
    }

    if (newPassword.length < 6) {
        return next(new AppError('New password must be at least 6 characters', 400));
    }

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return next(new AppError('Current password is incorrect', 401));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
        'UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?',
        [hashedPassword, userId]
    );

    res.json({
        success: true,
        message: 'Password changed successfully'
    });
});

// Get Current User Profile
exports.getMe = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    const [users] = await pool.query(
        `SELECT id, name, email, role, department, phone, stallId, isActive, createdAt 
     FROM users WHERE id = ?`,
        [userId]
    );

    const user = users[0];

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    res.json({
        success: true,
        data: user
    });
});
