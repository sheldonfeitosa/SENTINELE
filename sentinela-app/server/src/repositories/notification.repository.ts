import { Incident } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class NotificationRepository {
    async create(tenantId: string, data: Omit<Incident, 'id' | 'createdAt' | 'status' | 'tenantId'>) {
        return prisma.incident.create({
            data: {
                ...data,
                tenantId
            },
        });
    }

    async findAll(tenantId: string) {
        return prisma.incident.findMany({
            where: { tenantId },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async update(id: number, tenantId: string, data: Partial<Incident>) {
        return prisma.incident.update({
            where: { id, tenantId },
            data
        });
    }

    async findById(id: number, tenantId: string) {
        return prisma.incident.findFirst({
            where: {
                id,
                tenantId
            }
        });
    }

    async findSimilarResolved(tenantId: string, eventType: string, limit: number = 3) {
        return prisma.incident.findMany({
            where: {
                tenantId,
                status: 'CONCLUIDO',
                OR: [
                    { type: { contains: eventType } },
                    { eventTypeAi: { contains: eventType } }
                ],
                rootCause: { not: null },
                actionPlan: { not: null }
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                description: true,
                rootCause: true,
                actionPlan: true,
                riskLevel: true
            }
        });
    }
}
