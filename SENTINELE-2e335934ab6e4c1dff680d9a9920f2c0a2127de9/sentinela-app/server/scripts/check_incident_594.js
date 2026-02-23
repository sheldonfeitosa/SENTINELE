
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const incident = await prisma.incident.findUnique({
        where: { id: 594 },
        include: { tenant: true }
    });
    console.log('Incident 594:', { id: incident.id, tenantId: incident.tenantId, tenantName: incident.tenant.name });
}

main().finally(() => prisma.$disconnect());
