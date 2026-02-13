import { prisma } from '../lib/prisma';

export class SectorRepository {
    async findAll() {
        return prisma.sector.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async create(name: string) {
        // SaaS: We need to know which tenant. For MVP/Demo, pick the first one.
        const defaultTenant = await prisma.tenant.findFirst();
        if (!defaultTenant) throw new Error('No tenant configured');

        return prisma.sector.create({
            data: {
                name,
                tenantId: defaultTenant.id
            }
        });
    }

    async delete(id: number) {
        return prisma.sector.delete({
            where: { id }
        });
    }
}
