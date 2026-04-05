import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    try {
        const tenantId = '0ca52289-b1bf-431f-8790-bff3749420be';
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        console.log('Tenant:', JSON.stringify(tenant, null, 2));

        const incidents = await prisma.incident.findMany({
            where: { tenantId },
            select: { id: true, patientName: true, eventDate: true, createdAt: true }
        });
        console.log(`Found ${incidents.length} incidents for INMCEB.`);
        if (incidents.length > 0) {
            console.log('First 5 incidents sample:');
            console.log(JSON.stringify(incidents.slice(0, 5), null, 2));
        }

        const allIncidents = await prisma.incident.count();
        console.log(`Total incidents in entire DB: ${allIncidents}`);

        const users = await prisma.user.findMany({
            where: { email: 'qualidade@inmceb.med.br' },
            select: { id: true, email: true, tenantId: true }
        });
        console.log('User quality@inmceb:', JSON.stringify(users, null, 2));

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
