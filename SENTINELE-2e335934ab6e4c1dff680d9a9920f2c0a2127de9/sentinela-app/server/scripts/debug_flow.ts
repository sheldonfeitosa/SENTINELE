
import { EmailService } from '../src/services/email.service';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function debugFlow() {
    const emailService = new EmailService();
    const targetEmail = 'sheldonfeitosa@gmail.com';

    console.log('--- TESTING EMAIL SERVICE FLOW ---');
    try {
        await emailService.sendWelcomeEmail(targetEmail, 'Sheldon', '123', 'http://localhost');
        console.log('✅ Flow completed successfully.');
    } catch (error: any) {
        console.error('❌ Flow failed with error:', error.message);
    }
}

debugFlow();
