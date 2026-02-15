import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: { tenant: true }
    });

    console.log('--- ALL USERS ---');
    users.forEach(u => {
        console.log(`Email: ${u.email} | Role: ${u.role} | Tenant: ${u.tenant?.slug || 'NONE'}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
