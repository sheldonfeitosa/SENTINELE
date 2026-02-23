
const { Resend } = require('resend');
const dotenv = require('dotenv');
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function checkApiKey() {
    try {
        // There's no direct "whoami" but we can try to send a test email to sheldonfeitosa@gmail.com
        // actually we can check domains and list single senders if any
        // but the easiest is to ask the user or just assume gmail is the verified one.

        console.log('Testing send to sheldonfeitosa@gmail.com using onboarding...');
        const r1 = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'sheldonfeitosa@gmail.com',
            subject: 'Test Onboarding Gmail',
            html: '<p>Test</p>'
        });
        console.log('Result Gmail:', JSON.stringify(r1, null, 2));

        console.log('Testing send to sheldonfeitosa@inmceb.med.br using onboarding...');
        const r2 = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'sheldonfeitosa@inmceb.med.br',
            subject: 'Test Onboarding INMCEB',
            html: '<p>Test</p>'
        });
        console.log('Result INMCEB:', JSON.stringify(r2, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

checkApiKey();
