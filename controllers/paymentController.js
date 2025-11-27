const paymentService = require('../services/paymentService');
const pool = require('../config/database');

// Helper to fetch Chapa keys from DB (Fallback to ENV)
const getChapaConfig = async () => {
    try {
        // Fetch config from database
        const [rows] = await pool.query("SELECT config_value FROM system_config WHERE config_key = 'chapa_config'");
        const dbConfig = rows[0]?.config_value || {};

        return {
            secretKey: dbConfig.secretKey || process.env.CHAPA_SECRET_KEY,
            publicKey: dbConfig.publicKey || process.env.CHAPA_PUBLIC_KEY,
            encryptionKey: dbConfig.encryptionKey || process.env.CHAPA_ENCRYPTION_KEY,
            // Use configured secret or fallback to ENV for webhook signature
            webhookSecret: dbConfig.secretKey || process.env.CHAPA_WEBHOOK_SECRET 
        };
    } catch (error) {
        console.error('Error loading Chapa config:', error);
        // Fallback to env if DB fails
        return {
            secretKey: process.env.CHAPA_SECRET_KEY,
            publicKey: process.env.CHAPA_PUBLIC_KEY,
            encryptionKey: process.env.CHAPA_ENCRYPTION_KEY,
            webhookSecret: process.env.CHAPA_WEBHOOK_SECRET
        };
    }
};

/**
 * Initialize a new payment transaction
 * POST /api/payments/initialize
 */
const initializePayment = async (req, res) => {
    try {
        const { planName, amount, txRef } = req.body;
        const userId = req.user.id;

        // Get user details
        const [users] = await pool.execute(
            'SELECT email, full_name FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = users[0];
        const [firstName, ...lastNameParts] = (user.full_name || 'Customer').split(' ');
        const lastName = lastNameParts.join(' ') || 'User';

        // Create transaction record in our database
        await paymentService.createTransaction({
            userId,
            planName,
            amount,
            currency: 'ETB',
            email: user.email,
            firstName,
            lastName,
            txRef
        });

        res.status(201).json({ message: 'Payment transaction initialized' });
    } catch (error) {
        console.error('Initialize payment error:', error);
        res.status(500).json({ message: 'Failed to initialize payment' });
    }
};

/**
 * Handle Chapa webhook notifications
 * POST /api/payments/webhook
 */
const handleWebhook = async (req, res) => {
    try {
        const { tx_ref, status, reference } = req.body;
        
        // 1. Load Configuration dynamically
        const chapaConfig = await getChapaConfig();

        // 2. Verify Signature
        const signature = req.headers['chapa-signature'] || req.headers['x-chapa-signature'];
        const webhookSecret = chapaConfig.webhookSecret;

        if (webhookSecret && signature) {
            const crypto = require('crypto');
            const hash = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (hash !== signature) {
                console.warn('Invalid webhook signature');
                return res.status(401).json({ message: 'Invalid signature' });
            }
        } else if (!webhookSecret) {
            // No webhook secret configured - verify with Chapa API instead
            console.log('Webhook secret not configured, verifying with Chapa API...');
            try {
                // Pass dynamic secret key to service
                const verification = await paymentService.verifyWithChapaAPI(tx_ref, chapaConfig.secretKey);
                if (verification.status !== 'success') {
                    console.warn('Webhook verification failed via API');
                    return res.status(400).json({ message: 'Payment verification failed' });
                }
            } catch (error) {
                console.error('Webhook API verification error:', error);
                return res.status(500).json({ message: 'Verification failed' });
            }
        }

        const transactionStatus = status === 'success' ? 'completed' : 'failed';

        await paymentService.updateTransactionStatus(tx_ref, transactionStatus, reference);

        if (transactionStatus === 'completed') {
            await paymentService.grantSubscription(tx_ref);
        }

        res.status(200).json({ message: 'Webhook processed' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};

/**
 * Verify payment transaction (client-side verification)
 * POST /api/payments/verify/:txRef
 */
const verifyPayment = async (req, res) => {
    try {
        const { txRef } = req.params;
        
        // 1. Load Config
        const chapaConfig = await getChapaConfig();

        // 2. Verify using dynamic Secret Key
        // Note: Ensure paymentService.verifyWithChapaAPI accepts the key as 2nd arg
        const verification = await paymentService.verifyWithChapaAPI(txRef, chapaConfig.secretKey);

        if (verification.status === 'success') {
            await paymentService.updateTransactionStatus(txRef, 'completed', verification.data.reference);
            const grantResult = await paymentService.grantSubscription(txRef);

            return res.json({
                status: 'completed',
                planName: grantResult.planName,
                message: 'Payment verified successfully'
            });
        } else {
            await paymentService.updateTransactionStatus(txRef, 'failed', null, 'Payment verification failed');
            return res.status(400).json({ status: 'failed', message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Failed to verify payment' });
    }
};

const getPaymentStatus = async (req, res) => {
    res.status(501).json({ message: 'Not Implemented' });
};

const getPaymentHistory = async (req, res) => {
    try {
        const [transactions] = await pool.execute(
            `SELECT
                t.id,
                t.tx_ref,
                t.amount,
                t.currency,
                t.status,
                t.created_at,
                u.full_name AS user_name,
                t.plan_name
            FROM
                payment_transactions t
            JOIN
                users u ON t.user_id = u.id
            ORDER BY
                t.created_at DESC`
        );
        res.json(transactions);
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ message: 'Failed to fetch payment history' });
    }
};

module.exports = {
    initializePayment,
    handleWebhook,
    verifyPayment,
    getPaymentStatus,
    getPaymentHistory
};