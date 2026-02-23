
import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function auditResend() {
    console.log('--- AUDITORIA PROFUNDA RESEND ---');
    console.log('API_KEY (prefix):', process.env.RESEND_API_KEY?.substring(0, 5) + '...');
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const to = 'sheldonfeitosa@gmail.com';

    console.log(`\nTentando envio real para: ${to}`);

    try {
        const response = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: to,
            subject: 'AUDITORIA DE SISTEMA - SENTINELA AI',
            html: '<h1>Teste de Auditoria</h1><p>Se você recebeu isso, a API aceitou e entregou.</p>'
        });

        console.log('\nRESPOSTA DA API (Sucesso ou Pendência):');
        console.log(JSON.stringify(response, null, 2));
    } catch (error: any) {
        console.error('\nERRO DETECTADO NA API:');
        console.error('Nome:', error.name);
        console.error('Mensagem:', error.message);
        console.error('Detalhes:', JSON.stringify(error, null, 2));
    }
}

auditResend();
