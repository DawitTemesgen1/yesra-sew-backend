const pool = require('./config/database');

async function deleteUser() {
    try {
        const email = 'dawittamasgen1@gmail.com';
        await pool.execute('DELETE FROM users WHERE email = ?', [email]);
        console.log(`User ${email} deleted.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

deleteUser();
