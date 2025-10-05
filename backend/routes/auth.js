/**
 * Authentication Routes
 * Handles user registration, login, password reset, and device activation
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Database connection (assuming PostgreSQL pool from parent)
let pool;

// Initialize with database pool
router.initializePool = (dbPool) => {
    pool = dbPool;
};

// JWT secret (should be in environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'heartwise-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate JWT access token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id, 
            email: user.email,
            subscriptionTier: user.subscription_tier 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Verify password
 */
const verifyPassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

/**
 * Generate random activation code
 */
const generateActivationCode = () => {
    // Format: HW-XXXX-XXXX-XXXX (HeartWise prefix)
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part3 = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `HW-${part1}-${part2}-${part3}`;
};

/**
 * Log audit action
 */
const logAudit = async (userId, action, resourceType, resourceId, ipAddress, userAgent, success, details = null) => {
    try {
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, success, details)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, action, resourceType, resourceId, ipAddress, userAgent, success, details ? JSON.stringify(details) : null]
        );
    } catch (err) {
        console.error('Audit log error:', err);
    }
};

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Verify JWT token middleware
 */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if user still exists and is active
        const userResult = await pool.query(
            'SELECT id, email, subscription_tier, subscription_status, activated FROM users WHERE id = $1 AND deleted_at IS NULL',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'User not found or account deleted' });
        }

        if (!userResult.rows[0].activated) {
            return res.status(403).json({ error: 'Account not activated. Please activate your device first.' });
        }

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            subscriptionTier: decoded.subscriptionTier,
            ...userResult.rows[0]
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};

/**
 * Check subscription tier middleware
 */
const checkSubscriptionTier = (requiredTier) => {
    const tierHierarchy = { basic: 1, pro: 2, premium: 3 };
    
    return (req, res, next) => {
        const userTier = req.user.subscriptionTier || 'basic';
        
        if (tierHierarchy[userTier] < tierHierarchy[requiredTier]) {
            return res.status(403).json({ 
                error: `This feature requires ${requiredTier} subscription or higher`,
                currentTier: userTier,
                requiredTier
            });
        }
        next();
    };
};

// ============================================
// REGISTRATION ROUTES
// ============================================

/**
 * POST /auth/register
 * Register new user with device activation code
 */
