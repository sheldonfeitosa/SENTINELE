
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const managers = await prisma.user.findMany({
        where: {
            role: 'ALTA_GESTAO'
        },
        include: {
            tenant: true
        }
    });
    console.log('--- USERS WITH ALTA_GESTAO ROLE ---');
    console.log(JSON.stringify(managers, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
