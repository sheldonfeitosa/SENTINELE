import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'sheldonfeitosa@gmail.com';
    const newPassword = '123456';

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await prisma.user.update({
            where: { email: email },
            data: {
                password: hashedPassword,
                role: 'SUPER_ADMIN' // Ensuring role is correct too
            }
        });

        console.log(`✅ Sucesso! Senha do usuário ${user.email} foi resetada para: ${newPassword}`);
    } catch (err) {
        console.error(`❌ Erro ao resetar senha:`, err);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
