
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Resend } from 'resend';

async function main() {
    console.log('--- Email Test ---');
    console.log('API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY is missing in .env');
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const data = await resend.emails.send({
            from: 'onboarding@resend.dev', // Default testing domain
            to: 'sheldonfeitosa@gmail.com', // User's email
            subject: 'Teste de Envio Sentinela AI',
            html: '<p>Se você recebeu este email, a configuração está correta! 🚀</p>'
        });

        console.log('✅ Email sent successfully!');
        console.log(data);
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
}

main();
