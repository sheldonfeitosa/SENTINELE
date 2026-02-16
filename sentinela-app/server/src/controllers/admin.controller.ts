import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AdminService } from '../services/admin.service';
import { auditService } from '../services/audit.service';

export class AdminController {
    private service: AdminService;

    constructor() {
        this.service = new AdminService();
    }

    getTenants = async (req: AuthRequest, res: Response) => {
        try {
            const tenants = await this.service.getAllTenants();
            res.json(tenants);
        } catch (error: any) {
            console.error('[Admin] getTenants error:', error);
            res.status(500).json({ error: 'Erro ao buscar hospitais' });
        }
    };

    getStats = async (req: AuthRequest, res: Response) => {
        try {
            const stats = await this.service.getSystemStats();
            res.json(stats);
        } catch (error: any) {
            console.error('[Admin] getStats error:', error);
            res.status(500).json({ error: 'Erro ao buscar estatísticas do sistema' });
        }
    };

    getTenantsWithUsers = async (req: AuthRequest, res: Response) => {
        try {
            const data = await this.service.getTenantsWithUsers();
            res.json(data);
        } catch (error: any) {
            console.error('[Admin] getTenantsWithUsers error:', error);
            res.status(500).json({ error: 'Erro ao buscar usuários dos hospitais' });
        }
    };

    resetPassword = async (req: AuthRequest, res: Response) => {
        try {
            const { userId, newPassword } = req.body;
            if (!userId || !newPassword) {
                return res.status(400).json({ error: 'userId e newPassword são obrigatórios.' });
            }
            await this.service.updateUserPassword(userId, newPassword);

            auditService.log({
                action: 'ADMIN_RESET_PASSWORD',
                resource: 'User',
                resourceId: userId,
                userId: req.user?.userId,
                tenantId: 'SUPER_ADMIN', // Administrative action
                ipAddress: req.ip,
                details: { targetUserId: userId }
            });

            res.json({ message: 'Senha atualizada com sucesso.' });
        } catch (error: any) {
            console.error('[Admin] resetPassword error:', error);
            res.status(500).json({ error: 'Erro ao resetar senha' });
        }
    };

    updateSubscription = async (req: AuthRequest, res: Response) => {
        try {
            const { tenantId, status, periodEnd } = req.body;
            if (!tenantId || !status) {
                return res.status(400).json({ error: 'tenantId e status são obrigatórios.' });
            }
            await this.service.updateTenantSubscription(tenantId, status, periodEnd ? new Date(periodEnd) : undefined);
            res.json({ message: 'Assinatura atualizada com sucesso.' });
        } catch (error: any) {
            console.error('[Admin] updateSubscription error:', error);
            res.status(500).json({ error: 'Erro ao atualizar assinatura' });
        }
    };

    sendSalesEmail = async (req: AuthRequest, res: Response) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email é obrigatório.' });
            }
            await this.service.sendSalesEmail(email);
            res.json({ message: 'E-mail de prospecção enviado com sucesso.' });
        } catch (error: any) {
            console.error('[Admin] sendSalesEmail error:', error);
            res.status(500).json({ error: 'Erro ao enviar e-mail de prospecção' });
        }
    };

    createUser = async (req: AuthRequest, res: Response) => {
        try {
            const { name, email, password, role, tenantId } = req.body;
            if (!name || !email || !password || !role || !tenantId) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
            }
            const user = await this.service.createAdminUser({ name, email, password, role, tenantId });

            auditService.log({
                action: 'ADMIN_CREATE_USER',
                resource: 'User',
                resourceId: user.id,
                userId: req.user?.userId,
                tenantId: 'SUPER_ADMIN',
                ipAddress: req.ip,
                details: { createdUserEmail: email, targetTenantId: tenantId }
            });

            res.status(201).json(user);
        } catch (error: any) {
            console.error('[Admin] createUser error:', error);
            res.status(500).json({ error: 'Erro ao criar usuário' });
        }
    };

    deleteUser = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
            }
            await this.service.deleteAdminUser(Number(id));

            auditService.log({
                action: 'ADMIN_DELETE_USER',
                resource: 'User',
                resourceId: Number(id),
                userId: req.user?.userId,
                tenantId: 'SUPER_ADMIN',
                ipAddress: req.ip
            });

            res.json({ message: 'Usuário excluído com sucesso.' });
        } catch (error: any) {
            console.error('[Admin] deleteUser error:', error);
            res.status(500).json({ error: 'Erro ao excluir usuário' });
        }
    };

    deleteTenant = async (req: AuthRequest, res: Response) => {
        try {
            const id = req.params.id as string;
            if (!id) {
                return res.status(400).json({ error: 'ID do hospital é obrigatório.' });
            }
            await this.service.deleteTenant(id);

            auditService.log({
                action: 'ADMIN_DELETE_TENANT',
                resource: 'Tenant',
                tenantId: 'SUPER_ADMIN',
                ipAddress: req.ip,
                details: { deletedTenantId: id }
            });

            res.json({ message: 'Hospital e todos os dados associados foram excluídos com sucesso.' });
        } catch (error: any) {
            console.error('[Admin] deleteTenant error:', error);
            res.status(500).json({ error: 'Erro ao excluir hospital' });
        }
    };

    getAuditLogs = async (req: AuthRequest, res: Response) => {
        try {
            const tenantId = req.user?.tenantId;
            const role = req.user?.role;

            if (!tenantId || !role) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const logs = await this.service.getAuditLogs(tenantId, role);
            res.json(logs);
        } catch (error: any) {
            console.error('[Admin] getAuditLogs error:', error);
            res.status(500).json({ error: 'Erro ao buscar logs de auditoria' });
        }
    };
}