router.post('/register', async (req, res) => {
    const { email, password, activationCode } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Validation
    if (!email || !password || !activationCode) {
        return res.status(400).json({ error: 'Email, password, and activation code are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Check if email already exists
        const existingUser = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Verify activation code exists and is not used
        const deviceResult = await client.query(
            'SELECT id, device_id, activated FROM devices WHERE activation_code = $1',
            [activationCode.toUpperCase()]
        );

        if (deviceResult.rows.length === 0) {
            await client.query('ROLLBACK');
            await logAudit(null, 'registration_failed', 'user', null, ipAddress, userAgent, false, { reason: 'invalid_activation_code' });
            return res.status(400).json({ error: 'Invalid activation code' });
        }

        if (deviceResult.rows[0].activated) {
            await client.query('ROLLBACK');
            await logAudit(null, 'registration_failed', 'user', null, ipAddress, userAgent, false, { reason: 'activation_code_already_used' });
            return res.status(400).json({ error: 'Activation code already used' });
        }

        const device = deviceResult.rows[0];

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user with activated=true and lifetime access (no subscription fees)
        const userResult = await client.query(
            `INSERT INTO users (email, password_hash, activation_code, activated, subscription_tier, subscription_status, subscription_start_date)
             VALUES ($1, $2, $3, TRUE, 'lifetime', 'active', CURRENT_TIMESTAMP)
             RETURNING id, email, subscription_tier, subscription_status, created_at`,
            [email.toLowerCase(), passwordHash, activationCode.toUpperCase()]
        );

        const newUser = userResult.rows[0];

        // Activate device and link to user
        await client.query(
            `UPDATE devices 
             SET user_id = $1, activated = TRUE, activation_date = CURRENT_TIMESTAMP, is_active = TRUE
             WHERE id = $2`,
            [newUser.id, device.id]
        );

        // Log device activation in history
        await client.query(
            `INSERT INTO device_history (device_id, user_id, action, notes)
             VALUES ($1, $2, 'activated', 'Device activated during user registration')`,
            [device.id, newUser.id]
        );

        await client.query('COMMIT');

        // Generate tokens
        const accessToken = generateAccessToken(newUser);
        const refreshToken = generateRefreshToken();

        // Store refresh token
        await pool.query(
            `INSERT INTO session_tokens (user_id, token, expires_at, device_info)
             VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '${REFRESH_TOKEN_EXPIRES_IN}', $3)`,
            [newUser.id, refreshToken, JSON.stringify({ ip: ipAddress, userAgent })]
        );

        // Log successful registration
        await logAudit(newUser.id, 'registration_success', 'user', newUser.id, ipAddress, userAgent, true);

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: newUser.id,
                email: newUser.email,
                subscriptionTier: newUser.subscription_tier,
                subscriptionStatus: newUser.subscription_status,
                createdAt: newUser.created_at
            },
            deviceActivated: true,
            deviceId: device.device_id,
            accessToken,
            refreshToken,
            nextStep: 'complete_profile'
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Registration error:', err);
        await logAudit(null, 'registration_failed', 'user', null, ipAddress, userAgent, false, { error: err.message });
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    } finally {
        client.release();
    }
});

/**
 * POST /auth/login
 * User login
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Get user
        const userResult = await pool.query(
            `SELECT id, email, password_hash, subscription_tier, subscription_status, activated, 
                    failed_login_attempts, account_locked_until
             FROM users 
             WHERE email = $1 AND deleted_at IS NULL`,
            [email.toLowerCase()]
        );

        if (userResult.rows.length === 0) {
            await logAudit(null, 'login_failed', 'user', null, ipAddress, userAgent, false, { reason: 'user_not_found', email });
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = userResult.rows[0];

        // Check if account is locked
        if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.account_locked_until) - new Date()) / 60000);
            await logAudit(user.id, 'login_failed', 'user', user.id, ipAddress, userAgent, false, { reason: 'account_locked' });
            return res.status(403).json({ 
                error: `Account temporarily locked. Try again in ${minutesLeft} minutes.`,
                lockedUntil: user.account_locked_until
            });
        }

        // Verify password
        const passwordValid = await verifyPassword(password, user.password_hash);

        if (!passwordValid) {
            // Increment failed attempts
            const failedAttempts = user.failed_login_attempts + 1;
            const lockAccount = failedAttempts >= 5;

            await pool.query(
                `UPDATE users 
                 SET failed_login_attempts = $1,
                     account_locked_until = CASE WHEN $2 THEN CURRENT_TIMESTAMP + INTERVAL '30 minutes' ELSE NULL END
                 WHERE id = $3`,
                [failedAttempts, lockAccount, user.id]
            );

            await logAudit(user.id, 'login_failed', 'user', user.id, ipAddress, userAgent, false, { 
                reason: 'invalid_password',
                failedAttempts,
                accountLocked: lockAccount
            });

            return res.status(401).json({ 
                error: 'Invalid email or password',
                attemptsLeft: lockAccount ? 0 : 5 - failedAttempts
            });
        }

        // Check if activated
        if (!user.activated) {
            await logAudit(user.id, 'login_failed', 'user', user.id, ipAddress, userAgent, false, { reason: 'not_activated' });
            return res.status(403).json({ 
                error: 'Account not activated. Please activate your device first.',
                code: 'NOT_ACTIVATED'
            });
        }

        // Reset failed attempts and update last login
        await pool.query(
            `UPDATE users 
             SET failed_login_attempts = 0, 
                 account_locked_until = NULL, 
                 last_login = CURRENT_TIMESTAMP,
                 last_ip_address = $1
             WHERE id = $2`,
            [ipAddress, user.id]
        );

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();

        // Store refresh token
        await pool.query(
            `INSERT INTO session_tokens (user_id, token, expires_at, device_info)
             VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '${REFRESH_TOKEN_EXPIRES_IN}', $3)`,
            [user.id, refreshToken, JSON.stringify({ ip: ipAddress, userAgent })]
        );

        // Get user profile if exists
        const profileResult = await pool.query(
            'SELECT first_name, last_name, profile_photo_url FROM user_profiles WHERE user_id = $1',
            [user.id]
        );

        const hasProfile = profileResult.rows.length > 0;

        await logAudit(user.id, 'login_success', 'user', user.id, ipAddress, userAgent, true);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                subscriptionTier: user.subscription_tier,
                subscriptionStatus: user.subscription_status,
                hasProfile,
                profile: hasProfile ? profileResult.rows[0] : null
            },
            accessToken,
            refreshToken
        });

    } catch (err) {
        console.error('Login error:', err);
        await logAudit(null, 'login_failed', 'user', null, ipAddress, userAgent, false, { error: err.message });
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
    }

    try {
        // Verify refresh token exists and not expired/revoked
        const tokenResult = await pool.query(
            `SELECT st.user_id, u.email, u.subscription_tier, u.activated
             FROM session_tokens st
             JOIN users u ON st.user_id = u.id
             WHERE st.token = $1 
               AND st.expires_at > CURRENT_TIMESTAMP 
               AND st.revoked = FALSE
               AND u.deleted_at IS NULL`,
            [refreshToken]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const { user_id, email, subscription_tier, activated } = tokenResult.rows[0];

        if (!activated) {
            return res.status(403).json({ error: 'Account not activated' });
        }

        // Generate new access token
        const accessToken = generateAccessToken({ id: user_id, email, subscription_tier });

        // Optionally generate new refresh token (token rotation)
        const newRefreshToken = generateRefreshToken();

        // Revoke old refresh token and create new one
        await pool.query('UPDATE session_tokens SET revoked = TRUE WHERE token = $1', [refreshToken]);
        
        await pool.query(
            `INSERT INTO session_tokens (user_id, token, expires_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '${REFRESH_TOKEN_EXPIRES_IN}')`,
            [user_id, newRefreshToken]
        );

        res.json({
            accessToken,
            refreshToken: newRefreshToken
        });

    } catch (err) {
        console.error('Refresh token error:', err);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

/**
 * POST /auth/logout
 * Logout user (revoke refresh token)
 */
router.post('/logout', authenticateToken, async (req, res) => {
    const { refreshToken } = req.body;

    try {
        if (refreshToken) {
            await pool.query(
                'UPDATE session_tokens SET revoked = TRUE, revoked_at = CURRENT_TIMESTAMP WHERE token = $1',
                [refreshToken]
            );
        }

        await logAudit(req.user.userId, 'logout', 'user', req.user.userId, req.ip, req.get('User-Agent'), true);

        res.json({ message: 'Logout successful' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Logout failed' });
    }
});

/**
 * POST /auth/request-password-reset
 * Request password reset email
 */
router.post('/request-password-reset', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }

    try {
        const userResult = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
            [email.toLowerCase()]
        );

        // Always return success even if email doesn't exist (security best practice)
        if (userResult.rows.length === 0) {
            return res.json({ 
                message: 'If an account with that email exists, a password reset link has been sent.' 
            });
        }

        const userId = userResult.rows[0].id;

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Store reset token
        await pool.query(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [userId, resetToken, expiresAt]
        );

        // TODO: Send email with reset link
        // const resetLink = `https://yourdomain.com/reset-password?token=${resetToken}`;
        // await sendEmail(email, 'Password Reset', `Click here to reset: ${resetLink}`);

        console.log(`Password reset token for ${email}: ${resetToken}`);

        await logAudit(userId, 'password_reset_requested', 'user', userId, req.ip, req.get('User-Agent'), true);

        res.json({ 
            message: 'If an account with that email exists, a password reset link has been sent.',
            // DEV ONLY - Remove in production:
            resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        });

    } catch (err) {
        console.error('Password reset request error:', err);
        res.status(500).json({ error: 'Password reset request failed' });
    }
});

