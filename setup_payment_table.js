const pool = require('./config/database');

async function checkPaymentTable() {
    try {
        const [rows] = await pool.execute("SHOW TABLES LIKE 'payment_transactions'");
        console.log('Payment table exists:', rows.length > 0);

        if (rows.length === 0) {
            console.log('\nCreating payment_transactions table...');
            await pool.execute(`
                CREATE TABLE payment_transactions (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    tx_ref VARCHAR(255) UNIQUE NOT NULL,
                    user_id INT NOT NULL,
                    plan_name VARCHAR(50) NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    currency VARCHAR(10) DEFAULT 'ETB',
                    email VARCHAR(255) NOT NULL,
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                    chapa_reference VARCHAR(255),
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_user_id (user_id),
                    INDEX idx_status (status),
                    INDEX idx_tx_ref (tx_ref)
                )
            `);
            console.log('✅ Payment table created successfully');
        } else {
            console.log('✅ Payment table already exists');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkPaymentTable();
