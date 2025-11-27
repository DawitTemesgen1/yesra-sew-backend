const pool = require('./config/database');

async function checkAdminUsers() {
    try {
        const [users] = await pool.execute(
            'SELECT id, full_name, email, role FROM users ORDER BY id LIMIT 10'
        );
        console.log('\n=== USER ROLES ===');
        console.table(users);

        const [admins] = await pool.execute(
            "SELECT id, full_name, email, role FROM users WHERE role IN ('SuperAdmin', 'Moderator')"
        );
        console.log('\n=== ADMIN USERS ===');
        if (admins.length === 0) {
            console.log('⚠️  NO ADMIN USERS FOUND!');
            console.log('You need to update a user role to SuperAdmin or Moderator');
        } else {
            console.table(admins);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAdminUsers();
