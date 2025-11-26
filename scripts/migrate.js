const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const migrate = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'yesirasew_db',
        multipleStatements: true
    });

    console.log('Connected to database.');

    const migrationsDir = path.join(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
        console.log('No migrations directory found.');
        process.exit(0);
    }

    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
        if (file.endsWith('.sql')) {
            console.log(`Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

            for (const statement of statements) {
                try {
                    await connection.query(statement);
                } catch (err) {
                    if (err.code === 'ER_DUP_FIELDNAME') {
                        console.log(`Skipping statement (column exists): ${statement.substring(0, 50).replace(/\n/g, ' ')}...`);
                    } else {
                        console.error(`Error running statement in ${file}:`, err.message);
                    }
                }
            }
            console.log(`Migration ${file} processed.`);
        }
    }

    await connection.end();
    console.log('All migrations finished.');
};

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
