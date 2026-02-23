import { Incident, User } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class RiskManagerRepository {
    async create(tenantId: string, data: any) {
        return prisma.user.create({
            data: {
                ...data,
                tenantId
            },
        });
    }

    async findAll(tenantId: string) {
        return prisma.user.findMany({
            where: { tenantId },
            orderBy: {
                name: 'asc'
            }
        });
    }

    async findById(id: number, tenantId: string) {
        return prisma.user.findFirst({
            where: { id, tenantId }
        });
    }

    async update(id: number, tenantId: string, data: Partial<User>) {
        return prisma.user.update({
            where: { id, tenantId },
            data
        });
    }

    async delete(id: number, tenantId: string) {
        return prisma.user.delete({
            where: { id, tenantId }
        });
    }

    async findBySector(sector: string, tenantId: string) {
        // Since sectors are stored as JSON string or comma-separated, we need to fetch all for the tenant and filter in app
        const allUsers = await this.findAll(tenantId);

        return allUsers.find(user => {
            if (!user.sectors) return false;

            try {
                // Try parsing as JSON array
                const sectors = JSON.parse(user.sectors);
                if (Array.isArray(sectors)) {
                    return sectors.includes(sector);
                }
            } catch (e) {
                // Fallback to simple string check (comma-separated or single value)
                if (user.sectors.includes(',')) {
                    return user.sectors.split(',').map(s => s.trim()).includes(sector);
                }
                return user.sectors === sector;
            }
            return false;
        });
    }
}
