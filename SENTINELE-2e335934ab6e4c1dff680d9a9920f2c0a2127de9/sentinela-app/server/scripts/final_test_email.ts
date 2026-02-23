
import { prisma } from '../src/lib/prisma';
import { EmailService } from '../src/services/email.service';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function findAndForward() {
    console.log('--- Buscando Incidente Real para Teste de Email ---');
    const emailService = new EmailService();

    try {
        const incident = await prisma.incident.findFirst({
            orderBy: { id: 'desc' }
        });

        if (!incident) {
            console.error('❌ Nenhum incidente encontrado no banco de dados.');
            return;
        }

        console.log(`✅ Incidente encontrado: ID #${incident.id} (Setor: ${incident.sector})`);
        const testEmail = 'sheldonfeitosa@gmail.com';

        console.log(`📧 Enviando encaminhamento para: ${testEmail}...`);
        await emailService.sendActionRequest(incident, testEmail);
        console.log('🏁 Teste concluído com sucesso!');
    } catch (error: any) {
        console.error('❌ Erro durante o processo:', error.message || error);
    } finally {
        await prisma.$disconnect();
    }
}

findAndForward();
