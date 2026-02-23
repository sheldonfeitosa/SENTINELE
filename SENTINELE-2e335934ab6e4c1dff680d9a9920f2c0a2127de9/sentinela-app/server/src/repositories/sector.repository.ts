import { prisma } from '../lib/prisma';

export class SectorRepository {
    async findAll(tenantId: string) {
        return prisma.sector.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' }
        });
    }

    async create(tenantId: string, name: string) {
        return prisma.sector.create({
            data: {
                name,
                tenantId: tenantId
            }
        });
    }

    async delete(id: number, tenantId: string) {
        return prisma.sector.delete({
            where: {
                id,
                tenantId
            }
        });
    }
}
