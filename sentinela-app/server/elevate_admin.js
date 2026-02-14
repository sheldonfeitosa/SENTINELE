const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'sheldonfeitosa@gmail.com';
    console.log(`Elevando usuário ${email} para SUPER_ADMIN...`);

    try {
        const user = await prisma.user.update({
            where: { email: email },
            data: { role: 'SUPER_ADMIN' }
        });
        console.log(`Sucesso! Role atual de ${user.email}: ${user.role}`);
    } catch (error) {
        console.error('Erro ao elevar usuário:', error.message);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
