
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'inmceb' } });
    console.log('Tenant:', tenant);

    const users = await prisma.user.findMany({
        where: { tenantId: tenant.id }
    });
    console.log('Users for INMCEB:', users.map(u => ({ id: u.id, name: u.name, role: u.role, email: u.email })));
}

main().finally(() => prisma.$disconnect());
