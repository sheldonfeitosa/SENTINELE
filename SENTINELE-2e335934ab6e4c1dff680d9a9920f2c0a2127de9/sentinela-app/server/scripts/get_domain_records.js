
const { Resend } = require('resend');
const dotenv = require('dotenv');
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function getDomainRecords() {
    try {
        const domain = await resend.domains.get('70a9bdb0-4997-4238-b569-e1c61fa66146');
        console.log('--- DOMAIN RECORDS TO ADD ---');
        console.log(JSON.stringify(domain, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

getDomainRecords();
