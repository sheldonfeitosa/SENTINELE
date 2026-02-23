
import { EmailService } from '../src/services/email.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testIntegrated() {
    const emailService = new EmailService();
    const targetEmail = 'sheldonfeitosa@gmail.com';

    console.log('--- TESTING INTEGRATED EMAIL SERVICE ---');
    try {
        console.log('Enviando e-mail de teste integrado...');
        await emailService.sendPasswordResetEmail(targetEmail, 'Sheldon Teste', 'https://sentinelaai.com.br/reset-password?token=123');
        console.log('✅ Chamada do serviço concluída sem erros.');
    } catch (error: any) {
        console.error('❌ Erro no serviço:', error.message);
    }
}

testIntegrated();
