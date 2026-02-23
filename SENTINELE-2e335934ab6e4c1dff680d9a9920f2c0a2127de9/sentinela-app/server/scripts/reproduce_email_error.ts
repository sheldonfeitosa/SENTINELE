
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Resend } from 'resend';

async function main() {
    console.log('--- Email Reproduction Test ---');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY is missing');
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = 'nao-responda@sentinelaii.com.br'; // Testing verified domain
    const toEmail = 'sheldonfeitosa@gmail.com';

    console.log(`Attempting to send FROM: ${fromEmail} TO: ${toEmail}`);

    try {
        const data = await resend.emails.send({
            from: fromEmail,
            to: toEmail,
            subject: 'Teste de Reprodução de Erro',
            html: '<p>Teste de envio com domínio personalizado.</p>'
        });

        console.log('✅ Email sent successfully (Unexpected if domain not verified)');
        console.log(data);
    } catch (error: any) {
        console.error('❌ Failed to send email (Expected):');
        console.error(error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

main();
