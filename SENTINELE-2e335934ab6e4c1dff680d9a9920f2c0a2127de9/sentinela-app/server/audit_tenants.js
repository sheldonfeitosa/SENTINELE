const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- RESTANTE NO DB ---');
    const incidents = await prisma.incident.findMany({
        include: { tenant: true }
    });

    for (const i of incidents) {
        console.log(`ID: ${i.id} | Paciente: ${i.patientName} | Tenant: ${i.tenant.name} (${i.tenantId})`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
