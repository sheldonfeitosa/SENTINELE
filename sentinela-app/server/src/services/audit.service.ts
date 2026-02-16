import { prisma } from '../lib/prisma';

export interface AuditLogData {
    action: string;
    resource: string;
    resourceId?: number;
    userId?: number;
    tenantId: string;
    details?: any;
    ipAddress?: string;
}

export class AuditService {
    /**
     * Creates a new audit log entry.
     * This is designed to be fire-and-forget to avoid blocking the main request flow.
     */
    async log(data: AuditLogData) {
        try {
            // @ts-ignore - Prisma client property might not be synced in editor
            await prisma.auditLog.create({
                data: {
                    action: data.action,
                    resource: data.resource,
                    resourceId: data.resourceId,
                    userId: data.userId,
                    tenantId: data.tenantId,
                    details: data.details || {},
                    ipAddress: data.ipAddress
                }
            });
            console.log(`[AuditLog] ${data.action} on ${data.resource} (Tenant: ${data.tenantId})`);
        } catch (error) {
            console.error('[AuditLog Error] Failed to create log entry:', error);
        }
    }
}

export const auditService = new AuditService();
