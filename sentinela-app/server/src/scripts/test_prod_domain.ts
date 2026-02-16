
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testProductionDomain() {
    console.log('Testing PRODUCTION domain: Sentinela AI <qualidade@inmceb.med.br>');
    try {
        const { data, error } = await resend.emails.send({
            from: 'Sentinela AI <qualidade@inmceb.med.br>',
            to: 'sheldonfeitosa@gmail.com',
            subject: 'Teste de Domínio de Produção',
            html: '<p>Teste de verificação de domínio.</p>'
        });

        if (error) {
            console.error('❌ Production Domain Error:', error);
        } else {
            console.log('✅ Production Domain Success:', data);
        }
    } catch (e) {
        console.error('❌ Exception:', e);
    }
}

testProductionDomain();
