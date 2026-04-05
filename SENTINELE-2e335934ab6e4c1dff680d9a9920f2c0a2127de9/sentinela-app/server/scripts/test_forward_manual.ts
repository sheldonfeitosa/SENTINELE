
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { NotificationService } from '../src/services/notification.service';
import { prisma } from '../src/lib/prisma';

async function testManualForward() {
    console.log('--- Testando Encaminhamento Direto via Serviço ---');
    const service = new NotificationService();

    const testEmail = 'sheldon@inmceb.med.br';
    const notificationId = 668; // ID que geralmente existe
    const tenantId = '123'; // It needs the actual tenantId

    try {
        const incident = await prisma.incident.findUnique({ where: { id: notificationId } });
        if (!incident) {
           console.log("NOT FOUND IN DB");
           return;
        }

        console.log(`🚀 Chamando forwardToSector para ID #${notificationId} e e-mail ${testEmail}`);
        const result = await service.forwardToSector(notificationId, incident.tenantId, testEmail);
        console.log('✅ Resultado:', result);
    } catch (error: any) {
        console.error('❌ Erro no teste manual:', error.message);
    }
}

testManualForward();
