
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function runSecurityAudit() {
    console.log('🔒 Starting Security Audit...');

    // 1. Test Public Creation (Should Succeed)
    console.log('\n--- 1. Testing Public Incident Creation ---');
    let incidentId;
    try {
        const res = await axios.post(`${BASE_URL}/notifications`, {
            description: "Security Test Incident",
            sector: "UTI",
            type: "Queda",
            eventDate: new Date(),
            patientName: "John Doe"
        });
        console.log('✅ Public Creation Allowed (Expected):', res.status);
        incidentId = res.data.id;
    } catch (error) {
        console.error('❌ Public Creation Failed (Unexpected):', error.message);
    }

    if (!incidentId) return;

    // 2. Test Unauthorized Listing (Should Fail after fix)
    console.log('\n--- 2. Testing Unauthorized Listing (GET /) ---');
    try {
        await axios.get(`${BASE_URL}/notifications`);
        console.log('❌ Vulnerability Found: Unauthorized access to ALL notifications!');
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('✅ Secured: Unauthorized listing blocked (401/403)');
        } else {
            console.log('⚠️ Unexpected Error:', error.message);
        }
    }

    // 3. Test Unauthorized Detail (Should Fail after fix)
    console.log(`\n--- 3. Testing Unauthorized Detail (GET /${incidentId}) ---`);
    try {
        await axios.get(`${BASE_URL}/notifications/${incidentId}`);
        console.log('❌ Vulnerability Found: Unauthorized access to notification details!');
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('✅ Secured: Unauthorized detail blocked');
        } else {
            console.log('⚠️ Unexpected Error:', error.message);
        }
    }

    // 4. Test Unauthorized RCA Analysis (Should Fail after fix)
    console.log(`\n--- 4. Testing Unauthorized RCA (POST /${incidentId}/analyze-root-cause) ---`);
    try {
        await axios.post(`${BASE_URL}/notifications/${incidentId}/analyze-root-cause`);
        console.log('❌ Vulnerability Found: Unauthorized RCA trigger!');
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('✅ Secured: Unauthorized RCA blocked');
        } else {
            console.log('⚠️ Unexpected Error:', error.message);
        }
    }
}

runSecurityAudit();
