const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

async function check() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    try {
        await client.connect();
        console.log('Connected to database successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Server time:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }
}

check();
