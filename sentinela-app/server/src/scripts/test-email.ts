import { EmailService } from '../services/email.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testEmail() {
    console.log('--- Email Service Test ---');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');

    const emailService = new EmailService();
    const testRecipient = 'sheldonfeitosa@gmail.com';

    try {
        console.log(`Sending test email to: ${testRecipient} from qualidade@inmceb.med.br...`);
        // Use the resend instance directly to see the error
        const { data, error } = await (emailService as any).resend.emails.send({
            from: 'qualidade@inmceb.med.br',
            to: testRecipient,
            subject: 'Test Email - SENTINELA AI',
            html: '<p>Este é um teste do serviço de e-mail usando o domínio inmceb.med.br.</p>'
        });

        if (error) {
            console.error('❌ Resend Error (Main):', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Resend Success (Main):', data);
        }

        console.log(`--- Testing Fallback from onboarding@resend.dev to ${testRecipient} ---`);
        const fallback = await (emailService as any).resend.emails.send({
            from: 'onboarding@resend.dev',
            to: testRecipient,
            subject: 'Test Fallback Email - SENTINELA AI',
            html: '<p>Este é um teste do fallback de e-mail usando onboarding@resend.dev.</p>'
        });

        if (fallback.error) {
            console.error('❌ Fallback Error:', JSON.stringify(fallback.error, null, 2));
        } else {
            console.log('✅ Fallback Success:', fallback.data);
        }

    } catch (error) {
        console.error('Test script crashed:', error);
    }
}

testEmail();
