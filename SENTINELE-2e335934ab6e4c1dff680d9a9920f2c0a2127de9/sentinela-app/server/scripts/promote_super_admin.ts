import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteToSuperAdmin() {
    const email = 'sheldonfeitosa@gmail.com';
    try {
        const user = await prisma.user.update({
            where: { email: email },
            data: { role: 'SUPER_ADMIN' }
        });
        console.log(`✅ Sucesso! O usuário ${user.email} agora é SUPER_ADMIN.`);
    } catch (err) {
        console.error(`❌ Erro ao promover usuário:`, err);
    } finally {
        await prisma.$disconnect();
    }
}

promoteToSuperAdmin();
