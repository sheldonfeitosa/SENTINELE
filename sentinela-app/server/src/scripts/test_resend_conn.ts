
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.RESEND_API_KEY;
console.log('API Key present:', !!apiKey);
if (apiKey) console.log('API Key prefix:', apiKey.substring(0, 5));

const resend = new Resend(apiKey);

async function test() {
    console.log('Attempting to send simple email...');
    try {
        const { data, error } = await resend.emails.send({
            from: 'Sentinela AI <onboarding@resend.dev>', // Use default testing domain
            to: 'sheldonfeitosa@gmail.com',
            subject: 'Teste de Conexão Resend',
            html: '<p>Se você recebeu isso, a API está funcionando!</p>'
        });

        if (error) {
            console.error('❌ Resend Error:', error);
        } else {
            console.log('✅ Success:', data);
        }
    } catch (e) {
        console.error('❌ Exception:', e);
    }
}

test();
