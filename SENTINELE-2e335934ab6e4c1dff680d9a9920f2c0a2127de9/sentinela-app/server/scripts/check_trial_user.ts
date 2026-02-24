import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const email = 'qualidadeinmceb@gmail.com';
    console.log(`Searching for email: [${email}]`);
    const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
    });

    if (!user) {
        console.log('>>> RESULT: USER_NOT_FOUND');
    } else {
        console.log('>>> RESULT: USER_FOUND');
        console.log(`- Email: ${user.email}`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Tenant Slug: ${user.tenant?.slug}`);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
