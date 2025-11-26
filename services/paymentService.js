const crypto = require('crypto');
const pool = require('../config/database');

/**
 * Payment Service - Business logic for Chapa payment processing
 */
class PaymentService {

    /**
     * Create a new payment transaction record
     */
    async createTransaction({ userId, planName, amount, currency, email, firstName, lastName, txRef }) {
        const [result] = await pool.execute(
            `INSERT INTO payment_transactions 
       (tx_ref, user_id, plan_name, amount, currency, email, first_name, last_name, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [txRef, userId, planName, amount, currency, email, firstName, lastName]
        );

        return {
            id: result.insertId,
            tx_ref: txRef,
            status: 'pending'
        };
    }

    /**
     * Verify Chapa webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;

        if (!webhookSecret) {
            throw new Error('CHAPA_WEBHOOK_SECRET not configured');
        }

        // Chapa sends signature in 'Chapa-Signature' or 'x-chapa-signature' header
        const hash = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(payload))
            .digest('hex');

        return hash === signature;
    }

    /**
     * Update transaction status based on webhook
     */
    async updateTransactionStatus(txRef, status, chapaReference = null, errorMessage = null) {
        const completedAt = status === 'completed' ? new Date() : null;

        await pool.execute(
            `UPDATE payment_transactions 
       SET status = ?, chapa_reference = ?, error_message = ?, completed_at = ?, updated_at = NOW()
       WHERE tx_ref = ?`,
            [status, chapaReference, errorMessage, completedAt, txRef]
        );
    }

    /**
     * Get transaction by reference
     */
    async getTransaction(txRef) {
        const [rows] = await pool.execute(
            'SELECT * FROM payment_transactions WHERE tx_ref = ?',
            [txRef]
        );

        return rows[0] || null;
    }

    /**
     * Grant subscription after successful payment
     */
    async grantSubscription(txRef) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Get transaction details
            const [transactions] = await connection.execute(
                'SELECT * FROM payment_transactions WHERE tx_ref = ? AND status = "completed"',
                [txRef]
            );

            if (transactions.length === 0) {
                throw new Error('Transaction not found or not completed');
            }

            const transaction = transactions[0];

            // Check if already processed (idempotency)
            const [users] = await connection.execute(
                'SELECT subscription_plan FROM users WHERE id = ?',
                [transaction.user_id]
            );

            if (users[0].subscription_plan === transaction.plan_name) {
                // Already granted, skip (idempotent operation)
                await connection.commit();
                return { alreadyGranted: true };
            }

            // Update user subscription
            await connection.execute(
                'UPDATE users SET subscription_plan = ?, updated_at = NOW() WHERE id = ?',
                [transaction.plan_name, transaction.user_id]
            );

            await connection.commit();

            return { success: true, planName: transaction.plan_name };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get user's payment history
     */
    async getUserPaymentHistory(userId, limit = 20) {
        const [rows] = await pool.execute(
            `SELECT id, tx_ref, plan_name, amount, currency, status, created_at, completed_at
       FROM payment_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
            [userId, limit]
        );

        return rows;
    }

    /**
     * Verify payment with Chapa API (fallback verification)
     */
    async verifyWithChapaAPI(txRef) {
        const axios = require('axios');
        const secretKey = process.env.CHAPA_SECRET_KEY;

        if (!secretKey) {
            throw new Error('CHAPA_SECRET_KEY not configured');
        }

        try {
            const response = await axios.get(
                `https://api.chapa.co/v1/transaction/verify/${txRef}`,
                {
                    headers: {
                        'Authorization': `Bearer ${secretKey}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Chapa API verification error:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new PaymentService();
