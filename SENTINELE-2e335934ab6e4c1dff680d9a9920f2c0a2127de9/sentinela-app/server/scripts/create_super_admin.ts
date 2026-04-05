import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'sheldonfeitosa@gmail.com';
    const name = 'Sheldon Feitosa';
    const newPassword = 'Sentinela@2024';

    console.log('🚀 Create/Fix SUPER_ADMIN - Production');
    console.log('======================================');
    console.log(`📧 Email: ${email}`);

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        console.log(`✅ Usuário encontrado: ${user.name} | Role: ${user.role}`);
        // Just reset password and ensure SUPER_ADMIN role
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user = await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                resetToken: null,
                resetTokenExpiry: null,
            }
        });
        console.log('✅ Senha e role atualizados!');
    } else {
        console.log('⚠️  Usuário NÃO encontrado. Criando...');

        // Find or create a tenant for SUPER_ADMIN
        let tenant = await prisma.tenant.findUnique({ where: { slug: 'sentinela-admin' } });
        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: { name: 'Sentinela AI Admin', slug: 'sentinela-admin' }
            });
            console.log(`✅ Tenant criado: ${tenant.name}`);
        } else {
            console.log(`✅ Tenant existente: ${tenant.name}`);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                tenantId: tenant.id,
            }
        });
        console.log(`✅ Usuário criado com sucesso!`);
    }

    console.log('\n======================================');
    console.log('  CREDENCIAIS DE ACESSO (PRODUÇÃO)');
    console.log('======================================');
    console.log(`📧 Email:  ${email}`);
    console.log(`🔑 Senha:  ${newPassword}`);
    console.log(`👤 Role:   ${user.role}`);
    console.log(`🌐 Login:  https://sentinelaai.com.br`);
    console.log('======================================');
}

main()
    .catch(e => {
        console.error('❌ Erro:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
