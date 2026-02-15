import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: 'c:\\Users\\sheld\\sentinela ai\\sentinela-app\\server\\.env' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenants = await prisma.tenant.findMany({
        include: {
            _count: {
                select: { incidents: true, users: true }
            }
        }
    });

    console.log('--- TENANTS STATUS ---');
    tenants.forEach(t => {
        console.log(`Slug: ${t.slug} | ID: ${t.id} | Incidents: ${t._count.incidents} | Users: ${t._count.users}`);
    });

    const adminUser = await prisma.user.findUnique({
        where: { email: 'sheldonfeitosa@gmail.com' },
        include: { tenant: true }
    });

    console.log('\n--- ADMIN USER DB STATUS ---');
    console.log(`Email: ${adminUser?.email}`);
    console.log(`Role: ${adminUser?.role}`);
    console.log(`Tenant Slug: ${adminUser?.tenant?.slug}`);
    console.log(`Tenant ID: ${adminUser?.tenantId}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
