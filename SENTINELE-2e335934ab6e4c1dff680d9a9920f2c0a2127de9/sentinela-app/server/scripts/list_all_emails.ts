
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user.count();
    console.log('TOTAL USERS:', count);
    const users = await prisma.user.findMany();
    users.forEach(u => console.log('EMAIL:', u.email));
}

main().catch(console.error).finally(() => prisma.$disconnect());
