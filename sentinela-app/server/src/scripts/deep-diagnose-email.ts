import { EmailService } from '../services/email.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function diagnoseEmail() {
    console.log('--- Deep Diagnostic: Email Service ---');
    console.log('Recipient:', process.env.RISK_MANAGER_EMAIL);

    const emailService = new EmailService();

    try {
        console.log('Testing sendWelcomeEmail method (this uses the fallback helper)...');
        // This will trigger the fallback if the primary fails
        await emailService.sendWelcomeEmail(
            process.env.RISK_MANAGER_EMAIL || 'sheldonfeitosa@gmail.com',
            'Sheldon Test',
            'test-password-123',
            'http://localhost:5173/login'
        );
        console.log('✅ sendWelcomeEmail call finished.');
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
    }
}

diagnoseEmail();
