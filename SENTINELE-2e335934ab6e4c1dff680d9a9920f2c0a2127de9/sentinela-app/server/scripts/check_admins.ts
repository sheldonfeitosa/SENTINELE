import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdmins() {
    const users = await prisma.user.findMany({
        where: { role: 'ADMIN' }
    });
    console.log('--- ADMIN USERS ---');
    users.forEach(u => {
        console.log(`Email: ${u.email}, TenantId: ${u.tenantId}`);
    });

    // Check total users count
    const total = await prisma.user.count();
    console.log(`\nTotal users in DB: ${total}`);
}

checkAdmins().catch(console.error).finally(() => prisma.$disconnect());
