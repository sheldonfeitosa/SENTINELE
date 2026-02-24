import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
        where: {
            createdAt: {
                gte: today
            }
        },
        include: { tenant: true }
    });

    console.log(`Found ${users.length} users created today.`);
    users.forEach(u => {
        console.log(`- ${u.email} (${u.name}) - Tenant: ${u.tenant?.slug}`);
    });
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
