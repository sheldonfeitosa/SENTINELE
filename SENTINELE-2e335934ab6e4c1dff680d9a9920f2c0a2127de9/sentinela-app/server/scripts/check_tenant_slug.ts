import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTenantSlug() {
    const tenant = await prisma.tenant.findUnique({
        where: { id: '0ca52289-b1bf-431f-8790-bff3749420be' }
    });

    if (tenant) {
        console.log(`Tenant Name: ${tenant.name}`);
        console.log(`Tenant Slug: ${tenant.slug}`);
    } else {
        console.log('Tenant not found.');
    }
}

checkTenantSlug().catch(console.error).finally(() => prisma.$disconnect());
