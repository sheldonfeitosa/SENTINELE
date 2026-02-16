
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testExternalSend() {
    const externalEmail = 'test-external-sentinela@yopmail.com'; // Disposable email for testing
    console.log(`Attempting to send via ONBOARDING domain to EXTERNAL address: ${externalEmail}`);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Sentinela AI <onboarding@resend.dev>',
            to: externalEmail,
            subject: 'Teste de Sandbox Resend',
            html: '<p>Teste de restrição de sandbox.</p>'
        });

        if (error) {
            console.error('❌ Resend Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Resend logic accepted the request:', data);
            console.log('NOTE: If this email does not arrive at the destination, it confirms sandbox restrictions for onboarding domain.');
        }
    } catch (e) {
        console.error('❌ Exception:', e);
    }
}

testExternalSend();
