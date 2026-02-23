import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'sheldonfeitosa@gmail.com';
    const newPassword = 'sentinela123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });
        console.log(`✅ Senha resetada com sucesso para ${email}`);
        console.log(`Nova senha definida: ${newPassword}`);
    } else {
        console.log(`❌ Usuário ${email} não encontrado.`);
    }
}

resetPassword().catch(console.error).finally(() => prisma.$disconnect());
