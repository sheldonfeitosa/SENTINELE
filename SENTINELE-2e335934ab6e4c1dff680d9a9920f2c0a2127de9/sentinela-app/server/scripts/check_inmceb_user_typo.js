
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'sheldon@inmceb.med.br' }
    });
    console.log('User sheldon@inmceb.med.br:', user);

    const allUsers = await prisma.user.findMany({
        select: { email: true, role: true }
    });
    console.log('All Users:', allUsers);
}

main().finally(() => prisma.$disconnect());
