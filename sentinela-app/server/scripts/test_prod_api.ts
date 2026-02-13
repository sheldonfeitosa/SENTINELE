
import axios from 'axios';

const API_URL = 'https://sentinela-app-eta.vercel.app/api';
const EMAIL = 'qualidade@inmceb.med.br';
const PASSWORD = 'password123'; // I assume this is the password since I set it in seed or it was default

async function test() {
    try {
        console.log(`Login as ${EMAIL}...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        const token = loginRes.data.token;
        console.log('Login success. Token received.');

        console.log('Fetching notifications...');
        const notifyRes = await axios.get(`${API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`Received ${notifyRes.data.length} notifications.`);
        if (notifyRes.data.length > 0) {
            console.log('Sample Notification:', JSON.stringify(notifyRes.data[0], null, 2));
        }

        console.log('Fetching stats...');
        const statsRes = await axios.get(`${API_URL}/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Stats:', JSON.stringify(statsRes.data, null, 2));

    } catch (err: any) {
        console.error('Error:', err.response?.data || err.message);
    }
}

test();
