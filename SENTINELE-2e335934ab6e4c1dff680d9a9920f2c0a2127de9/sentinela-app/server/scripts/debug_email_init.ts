
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'DEFINED' : 'MISSING');

import { EmailService } from '../src/services/email.service';
const service = new EmailService();
console.log('Service initialized correctly');
