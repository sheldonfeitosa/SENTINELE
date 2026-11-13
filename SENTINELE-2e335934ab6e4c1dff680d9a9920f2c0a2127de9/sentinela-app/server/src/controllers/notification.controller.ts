import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { sanitize } from '../lib/sanitizer';
import { parseId, sendError } from '../lib/http';

export class NotificationController {
    private service: NotificationService;

    constructor() {
        this.service = new NotificationService();
    }

    create = async (req: Request, res: Response) => {
        try {
            const data = sanitize(req.body);
            const authTenantId = (req as any).user?.tenantId;
            const incident = await this.service.createNotification(data, authTenantId);
            res.status(201).json(incident);
        } catch (error: any) {
            sendError(res, error, 'Failed to create notification', 'CONTROLLER ERROR:');
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const tenantId = (req as any).user.tenantId;
            const notifications = await this.service.getAllNotifications(tenantId);
            res.json(notifications);
        } catch (error) {
            sendError(res, error, 'Failed to fetch notifications');
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const user = (req as any).user;
            // SUPER_ADMIN pode acessar notificações de qualquer tenant
            const tenantId = user.role === 'SUPER_ADMIN' ? undefined : user.tenantId;
            const notification = await this.service.getNotificationById(id, tenantId);

            if (!notification) {
                res.status(404).json({ error: 'Notification not found' });
                return;
            }

            res.json(notification);
        } catch (error) {
            sendError(res, error, 'Failed to fetch notification');
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const data = sanitize(req.body);
            const incident = await this.service.updateNotification(id, tenantId, data);
            res.json(incident);
        } catch (error: any) {
            sendError(res, error, 'Failed to update notification', 'UPDATE ERROR:');
        }
    };

    generateRCA = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const rca = await this.service.generateRCA(id, tenantId);
            res.json(rca);
        } catch (error: any) {
            sendError(res, error, 'Failed to generate RCA', 'RCA ERROR:');
        }
    };

    generateFiveWhys = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const result = await this.service.generateFiveWhys(id, tenantId);
            res.json(result);
        } catch (error: any) {
            sendError(res, error, 'Failed to generate 5 Whys', '5 WHYS ERROR:');
        }
    };

    reanalyze = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const result = await this.service.reanalyzeIncident(id, tenantId);
            res.json(result);
        } catch (error: any) {
            sendError(res, error, 'Failed to re-analyze incident', 'REANALYZE ERROR:');
        }
    };

    // New Endpoints for Email Workflow

    forwardToSector = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const { email } = req.body;
            console.log(`🚀 Forwarding notification #${id} to ${email}`);

            if (!email) {
                res.status(400).json({ error: 'Email is required' });
                return;
            }
            const result = await this.service.forwardToSector(id, tenantId, email);
            res.json(result);
        } catch (error: any) {
            sendError(res, error, 'Failed to forward email', '❌ FORWARD ERROR DETAILS:');
        }
    };

    notifyHighManagement = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const result = await this.service.notifyHighManagement(id, tenantId);
            res.json(result);
        } catch (error: any) {
            sendError(res, error, 'Failed to notify High Management', 'HIGH MANAGEMENT ERROR:');
        }
    };

    startActionPlan = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const { deadline } = req.body;
            const result = await this.service.startActionPlan(id, tenantId, deadline ? new Date(deadline) : undefined);
            res.json(result);
        } catch (error: any) {
            sendError(res, error, 'Failed to start action plan', 'START ACTION PLAN ERROR:');
        }
    };

    chat = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const { message, context } = req.body;
            const result = await this.service.chatWithAI(id, tenantId, message, context);
            res.json({ message: result });
        } catch (error: any) {
            sendError(res, error, 'Failed to chat with AI', 'CHAT ERROR:');
        }
    };
    contactRiskManager = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const { message, requesterEmail } = req.body;
            const result = await this.service.contactRiskManager(id, tenantId, message, requesterEmail);
            res.json(result);
        } catch (error: any) {
            sendError(res, error, 'Failed to contact Risk Manager', 'CONTACT RISK MANAGER ERROR:');
        }
    };

    approveDeadline = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const { deadline } = req.body;
            if (!deadline) {
                res.status(400).json({ error: 'Deadline is required' });
                return;
            }
            const result = await this.service.approveDeadline(id, tenantId, new Date(deadline));
            res.json(result);
        } catch (error: any) {
            sendError(res, error, 'Failed to approve deadline', 'APPROVE DEADLINE ERROR:');
        }
    };

    rejectDeadline = async (req: Request, res: Response) => {
        try {
            const id = parseId(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const result = await this.service.rejectDeadline(id, tenantId);
            res.json(result);
        } catch (error: any) {
            sendError(res, error, 'Failed to reject deadline', 'REJECT DEADLINE ERROR:');
        }
    };
}
