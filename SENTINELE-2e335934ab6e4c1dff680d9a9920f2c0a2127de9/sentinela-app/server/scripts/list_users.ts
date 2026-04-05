import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllUsers() {
    try {
        const users = await prisma.user.findMany({
            select: { email: true, role: true, name: true, tenantId: true }
        });
        console.log('All Users:', JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Error checking users:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllUsers();
