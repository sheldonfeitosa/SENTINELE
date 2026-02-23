// Native fetch used

const BASE_URL = 'http://localhost:3001/api/managers';

async function runTest() {
    console.log('--- STARTING WRAPPER TEST ---');

    // 1. Test GET Managers
    console.log('\n1. Testing GET /api/managers...');
    try {
        const res = await fetch(BASE_URL);
        console.log(`Status: ${res.status}`);
        if (res.status === 200) {
            const data = await res.json();
            console.log(`Success! Found ${data.length} managers.`);
            // console.log('Managers:', JSON.stringify(data, null, 2));
        } else {
            const text = await res.text();
            console.error('FAILED GET. Response:', text);
        }
    } catch (e) {
        console.error('CRITICAL ERROR calling GET:', e.message);
    }

    // 2. Test CREATE Manager (Unique)
    const uniqueEmail = `auto_test_${Date.now()}@test.com`;
    console.log(`\n2. Testing POST /api/managers (New Email: ${uniqueEmail})...`);
    try {
        const payload = {
            name: "Auto Test User",
            email: uniqueEmail,
            role: "GESTOR_SETOR",
            sectors: ["Qualidade"]
        };
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log(`Status: ${res.status}`);
        if (res.status === 201) {
            const data = await res.json();
            console.log('Success! Created ID:', data.id);
        } else {
            const text = await res.text();
            console.error('FAILED CREATE. Response:', text);
        }
    } catch (e) {
        console.error('CRITICAL ERROR calling POST:', e.message);
    }

    // 3. Test CREATE Manager (Duplicate)
    console.log(`\n3. Testing POST /api/managers (Duplicate Email: ${uniqueEmail})...`);
    try {
        const payload = {
            name: "Duplicate User",
            email: uniqueEmail,
            role: "GESTOR_SETOR",
            sectors: ["TI"]
        };
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log(`Status: ${res.status} (Expected: 500 or 409)`);
        const text = await res.text();
        console.log('Response Body:', text);
    } catch (e) {
        console.error('CRITICAL ERROR calling Duplicate POST:', e.message);
    }
}

// Handle fetch polyfill if needed for older node
if (!globalThis.fetch) {
    console.log('Node environment too old for native fetch, using mock or skipping...');
    // In strict Agent env, I expect Node 18+. I'll try simple http if fetch fails? 
    // Actually, let's just assume native fetch exists (Node 18+).
    // If not, I'll use http module. But let's try this first.
}

runTest();
