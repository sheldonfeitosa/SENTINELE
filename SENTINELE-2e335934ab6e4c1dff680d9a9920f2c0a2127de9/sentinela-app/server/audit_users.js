const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DEFINITIVE USER AUDIT ---');
    const users = await prisma.user.findMany({
        include: { tenant: true }
    });

    for (const u of users) {
        console.log(`Email: ${u.email} | TenantName: "${u.tenant.name}" | TenantID: ${u.tenantId}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
