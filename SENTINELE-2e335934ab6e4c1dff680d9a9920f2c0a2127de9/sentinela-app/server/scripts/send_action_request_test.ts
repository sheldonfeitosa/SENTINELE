import dotenv from 'dotenv';
dotenv.config();
import { EmailService } from '../src/services/email.service';

const emailService = new EmailService();

async function sendActionRequestTest() {
    const recipient = 'sheldonfeitosa@gmail.com';

    const dummyIncident = {
        id: 602,
        description: 'TESTE DE COBRANÇA: A tratativa ainda não foi respondida.',
        sector: 'QUALIDADE'
    };

    console.log(`Sending action request test to: ${recipient}`);
    try {
        await emailService.sendActionRequest(dummyIncident, recipient);
        console.log('✅ Action request email sent successfully');
    } catch (error) {
        console.error('❌ Failed to send action request:', error);
    }
}

sendActionRequestTest().catch(console.error);
