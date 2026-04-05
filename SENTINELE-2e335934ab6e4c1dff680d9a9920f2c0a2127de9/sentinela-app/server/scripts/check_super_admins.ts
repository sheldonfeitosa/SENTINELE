import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuperAdmins() {
    try {
        const superAdmins = await prisma.user.findMany({
            where: { role: 'SUPER_ADMIN' },
            select: { email: true, name: true, role: true }
        });
        console.log('Super Admins found:', JSON.stringify(superAdmins, null, 2));
    } catch (err) {
        console.error('Error checking super admins:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkSuperAdmins();
