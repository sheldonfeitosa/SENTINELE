import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteLastTwo() {
    try {
        const tenantId = '0ca52289-b1bf-431f-8790-bff3749420be';

        // Deleta os 2 mais recentes para esse tenant
        const deleted = await prisma.$executeRaw`
      DELETE FROM "Incident" 
      WHERE id IN (
        SELECT id FROM "Incident" 
        WHERE "tenantId" = ${tenantId} 
        ORDER BY "createdAt" DESC 
        LIMIT 2
      )
    `;

        console.log(`✅ Sucesso: ${deleted} notificações removidas.`);
    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        await prisma.$disconnect();
    }
}

deleteLastTwo();
