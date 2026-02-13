const axios = require('axios');

async function testHealth() {
    try {
        console.log('Testing Health Check...');
        const response = await axios.get('https://sentinela-app-eta.vercel.app/api/health');
        console.log('Health Status:', response.status);
        console.log('Headers:', response.headers);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Health Error:', error.message);
        if (error.response) {
            console.log('Headers:', error.response.headers);
            console.error('Error data:', error.response.data);
        }
    }
}

testHealth();
