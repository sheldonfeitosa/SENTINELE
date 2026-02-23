
import { PrismaClient } from '@prisma/client';
import { EmailService } from '../src/services/email.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function runRealTest() {
    const emailService = new EmailService();
    const targetEmail = 'sheldonfeitosa@gmail.com';
    const tenantSlug = 'inmceb';

    console.log('--- ENVIANDO RODADA 2 DE TESTES (VERIFICAÇÃO FINAL) ---');

    try {
        // 1. Localizar o Tenant
        const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
        if (!tenant) throw new Error('Tenant INMCEB não encontrado');

        // 2. Criar uma Notificação Real no Banco
        const incident = await prisma.incident.create({
            data: {
                tenantId: tenant.id,
                patientName: "TESTE RODADA 2",
                description: "✅ LINK 100% CORRIGIDO. Este e-mail foi disparado para confirmar que o redirecionamento para https://sentinelaai.com.br está funcionando em todos os templates.",
                sector: "UTI",
                type: "INCIDENTE",
                riskLevel: "GRAVE",
                status: "Em Análise",
                eventDate: new Date(),
                notifySector: "ENFERMAGEM",
                aiAnalysis: "Recomenda-se revisão imediata dos protocolos de segurança."
            }
        });

        console.log(`✅ Notificação #${incident.id} criada no banco de dados.`);

        // 3. Disparar E-mail com o ID REAL
        console.log(`📧 Enviando e-mail para ${targetEmail}...`);

        // Simular o envio de notificação de incidente (que contém o link de tratativa)
        await emailService.sendIncidentNotification(incident, targetEmail);

        // Também enviar o e-mail de "Ação Necessária"
        await emailService.sendActionRequest({
            ...incident,
            description: "⚠️ ESTE É O TESTE COM O LINK CORRIGIDO! Se você clicar no botão abaixo, ele deve abrir o site oficial."
        }, targetEmail);

        console.log('--- 🏁 TESTE CONCLUÍDO ---');
        console.log(`O link no e-mail agora deve ser: https://sentinelaai.com.br/tratativa/${incident.id}`);

    } catch (error: any) {
        console.error('❌ ERRO NO TESTE:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

runRealTest();
