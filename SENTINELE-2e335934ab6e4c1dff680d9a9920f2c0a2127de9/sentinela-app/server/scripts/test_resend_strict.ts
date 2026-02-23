
import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testResendStrict() {
    console.log('--- Teste de Email Rigoroso (Resend) ---');
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.error('❌ RESEND_API_KEY ausente.');
        return;
    }

    const resend = new Resend(apiKey);
    const testEmail = 'sheldofeitosa@gmail.com';

    try {
        console.log(`📧 Tentando enviar via ONBOARDING@RESEND.DEV para ${testEmail}...`);
        const result = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: testEmail,
            subject: 'Teste Forçado (Onboarding Domain)',
            html: '<p>Este e-mail usa o domínio padrão do Resend. Se você recebeu, o problema anterior era o domínio unverified. 🚀</p>'
        });
        console.log('✅ Resposta do Resend:', result);
    } catch (error) {
        console.error('❌ Erro no envio:', error);
    }
}

testResendStrict();
