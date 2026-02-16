const { Resend } = require('resend');
require('dotenv').config({ path: '.env' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
    console.log('--- Resend Diagnostic ---');
    console.log('API Key present:', !!process.env.RESEND_API_KEY);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Sentinela AI <notificacoes@sheldonfeitosa.com.br>',
            to: 'sheldonfeitosa@gmail.com',
            subject: 'Teste de Diagnóstico Sentinela',
            html: '<p>Este é um teste para verificar a entrega do domínio <strong>sheldonfeitosa.com.br</strong>.</p>'
        });

        if (error) {
            console.error('❌ Resend Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Resend Success:', data);
        }
    } catch (err) {
        console.error('❌ Critical Error:', err.message);
    }
}

testEmail();
