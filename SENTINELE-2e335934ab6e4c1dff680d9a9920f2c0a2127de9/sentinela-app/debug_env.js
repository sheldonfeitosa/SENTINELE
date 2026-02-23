
require('dotenv').config({ path: './server/.env' });
console.log('--- ENV CHECK ---');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'DEFINED' : 'MISSING');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'DEFINED' : 'MISSING');
console.log('APP_URL:', process.env.APP_URL);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('---');

const { EmailService } = require('./server/dist/services/email.service'); // Using dist if exists, or I'll just use ts-node
