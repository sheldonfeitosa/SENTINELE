import dotenv from 'dotenv';
dotenv.config();
import { EmailService } from '../src/services/email.service';

const emailService = new EmailService();

async function sendDeadlineReminder() {
    // Correcting from @mail.com to @gmail.com based on previous turns context
    const recipient = 'sheldonfeitosa@gmail.com';

    // Dummy incident data for the report
    const dummyIncident = {
        id: 602,
        sector: 'QUALIDADE',
        eventDate: new Date(),
        riskLevel: 'GRAVE'
    };

    console.log(`Sending deadline reminder (Escalonamento) to: ${recipient}`);
    try {
        await emailService.sendHighManagementReport(dummyIncident, [recipient]);
        console.log('✅ Deadline reminder email sent successfully');
    } catch (error) {
        console.error('❌ Failed to send deadline reminder:', error);
    }
}

sendDeadlineReminder().catch(console.error);
