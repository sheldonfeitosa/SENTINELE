
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');

        // 1. Get default tenant
        const defaultTenant = await prisma.tenant.findFirst();

        if (!defaultTenant) {
            console.error('Error: No tenant found in the database. Cannot add sector.');
            process.exit(1);
        }

        console.log(`Found tenant: ${defaultTenant.name} (${defaultTenant.id})`);

        // 2. Check if sector exists
        const sectorName = 'OUTROS';
        const existingSector = await prisma.sector.findUnique({
            where: {
                name_tenantId: {
                    name: sectorName,
                    tenantId: defaultTenant.id
                }
            }
        });

        if (existingSector) {
            console.log(`Sector '${sectorName}' already exists. ID: ${existingSector.id}`);
        } else {
            // 3. Create sector
            const newSector = await prisma.sector.create({
                data: {
                    name: sectorName,
                    tenantId: defaultTenant.id
                }
            });
            console.log(`Successfully created sector '${sectorName}'. ID: ${newSector.id}`);
        }

    } catch (error) {
        console.error('Error executing script:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
