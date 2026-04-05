import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDb() {
    try {
        const tenants = await prisma.tenant.findMany();
        console.log('--- Tenants ---');
        console.log(JSON.stringify(tenants, null, 2));

        const counts = await prisma.incident.groupBy({
            by: ['tenantId'],
            _count: {
                _all: true
            }
        });
        console.log('--- Incident Counts by Tenant ---');
        console.log(JSON.stringify(counts, null, 2));

        const totalIncidents = await prisma.incident.count();
        console.log(`\nTotal Incidents in DB: ${totalIncidents}`);

    } catch (err) {
        console.error('Error checking DB:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkDb();
