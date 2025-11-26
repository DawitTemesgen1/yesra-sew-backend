const paymentService = require('../services/paymentService');
const pool = require('../config/database');

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
        // Verification logic would go here in a real app
        const { tx_ref, status, reference } = req.body;
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
 * Verify payment transaction (client-side fallback)
 * POST /api/payments/verify/:txRef
 */
const verifyPayment = async (req, res) => {
    try {
        const { txRef } = req.params;
        const verification = await paymentService.verifyWithChapaAPI(txRef);

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
    // Placeholder
    res.status(501).json({ message: 'Not Implemented' });
};

const getPaymentHistory = async (req, res) => {
    // Placeholder
    res.status(501).json({ message: 'Not Implemented' });
};

module.exports = {
    initializePayment,
    handleWebhook,
    verifyPayment,
    getPaymentStatus,
    getPaymentHistory
};