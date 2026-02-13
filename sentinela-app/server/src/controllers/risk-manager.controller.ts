import { Request, Response } from 'express';
import { RiskManagerService } from '../services/risk-manager.service';

export class RiskManagerController {
    private service: RiskManagerService;

    constructor() {
        this.service = new RiskManagerService();
    }

    create = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            if (!user || !user.tenantId) {
                return res.status(401).json({ error: 'User tenant context missing' });
            }

            const managerData = {
                ...req.body,
                tenantId: user.tenantId // Force tenantId from token
            };

            const manager = await this.service.createManager(managerData);
            res.status(201).json(manager);
        } catch (error: any) {
            console.error('CREATE MANAGER ERROR:', error);
            res.status(500).json({
                error: 'Failed to create manager',
                details: error.message || 'Unknown error'
            });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            if (!user || !user.tenantId) {
                return res.status(401).json({ error: 'User tenant context missing' });
            }

            console.log('RiskManagerController.getAll called for tenant:', user.tenantId);
            const managers = await this.service.getAllManagers(user.tenantId);
            res.json(managers);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch managers' });
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            // TODO: Verify if manager belongs to tenant
            const id = parseInt(req.params.id);
            const manager = await this.service.getManagerById(id);

            const user = (req as any).user;
            if (manager && manager.tenantId !== user.tenantId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            if (!manager) {
                res.status(404).json({ error: 'Manager not found' });
                return;
            }
            res.json(manager);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch manager' });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            // TODO: Verify if manager belongs to tenant before update
            const user = (req as any).user;
            const existing = await this.service.getManagerById(id);
            if (existing && existing.tenantId !== user.tenantId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const manager = await this.service.updateManager(id, req.body);
            res.json(manager);
        } catch (error: any) {
            console.error('UPDATE MANAGER ERROR:', error.message);
            res.status(500).json({ error: 'Failed to update manager', details: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            // TODO: Verify if manager belongs to tenant before delete
            const user = (req as any).user;
            const existing = await this.service.getManagerById(id);
            if (existing && existing.tenantId !== user.tenantId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            await this.service.deleteManager(id);
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete manager' });
        }
    };
}
