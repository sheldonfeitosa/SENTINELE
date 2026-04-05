import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteLastTwoNotifications() {
    try {
        console.log('Buscando as duas últimas notificações do INMCEB...');

        // The ID of the INMCEB tenant we restored earlier
        const tenantId = '0ca52289-b1bf-431f-8790-bff3749420be';

        const lastTwo = await prisma.notification.findMany({
            where: { tenantId: tenantId },
            orderBy: { createdAt: 'desc' },
            take: 2,
            select: { id: true, createdAt: true, description: true }
        });

        if (lastTwo.length === 0) {
            console.log('Nenhuma notificação encontrada para excluir.');
            return;
        }

        console.log('Notificações a serem excluídas:', lastTwo);

        const idsToDelete = lastTwo.map(n => n.id);

        const result = await prisma.notification.deleteMany({
            where: {
                id: { in: idsToDelete }
            }
        });

        console.log(`✅ Sucesso! Foram apagadas ${result.count} notificações.`);

    } catch (err) {
        console.error('❌ Erro ao apagar notificações:', err);
    } finally {
        await prisma.$disconnect();
    }
}

deleteLastTwoNotifications();
