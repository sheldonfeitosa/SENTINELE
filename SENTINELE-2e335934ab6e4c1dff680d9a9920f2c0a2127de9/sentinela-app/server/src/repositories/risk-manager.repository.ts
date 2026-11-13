import { User } from '@prisma/client';
import { prisma } from '../lib/prisma';

/** Campos que podem sair na API. NUNCA incluir password, resetToken ou tokens do LinkedIn. */
export const SAFE_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    sectors: true,
    tenantId: true,
    createdAt: true,
} as const;

export class RiskManagerRepository {
    async create(tenantId: string, data: any) {
        return prisma.user.create({
            data: {
                ...data,
                tenantId
            },
            select: SAFE_USER_SELECT,
        });
    }

    /** Uso interno (inclui todos os campos). Não devolver direto na API. */
    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email }
        });
    }

    async findAll(tenantId: string) {
        return prisma.user.findMany({
            where: { tenantId },
            select: SAFE_USER_SELECT,
            orderBy: {
                name: 'asc'
            }
        });
    }

    async findById(id: number, tenantId: string) {
        return prisma.user.findFirst({
            where: { id, tenantId },
            select: SAFE_USER_SELECT,
        });
    }

    async update(id: number, tenantId: string, data: Partial<User>) {
        return prisma.user.update({
            where: { id, tenantId },
            data,
            select: SAFE_USER_SELECT,
        });
    }

    async delete(id: number, tenantId: string) {
        return prisma.user.delete({
            where: { id, tenantId },
            select: { id: true },
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
