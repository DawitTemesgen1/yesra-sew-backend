const pool = require('./config/database');

async function checkUser() {
    try {
        const email = 'dawittamasgen1@gmail.com';
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        console.log('Users found:', users);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUser();
