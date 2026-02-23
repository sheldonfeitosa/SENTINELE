
const { Resend } = require('resend');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function exportRecords() {
    try {
        const domain = await resend.domains.get('70a9bdb0-4997-4238-b569-e1c61fa66146');
        fs.writeFileSync('dns_records_export.json', JSON.stringify(domain, null, 2));
        console.log('Exported to dns_records_export.json');
    } catch (error) {
        console.error('Error:', error);
    }
}

exportRecords();
