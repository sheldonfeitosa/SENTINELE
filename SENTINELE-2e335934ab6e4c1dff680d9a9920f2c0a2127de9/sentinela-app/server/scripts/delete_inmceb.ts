import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function clearINMCEB() {
    const tenantId = '0ca52289-b1bf-431f-8790-bff3749420be';
    try {
        console.log('Starting deletion process for tenant: INMCEB (', tenantId, ')');

        // Delete all incidents
        console.log('Deleting incidents...');
        await p.incident.deleteMany({ where: { tenantId } });

        // Delete all sectors
        console.log('Deleting sectors...');
        await p.sector.deleteMany({ where: { tenantId } });

        // First find users to delete their articles
        const users = await p.user.findMany({
            where: { tenantId, role: { not: 'SUPER_ADMIN' } },
            select: { id: true }
        });
        const userIds = users.map(u => u.id);

        if (userIds.length > 0) {
            console.log(`Found ${userIds.length} users. Deleting their articles...`);
            await p.article.deleteMany({ where: { authorId: { in: userIds } } });
        }

        console.log('Deleting users (ignoring SUPER_ADMINs)...');
        await p.user.deleteMany({
            where: {
                tenantId: tenantId,
                role: { not: 'SUPER_ADMIN' }
            }
        });

        console.log('Deleting tenant...');
        await p.tenant.delete({ where: { id: tenantId } });

        console.log('✅ All INMCEB data successfully deleted!');
    } catch (error) {
        console.error('❌ Error during deletion:', error);
    } finally {
        await p.$disconnect();
    }
}

clearINMCEB();
