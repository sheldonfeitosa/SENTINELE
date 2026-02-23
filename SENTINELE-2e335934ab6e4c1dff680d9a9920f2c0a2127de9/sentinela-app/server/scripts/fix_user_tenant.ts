
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userEmail = 'qualidade@inmceb.med.br';
    const targetTenantName = 'INMCEB';

    const tenant = await prisma.tenant.findFirst({
        where: { name: targetTenantName }
    });

    if (!tenant) {
        console.error(`Tenant ${targetTenantName} not found`);
        return;
    }

    const user = await prisma.user.findUnique({
        where: { email: userEmail }
    });

    if (!user) {
        console.error(`User ${userEmail} not found`);
        return;
    }

    console.log(`Moving user ${userEmail} from tenant ${user.tenantId} to ${tenant.id} (${tenant.name})`);

    await prisma.user.update({
        where: { email: userEmail },
        data: { tenantId: tenant.id }
    });

    console.log('Migration completed successfully.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
