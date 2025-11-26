const pool = require('../config/database');

/**
 * @desc    Get all available subscription plans
 * @route   GET /api/plans
 * @access  Admin
 */
const getPlans = (req, res) => {
    try {
        // In a real production app, plans would be stored in a database table.
        // For this project, we manage them via environment variables for simplicity.
        const plans = [
            {
                title: 'Free',
                price: 'ETB 0 / month',
                features: 'Post 1 ad per month, Basic visibility, Standard support',
            },
            {
                title: 'Standard',
                price: `ETB ${process.env.STANDARD_PLAN_PRICE || '100'} / month`,
                features: 'Post 10 ads, Featured priority, Chat access',
            },
            {
                title: 'Premium',
                price: `ETB ${process.env.PREMIUM_PLAN_PRICE || '200'} / month`,
                features: 'Unlimited posts, Top placement, 24/7 support',
            },
        ];
        res.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ message: 'Server Error while fetching plans' });
    }
};

/**
 * @desc    Update a subscription plan (Placeholder)
 * @route   PUT /api/plans/:planName
 * @access  Admin
 */
const updatePlan = (req, res) => {
    // NOTE: Updating .env files at runtime is not a standard or safe practice.
    // A production-grade implementation would involve a 'plans' table in the database
    // and this controller would update that table.
    // For now, we return a "Not Implemented" status.
    res.status(501).json({ 
        message: 'Updating plans via API is not implemented. To change plan prices or features, please edit the .env file and restart the server.' 
    });
};

module.exports = { 
    getPlans, 
    updatePlan 
};