/**
 * POST /auth/reset-password
 * Reset password using token
 */
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password required' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    try {
        // Verify token
        const tokenResult = await pool.query(
            `SELECT user_id FROM password_reset_tokens 
             WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND used = FALSE`,
            [token]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const userId = tokenResult.rows[0].user_id;

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update password
        await pool.query(
            'UPDATE users SET password_hash = $1, last_password_change = CURRENT_TIMESTAMP WHERE id = $2',
            [passwordHash, userId]
        );

        // Mark token as used
        await pool.query(
            'UPDATE password_reset_tokens SET used = TRUE, used_at = CURRENT_TIMESTAMP WHERE token = $1',
            [token]
        );

        // Revoke all existing sessions for security
        await pool.query(
            'UPDATE session_tokens SET revoked = TRUE WHERE user_id = $1',
            [userId]
        );

        await logAudit(userId, 'password_reset_completed', 'user', userId, req.ip, req.get('User-Agent'), true);

        res.json({ message: 'Password reset successful. Please login with your new password.' });

    } catch (err) {
        console.error('Password reset error:', err);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userResult = await pool.query(
            `SELECT u.id, u.email, u.subscription_tier, u.subscription_status, u.subscription_end_date,
                    u.activated, u.created_at, u.last_login,
                    up.first_name, up.last_name, up.date_of_birth, up.gender, up.phone, 
                    up.profile_photo_url, up.timezone, up.language
             FROM users u
             LEFT JOIN user_profiles up ON u.id = up.user_id
             WHERE u.id = $1`,
            [req.user.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(userResult.rows[0]);
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Failed to get user information' });
    }
});

// Export router and middleware
module.exports = {
    router,
    authenticateToken,
    checkSubscriptionTier
};
