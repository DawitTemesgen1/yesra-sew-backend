const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumns() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'yesirasew_db'
    });

    const [rows] = await connection.execute(`SHOW COLUMNS FROM listings`);
    const columns = rows.map(r => r.Field);

    console.log('Current columns in listings table:');
    console.log(columns.join(', '));

    const required = [
        'city', 'subcity', 'specific_location', 'make', 'model', 'year',
        'transmission', 'fuel_type', 'mileage', 'condition', 'car_status',
        'experience_level', 'education_level', 'deadline', 'job_location_type',
        'responsibilities', 'requirements', 'salary_type', 'tender_type',
        'tender_category', 'payment_method', 'bank_payment_style',
        'property_type', 'furnishing', 'specific_home_type'
    ];

    const missing = required.filter(c => !columns.includes(c));

    if (missing.length === 0) {
        console.log('\nSUCCESS: All required columns are present.');
    } else {
        console.log('\nWARNING: The following columns are MISSING:');
        console.log(missing.join(', '));
    }

    await connection.end();
}

checkColumns().catch(console.error);
