import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { EmailService } from './email.service';

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

    async createAdminUser(data: { name: string; email: string; password: string; role: string; tenantId: string }) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                ...data,
                password: hashedPassword
            }
        });

        // Send Welcome Email with credentials
        try {
            const emailService = new EmailService();
            await emailService.sendWelcomeEmail(
                data.email,
                data.name,
                data.password, // Send the raw password so user can login
                process.env.APP_URL || 'http://localhost:5173'
            );
        } catch (error) {
            console.error('Failed to send welcome email to new admin user:', error);
            // Don't fail the request, just log
        }

        return user;
    }

    async deleteAdminUser(userId: number) {
        return prisma.user.delete({
            where: { id: userId }
        });
    }

    async deleteTenant(tenantId: string) {
        return prisma.$transaction(async (tx) => {
            // 1. Delete Articles associated with users of this tenant
            const users = await tx.user.findMany({
                where: { tenantId },
                select: { id: true }
            });
            const userIds = users.map(u => u.id);

            await tx.article.deleteMany({
                where: { authorId: { in: userIds } }
            });

            // 2. Delete Incidents
            await tx.incident.deleteMany({
                where: { tenantId }
            });

            // 3. Delete Sectors
            await tx.sector.deleteMany({
                where: { tenantId }
            });

            // 4. Delete Users
            await tx.user.deleteMany({
                where: { tenantId }
            });

            // 5. Delete Tenant
            return tx.tenant.delete({
                where: { id: tenantId }
            });
        });
    }

    async getAuditLogs(tenantId: string, role: string) {
        const query: any = {
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 200
        };

        if (role !== 'SUPER_ADMIN') {
            query.where = { tenantId };
        }

        // @ts-ignore
        return prisma.auditLog.findMany(query);
    }
}
