
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
    try {
        const hashedPassword = await bcrypt.hash('sentinela123', 10);
        const email = 'qualidade@inmceb.med.br';
        const tenantSlug = 'inmceb';

        const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
        if (!tenant) {
            console.log('Tenant not found');
            return;
        }

        const user = await prisma.user.upsert({
            where: { email: email },
            update: {
                password: hashedPassword,
                tenantId: tenant.id
            },
            create: {
                email: email,
                password: hashedPassword,
                name: 'Gestão da Qualidade',
                role: 'ADMIN',
                tenantId: tenant.id
            }
        });

        console.log(`✅ Usuário ${email} criado/atualizado com sucesso!`);
        console.log(`🔑 Senha: sentinela123`);
        console.log(`🏢 Cliente: ${tenant.name}`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
