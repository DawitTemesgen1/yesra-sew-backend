const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');

// Helper to generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
    try {
        const { full_name, email, phone_number, password, avatar_url, account_type, company_name, company_role } = req.body;

        // Validation
        if (!full_name || !password) {
            return res.status(400).json({ message: 'Please provide full name and password.' });
        }

        if (!email && !phone_number) {
            return res.status(400).json({ message: 'Please provide either an email or phone number.' });
        }

        // Validate account_type
        const validAccountTypes = ['individual', 'company'];
        const userAccountType = account_type || 'individual';

        if (!validAccountTypes.includes(userAccountType)) {
            return res.status(400).json({ message: 'Invalid account type. Must be "individual" or "company".' });
        }

        // Additional validation for company accounts
        if (userAccountType === 'company') {
            if (!company_name || !company_role) {
                return res.status(400).json({ message: 'Company name and role are required for company accounts.' });
            }
        }

        // Check if user exists
        if (email) {
            const [existingUsers] = await pool.execute(
                'SELECT id FROM users WHERE email = ?',
                [email.toLowerCase().trim()]
            );
            if (existingUsers.length > 0) {
                return res.status(400).json({ message: 'Email already registered.' });
            }
        }

        if (phone_number) {
            const [existingUsers] = await pool.execute(
                'SELECT id FROM users WHERE phone_number = ?',
                [phone_number.trim()]
            );
            if (existingUsers.length > 0) {
                return res.status(400).json({ message: 'Phone number already registered.' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user with account_type and company fields
        const [result] = await pool.execute(
            'INSERT INTO users (full_name, email, phone_number, password, is_phone_verified, avatar_url, account_type, company_name, company_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                full_name.trim(),
                email ? email.toLowerCase().trim() : null,
                phone_number ? phone_number.trim() : null,
                hashedPassword,
                false,
                avatar_url || null,
                userAccountType,
                userAccountType === 'company' ? company_name.trim() : null,
                userAccountType === 'company' ? company_role.trim() : null
            ]
        );

        const userId = result.insertId;

        // Send OTP for both phone and email registrations
        const identifier = email || phone_number;
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.execute(
            'INSERT INTO otp_codes (identifier, code, type, expires_at) VALUES (?, ?, ?, ?)',
            [identifier.trim(), otp, 'registration', expiresAt]
        );

        // Send OTP via appropriate channel
        try {
            if (phone_number) {
                await smsService.sendOtp(phone_number.trim(), otp);
            } else if (email) {
                await emailService.sendOtpEmail(email.toLowerCase().trim(), otp, full_name);
            }
        } catch (error) {
            console.error('Failed to send OTP:', error);
            // Continue anyway - user can resend
        }

        // Fetch User Data
        const [users] = await pool.execute(
            'SELECT id, full_name, email, phone_number, role, subscription_plan, is_phone_verified, account_type, is_verified, created_at FROM users WHERE id = ?',
            [userId]
        );

        // Both email and phone registrations require OTP verification
        // No token returned until OTP is verified
        res.status(201).json({
            message: phone_number
                ? 'User registered successfully. Please verify your phone number.'
                : 'User registered successfully. Please verify your email.',
            user: users[0],
            requiresVerification: true,
            // No token - user must verify OTP first (for both email and phone)
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'An internal server error occurred during registration.' });
    }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
    try {
        const { email, phone_number, code } = req.body;
        const identifier = email || phone_number;

        if (!identifier || !code) {
            return res.status(400).json({ message: 'Please provide email/phone and code.' });
        }

        const isEmail = identifier.includes('@');

        // Check OTP
        const [otps] = await pool.execute(
            'SELECT * FROM otp_codes WHERE identifier = ? AND code = ? AND type = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [isEmail ? identifier.toLowerCase().trim() : identifier.trim(), code.trim(), 'registration']
        );

        if (otps.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // Mark user as verified (only for phone for now as per schema)
        if (!isEmail) {
            await pool.execute(
                'UPDATE users SET is_phone_verified = TRUE WHERE phone_number = ?',
                [identifier.trim()]
            );
        }

        // Delete used OTP
        await pool.execute('DELETE FROM otp_codes WHERE id = ?', [otps[0].id]);

        // Get user to return token
        let query = 'SELECT id, full_name, email, phone_number, role, subscription_plan, is_phone_verified, account_type, is_verified FROM users WHERE ';
        if (isEmail) {
            query += 'email = ?';
        } else {
            query += 'phone_number = ?';
        }

        const [users] = await pool.execute(query, [isEmail ? identifier.toLowerCase().trim() : identifier.trim()]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = users[0];
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        });

        // Send welcome email if this was email registration
        if (user.email) {
            try {
                await emailService.sendWelcomeEmail(user.email, user.full_name);
            } catch (error) {
                console.error('Failed to send welcome email:', error);
                // Don't fail verification if welcome email fails
            }
        }

        res.status(200).json({
            message: 'Account verified successfully.',
            token,
            user
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ message: 'Server error during verification.' });
    }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOtp = async (req, res) => {
    try {
        const { email, phone_number } = req.body;
        const identifier = email || phone_number;

        if (!identifier) {
            return res.status(400).json({ message: 'Please provide email or phone number.' });
        }

        const isEmail = identifier.includes('@');
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await pool.execute(
            'INSERT INTO otp_codes (identifier, code, type, expires_at) VALUES (?, ?, ?, ?)',
            [isEmail ? identifier.toLowerCase().trim() : identifier.trim(), otp, 'registration', expiresAt]
        );

        if (isEmail) {
            const [users] = await pool.execute('SELECT full_name FROM users WHERE email = ?', [identifier.toLowerCase().trim()]);
            const name = users.length > 0 ? users[0].full_name : 'User';
            await emailService.sendOtpEmail(identifier.toLowerCase().trim(), otp, name);
        } else {
            await smsService.sendOtp(identifier.trim(), otp);
        }

        res.status(200).json({ message: 'OTP resent successfully.' });

    } catch (error) {
        console.error('Resend OTP Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * @desc    Authenticate a user (Email or Phone)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        let { email, phone_number, password } = req.body;

        // Auto-detect if 'email' field actually contains a phone number
        if (email && !email.includes('@')) {
            phone_number = email;
            email = null;
        }

        if ((!email && !phone_number) || !password) {
            return res.status(400).json({ message: 'Please provide email/phone and password.' });
        }

        let query = 'SELECT id, full_name, email, phone_number, password, role, subscription_plan, is_banned, is_phone_verified, account_type, is_verified FROM users WHERE ';
        let param = '';

        if (email) {
            query += 'email = ?';
            param = email.toLowerCase().trim();
        } else {
            query += 'phone_number = ?';
            param = phone_number.trim();
        }

        const [users] = await pool.execute(query, [param]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = users[0];

        if (user.is_banned) {
            return res.status(403).json({ message: 'This account has been suspended.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const payload = { userId: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        });

        const userToReturn = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone_number: user.phone_number,
            role: user.role,
            subscription_plan: user.subscription_plan,
            is_phone_verified: user.is_phone_verified,
            account_type: user.account_type,
            is_verified: user.is_verified
        };

        res.status(200).json({
            message: 'Logged in successfully.',
            token,
            user: userToReturn,
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'An internal server error occurred during login.' });
    }
};

/**
 * @desc    Get the logged-in user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, full_name, email, phone_number, role, subscription_plan, is_phone_verified, company_name, company_role, logo_url, avatar_url, address, about_me, website, social_links, account_type, is_verified, verification_status, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User profile fetched successfully.',
            user: users[0]
        });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

/**
 * @desc    Forgot Password - Send OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
    try {
        const { identifier } = req.body; // email or phone_number

        if (!identifier) {
            return res.status(400).json({ message: 'Please provide email or phone number.' });
        }

        const isEmail = identifier.includes('@');
        let query = 'SELECT id, email, phone_number, full_name FROM users WHERE ';
        let param = '';

        if (isEmail) {
            query += 'email = ?';
            param = identifier.toLowerCase().trim();
        } else {
            query += 'phone_number = ?';
            param = identifier.trim();
        }

        const [users] = await pool.execute(query, [param]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found with this identifier.' });
        }

        const user = users[0];
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Store OTP with identifier
        await pool.execute(
            'INSERT INTO otp_codes (identifier, code, type, expires_at) VALUES (?, ?, ?, ?)',
            [isEmail ? user.email : user.phone_number, otp, 'password_reset', expiresAt]
        );

        // Send OTP via email or SMS
        if (isEmail) {
            await emailService.sendOtpEmail(user.email, otp, user.full_name);
            res.status(200).json({ message: 'OTP sent to your email.' });
        } else {
            await smsService.sendOtp(user.phone_number, otp);
            res.status(200).json({ message: 'OTP sent to your phone number.' });
        }

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * @desc    Reset Password with OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
    try {
        const { identifier, code, new_password } = req.body;

        if (!identifier || !code || !new_password) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        const isEmail = identifier.includes('@');

        // Verify OTP
        const [otps] = await pool.execute(
            'SELECT * FROM otp_codes WHERE identifier = ? AND code = ? AND type = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [isEmail ? identifier.toLowerCase().trim() : identifier.trim(), code.trim(), 'password_reset']
        );

        if (otps.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update password
        let query = 'UPDATE users SET password = ? WHERE ';
        if (isEmail) {
            query += 'email = ?';
        } else {
            query += 'phone_number = ?';
        }

        await pool.execute(query, [hashedPassword, isEmail ? identifier.toLowerCase().trim() : identifier.trim()]);

        // Delete used OTP
        await pool.execute('DELETE FROM otp_codes WHERE id = ?', [otps[0].id]);

        res.status(200).json({ message: 'Password reset successfully.' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = {
    register,
    login,
    getMe,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword
};
