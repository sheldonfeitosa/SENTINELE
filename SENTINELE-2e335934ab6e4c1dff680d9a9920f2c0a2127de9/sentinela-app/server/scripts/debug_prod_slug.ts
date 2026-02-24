import axios from 'axios';

async function test() {
    const slug = 'inmceb';
    const baseUrl = 'https://sentinela-app.vercel.app/api';

    console.log(`--- TESTING SLUG: ${slug} ---`);

    try {
        console.log(`1. Testing /sectors/tenant-info?tenantSlug=${slug}...`);
        const infoRes = await axios.get(`${baseUrl}/sectors/tenant-info`, {
            params: { tenantSlug: slug }
        });
        console.log('✅ Tenant Info:', infoRes.data);
    } catch (e: any) {
        console.error('❌ Tenant Info Error:', e.response?.status, e.response?.data || e.message);
    }

    try {
        console.log(`2. Testing /sectors?tenantSlug=${slug}...`);
        const sectorsRes = await axios.get(`${baseUrl}/sectors`, {
            params: { tenantSlug: slug }
        });
        console.log('✅ Sectors:', sectorsRes.data.length, 'sectors found.');
    } catch (e: any) {
        console.error('❌ Sectors Error:', e.response?.status, e.response?.data || e.message);
    }
}

test();
