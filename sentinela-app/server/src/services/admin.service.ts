import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

export class AdminService {
    async getAllTenants() {
        return prisma.tenant.findMany({
            include: {
                _count: {
                    select: {
                        users: true
                    }
                },
                users: {
                    select: {
                        subscriptionStatus: true,
                        currentPeriodEnd: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getSystemStats() {
        const [tenantCount, userCount, activeTenants] = await Promise.all([
            prisma.tenant.count(),
            prisma.user.count(),
            prisma.user.groupBy({
                by: ['tenantId'],
                where: { subscriptionStatus: 'active' }
            })
        ]);

        const totalActive = activeTenants.length;
        const estimatedMRR = totalActive * 499.00; // Valor fixo hipotético por hospital ativo

        return {
            totalTenants: tenantCount,
            totalUsers: userCount,
            activeSubscriptions: totalActive,
            estimatedMRR,
            currency: 'BRL'
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
                        subscriptionStatus: true,
                        currentPeriodEnd: true
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

    async updateTenantSubscription(tenantId: string, status: string, periodEnd?: Date) {
        return prisma.user.updateMany({
            where: { tenantId },
            data: {
                subscriptionStatus: status,
                currentPeriodEnd: periodEnd || null
            }
        });
    }

    async sendSalesEmail(email: string) {
        // Here we would integrate with EmailService to send a sales pitch
        console.log(`Simulating sales email send to: ${email}`);
        return true;
    }
}
