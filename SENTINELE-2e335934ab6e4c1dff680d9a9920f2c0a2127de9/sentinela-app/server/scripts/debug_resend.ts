
const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function debugResend() {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const targetEmail = 'sheldonfeitosa@gmail.com';

    console.log('--- DEBUG RESEND ---');
    console.log('API KEY:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
    console.log('FROM:', process.env.EMAIL_FROM);
    console.log('TO:', targetEmail);

    try {
        const data = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: targetEmail,
            subject: 'Teste de Depuração Sentinela',
            html: '<p>Teste de envio com log detalhado.</p>'
        });

        console.log('Success Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error Object:', error);
    }
}

debugResend();
