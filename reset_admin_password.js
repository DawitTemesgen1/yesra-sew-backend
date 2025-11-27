const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
    try {
        const newPassword = 'admin123'; // Change this to your desired password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@yesrasew.com']
        );

        console.log('✅ Admin password reset successfully!');
        console.log('Email: admin@yesrasew.com');
        console.log('Password: admin123');
        console.log('\n⚠️  Please change this password after logging in!');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetAdminPassword();
