
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { NotificationService } from '../src/services/notification.service';

async function testManualForward() {
    console.log('--- Testando Encaminhamento Direto via Serviço ---');
    const service = new NotificationService();

    const testEmail = 'sheldofeitosa@gmail.com';
    const notificationId = 1; // ID que geralmente existe
    const tenantId = '6626639d-2150-4d4b-97e3-080c54170e9b'; // Tenant do reset-qualidade

    try {
        console.log(`🚀 Chamando forwardToSector para ID #${notificationId} e e-mail ${testEmail}`);
        const result = await service.forwardToSector(notificationId, tenantId, testEmail);
        console.log('✅ Resultado:', result);
    } catch (error) {
        console.error('❌ Erro no teste manual:', error.message);
    }
}

testManualForward();
