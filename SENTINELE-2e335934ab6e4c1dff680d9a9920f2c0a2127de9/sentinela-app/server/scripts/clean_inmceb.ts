import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanInmceb() {
    const tenantId = '0ca52289-b1bf-431f-8790-bff3749420be';
    try {
        // Usando executeRaw para evitar problemas de tipagem/inicialização do Prisma local
        const deleted = await prisma.$executeRawUnsafe(
            `DELETE FROM "Incident" WHERE "tenantId" = $1`,
            tenantId
        );
        console.log(`✅ Sucesso! Removidas as notificações do tenant INMCEB.`);
    } catch (err) {
        console.error(`❌ Erro ao limpar notificações:`, err);
    } finally {
        await prisma.$disconnect();
    }
}

cleanInmceb();
