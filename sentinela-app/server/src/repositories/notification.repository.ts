import { PrismaClient, Incident } from '@prisma/client';

const prisma = new PrismaClient();
// Force recompile

export class NotificationRepository {
    async create(data: Omit<Incident, 'id' | 'createdAt' | 'status'>) {
        return prisma.incident.create({
            data,
        });
    }

    async findAll() {
        return prisma.incident.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async update(id: number, data: Partial<Incident>) {
        return prisma.incident.update({
            where: { id },
            data
        });
    }

    async findById(id: number) {
        return prisma.incident.findUnique({
            where: { id }
        });
    }

    async findSimilarResolved(eventType: string, limit: number = 3) {
        return prisma.incident.findMany({
            where: {
                status: 'CONCLUIDO',
                OR: [
                    { type: { contains: eventType } },
                    { eventTypeAi: { contains: eventType } }
                ],
                rootCause: { not: null }, // Ensure it has useful content
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
