
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
    try {
        const hashedPassword = await bcrypt.hash('sentinela123', 10);

        const emails = [
            'sheldonfeitosa@gmail.com',
            'sheldon@inmceb.med.br',
            'sheldonfeiotosa@gmail.com'
        ];

        for (const email of emails) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { password: hashedPassword }
                });
                console.log(`✅ Senha resetada para: ${email} (Nova senha: sentinela123)`);
            } else {
                console.log(`❌ Usuário não encontrado: ${email}`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
