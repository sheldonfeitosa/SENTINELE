import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

export class AdminService {
    async getAllTenants() {
        return prisma.tenant.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        incidents: true
                    }
                },
                users: {
                    take: 1,
                    select: {
                        subscriptionStatus: true,
                        currentPeriodEnd: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getAllIncidents() {
        return prisma.incident.findMany({
            include: {
                tenant: {
                    select: {
                        name: true,
                        slug: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 500 // Limit for performance, can add pagination later
        });
    }

    async getSystemStats() {
        const [tenantCount, incidentCount, userCount] = await Promise.all([
            prisma.tenant.count(),
            prisma.incident.count(),
            prisma.user.count()
        ]);

        return {
            totalTenants: tenantCount,
            totalIncidents: incidentCount,
            totalUsers: userCount
        };
    }

    async getTenantsWithUsers() {
        return prisma.tenant.findMany({
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        subscriptionStatus: true
                    }
                }
            }
        });
    }

    async updateUserPassword(userId: number, newPassword: string) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        return prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
    }

    async updateIncidentDeadline(incidentId: number, newDeadline: Date) {
        return prisma.incident.update({
            where: { id: incidentId },
            data: { actionPlanDeadline: newDeadline }
        });
    }

    async updateTenantSubscription(tenantId: string, status: string, periodEnd?: Date) {
        // Technically subscription is per user in the current schema, so we update all users of that tenant
        return prisma.user.updateMany({
            where: { tenantId },
            data: {
                subscriptionStatus: status,
                currentPeriodEnd: periodEnd || null
            }
        });
    }
}
