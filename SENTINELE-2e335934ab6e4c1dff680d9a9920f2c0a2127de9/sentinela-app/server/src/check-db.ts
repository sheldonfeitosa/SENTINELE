
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- DB Check ---');
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants:', JSON.stringify(tenants, null, 2));

    const users = await prisma.user.findMany({
        select: { email: true, role: true, name: true, tenantId: true }
    });
    console.log('Users:', JSON.stringify(users, null, 2));

    const incidentsCount = await prisma.incident.count();
    console.log('Total Incidents:', incidentsCount);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
