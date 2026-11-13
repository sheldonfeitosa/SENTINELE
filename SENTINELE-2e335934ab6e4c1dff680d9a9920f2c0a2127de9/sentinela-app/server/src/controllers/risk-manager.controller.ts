import { Request, Response } from 'express';
import { RiskManagerService } from '../services/risk-manager.service';
import { parseId, sendError } from '../lib/http';

export class RiskManagerController {
    private service: RiskManagerService;

    constructor() {
        this.service = new RiskManagerService();
    }

    create = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const manager = await this.service.createManager(user.tenantId, req.body, user.role);
            res.status(201).json(manager);
        } catch (error: any) {
            sendError(res, error, 'Falha ao criar gestor', 'CREATE MANAGER');
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const tenantId = (req as any).user.tenantId;
            const managers = await this.service.getAllManagers(tenantId);
            res.json(managers);
        } catch (error) {
            sendError(res, error, 'Falha ao buscar gestores', 'LIST MANAGERS');
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const manager = await this.service.getManagerById(id, tenantId);

            if (!manager) {
                res.status(404).json({ error: 'Gestor não encontrado' });
                return;
            }
            res.json(manager);
        } catch (error) {
            sendError(res, error, 'Falha ao buscar gestor', 'GET MANAGER');
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const user = (req as any).user;
            const manager = await this.service.updateManager(id, user.tenantId, req.body, user.role);
            res.json(manager);
        } catch (error: any) {
            sendError(res, error, 'Falha ao atualizar gestor', 'UPDATE MANAGER');
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            await this.service.deleteManager(id, tenantId);
            res.status(204).send();
        } catch (error) {
            sendError(res, error, 'Falha ao remover gestor', 'DELETE MANAGER');
        }
    };
}
