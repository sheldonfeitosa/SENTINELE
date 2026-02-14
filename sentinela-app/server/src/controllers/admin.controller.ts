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

    getIncidents = async (req: AuthRequest, res: Response) => {
        try {
            const incidents = await this.service.getAllIncidents();
            res.json(incidents);
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao buscar incidentes globais', details: error.message });
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

    updateDeadline = async (req: AuthRequest, res: Response) => {
        try {
            const { incidentId, newDeadline } = req.body;
            if (!incidentId || !newDeadline) {
                return res.status(400).json({ error: 'incidentId e newDeadline são obrigatórios.' });
            }
            await this.service.updateIncidentDeadline(incidentId, new Date(newDeadline));
            res.json({ message: 'Prazo atualizado com sucesso.' });
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao atualizar prazo', details: error.message });
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
}
