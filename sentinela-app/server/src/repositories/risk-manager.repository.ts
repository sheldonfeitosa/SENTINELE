import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

export class RiskManagerRepository {
    async create(data: any) {
        return prisma.user.create({
            data,
        });
    }

    async findAll(tenantId?: string) {
        return prisma.user.findMany({
            where: tenantId ? { tenantId } : {},
            orderBy: {
                name: 'asc'
            }
        });
    }

    async findById(id: number) {
        return prisma.user.findUnique({
            where: { id }
        });
    }

    async update(id: number, data: Partial<User>) {
        return prisma.user.update({
            where: { id },
            data
        });
    }

    async delete(id: number) {
        return prisma.user.delete({
            where: { id }
        });
    }

    async findBySector(sector: string) {
        // Since sectors are stored as JSON string or comma-separated, we need to fetch all and filter in app
        // Ideally, this should be normalized in DB, but for now we handle it here.
        const allUsers = await this.findAll();

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
