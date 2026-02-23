
const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testFallback() {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const targetEmail = 'sheldonfeitosa@gmail.com';

    console.log('--- TESTING FALLBACK MECHANISM ---');
    console.log('Primary From:', process.env.EMAIL_FROM);

    // Simulate the logic in EmailService
    async function send(fromEmail) {
        console.log(`Trying to send from: ${fromEmail}`);
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: targetEmail,
            subject: 'Teste Fallback Sentinela',
            html: `<p>Enviado via: ${fromEmail}</p>`
        });

        if (error) {
            console.warn(`❌ Failed with ${fromEmail}:`, error.message);
            return { success: false, error };
        }
        console.log(`✅ Success with ${fromEmail}! ID:`, data.id);
        return { success: true, data };
    }

    // Main execution
    let result = await send(process.env.EMAIL_FROM);

    if (!result.success && process.env.EMAIL_FROM !== 'onboarding@resend.dev') {
        console.log('🔄 Triggering fallback...');
        result = await send('onboarding@resend.dev');
    }

    if (result.success) {
        console.log('🏁 Proved: E-mails can be sent via fallback.');
    } else {
        console.error('🏁 Proved: BOTH senders failed. Check API Key or target email.');
    }
}

testFallback();
