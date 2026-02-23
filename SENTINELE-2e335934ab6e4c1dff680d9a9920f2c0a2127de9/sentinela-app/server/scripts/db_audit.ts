
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DB AUDIT START ---');

    const tenants = await prisma.tenant.findMany({
        include: {
            _count: {
                select: { users: true, incidents: true }
            }
        }
    });

    console.log('\nTENANTS FOUND:');
    tenants.forEach(t => {
        console.log(`[${t.name}] ID: ${t.id} | Users: ${t._count.users} | Incidents: ${t._count.incidents}`);
    });

    const users = await prisma.user.findMany({
        select: { email: true, tenantId: true, tenant: { select: { name: true } } }
    });

    console.log('\nUSERS FOUND:');
    users.forEach(u => {
        console.log(`- ${u.email} | TenantID: ${u.tenantId} (${u.tenant.name})`);
    });

    console.log('\n--- DB AUDIT END ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
