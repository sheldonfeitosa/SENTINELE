import { Request, Response } from 'express';
import { RiskManagerService } from '../services/risk-manager.service';

export class RiskManagerController {
    private service: RiskManagerService;

    constructor() {
        this.service = new RiskManagerService();
    }

    create = async (req: Request, res: Response) => {
        try {
            const tenantId = (req as any).user.tenantId;

            const managerData = {
                ...req.body,
                tenantId
            };

            const manager = await this.service.createManager(tenantId, managerData);
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
            const tenantId = (req as any).user.tenantId;
            const managers = await this.service.getAllManagers(tenantId);
            res.json(managers);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch managers' });
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const manager = await this.service.getManagerById(id, tenantId);

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
            const tenantId = (req as any).user.tenantId;
            const manager = await this.service.updateManager(id, tenantId, req.body);
            res.json(manager);
        } catch (error: any) {
            console.error('UPDATE MANAGER ERROR:', error.message);
            res.status(500).json({ error: 'Failed to update manager', details: error.message });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            await this.service.deleteManager(id, tenantId);
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete manager' });
        }
    };
}
