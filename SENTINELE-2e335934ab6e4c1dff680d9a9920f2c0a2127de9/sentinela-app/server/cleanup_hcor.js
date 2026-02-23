const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const INMCEB_ID = '0ca52289-b1bf-431f-8790-bff3749420be';
    console.log(`--- LIMPANDO TENANT INMCEB (${INMCEB_ID}) ---`);

    const deleted = await prisma.incident.deleteMany({
        where: { tenantId: INMCEB_ID }
    });

    console.log(`Sucesso! ${deleted.count} incidentes de teste removidos.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
