import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        take: 10
    });
    console.log('Users sectors format:');
    users.forEach(u => {
        console.log(`Email: ${u.email}, Role: ${u.role}, Sectors: ${u.sectors}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
