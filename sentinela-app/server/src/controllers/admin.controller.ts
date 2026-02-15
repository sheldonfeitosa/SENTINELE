import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AdminService } from '../services/admin.service';

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
            res.status(500).json({ error: 'Erro ao buscar hospitais', details: error.message });
        }
    };

    getStats = async (req: AuthRequest, res: Response) => {
        try {
            const stats = await this.service.getSystemStats();
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao buscar estatísticas do sistema', details: error.message });
        }
    };

    getTenantsWithUsers = async (req: AuthRequest, res: Response) => {
        try {
            const data = await this.service.getTenantsWithUsers();
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao buscar usuários dos hospitais', details: error.message });
        }
    };

    resetPassword = async (req: AuthRequest, res: Response) => {
        try {
            const { userId, newPassword } = req.body;
            if (!userId || !newPassword) {
                return res.status(400).json({ error: 'userId e newPassword são obrigatórios.' });
            }
            await this.service.updateUserPassword(userId, newPassword);
            res.json({ message: 'Senha atualizada com sucesso.' });
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao resetar senha', details: error.message });
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
            res.status(500).json({ error: 'Erro ao atualizar assinatura', details: error.message });
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
            res.status(500).json({ error: 'Erro ao enviar e-mail de prospecção', details: error.message });
        }
    };

    createUser = async (req: AuthRequest, res: Response) => {
        try {
            const { name, email, password, role, tenantId } = req.body;
            if (!name || !email || !password || !role || !tenantId) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
            }
            const user = await this.service.createAdminUser({ name, email, password, role, tenantId });
            res.status(201).json(user);
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao criar usuário', details: error.message });
        }
    };

    deleteUser = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
            }
            await this.service.deleteAdminUser(Number(id));
            res.json({ message: 'Usuário excluído com sucesso.' });
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao excluir usuário', details: error.message });
        }
    };

    deleteTenant = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'ID do hospital é obrigatório.' });
            }
            await this.service.deleteTenant(id);
            res.json({ message: 'Hospital e todos os dados associados foram excluídos com sucesso.' });
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao excluir hospital', details: error.message });
        }
    };
}
