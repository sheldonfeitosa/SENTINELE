import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'sheldonfeitosa@gmail.com';
    const newPassword = process.argv[2] || 'Sentinela@2024';

    console.log('🔐 Reset de Senha - Sentinela AI');
    console.log('==================================');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Nova senha: ${newPassword}\n`);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('❌ Usuário não encontrado:', email);
        await prisma.$disconnect();
        return;
    }

    console.log(`✅ Usuário encontrado: ${user.name} | Role: ${user.role}`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { email },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        }
    });

    console.log('\n✅ SENHA RESETADA COM SUCESSO!');
    console.log('==================================');
    console.log(`📧 Email:  ${email}`);
    console.log(`🔑 Senha:  ${newPassword}`);
    console.log(`🌐 Login:  https://sentinelaai.com.br`);
    console.log('\nAcesse o sistema com as credenciais acima.');
}

main()
    .catch(e => {
        console.error('❌ Erro:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
