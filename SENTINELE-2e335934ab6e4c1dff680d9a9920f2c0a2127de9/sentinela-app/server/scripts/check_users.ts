import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            include: {
                tenant: true
            }
        });
        console.log('--- Users ---');
        console.log(JSON.stringify(users, null, 2));

    } catch (err) {
        console.error('Error checking users:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
