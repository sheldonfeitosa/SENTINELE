import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
    private service: NotificationService;

    constructor() {
        this.service = new NotificationService();
    }

    create = async (req: Request, res: Response) => {
        try {
            const data = req.body;
            const authTenantId = (req as any).user?.tenantId;
            const incident = await this.service.createNotification(data, authTenantId);
            res.status(201).json(incident);
        } catch (error: any) {
            console.error('CONTROLLER ERROR:', error.message);
            res.status(500).json({ error: 'Failed to create notification', details: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const tenantId = (req as any).user.tenantId;
            const notifications = await this.service.getAllNotifications(tenantId);
            res.json(notifications);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const notification = await this.service.getNotificationById(id, tenantId);

            if (!notification) {
                res.status(404).json({ error: 'Notification not found' });
                return;
            }

            res.json(notification);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch notification' });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const data = req.body;
            const incident = await this.service.updateNotification(id, tenantId, data);
            res.json(incident);
        } catch (error: any) {
            console.error('UPDATE ERROR:', error.message);
            res.status(500).json({ error: 'Failed to update notification' });
        }
    };

    generateRCA = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const rca = await this.service.generateRCA(id, tenantId);
            res.json(rca);
        } catch (error: any) {
            console.error('RCA ERROR:', error.message);
            res.status(500).json({ error: 'Failed to generate RCA' });
        }
    };

    generateFiveWhys = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const result = await this.service.generateFiveWhys(id, tenantId);
            res.json(result);
        } catch (error: any) {
            console.error('5 WHYS ERROR:', error.message);
            res.status(500).json({ error: 'Failed to generate 5 Whys' });
        }
    };

    reanalyze = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const result = await this.service.reanalyzeIncident(id, tenantId);
            res.json(result);
        } catch (error: any) {
            console.error('REANALYZE ERROR:', error.message);
            res.status(500).json({ error: 'Failed to re-analyze incident' });
        }
    };

    // New Endpoints for Email Workflow

    forwardToSector = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ error: 'Email is required' });
                return;
            }
            const result = await this.service.forwardToSector(id, tenantId, email);
            res.json(result);
        } catch (error: any) {
            console.error('FORWARD ERROR:', error.message);
            res.status(500).json({ error: 'Failed to forward email' });
        }
    };

    notifyHighManagement = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const result = await this.service.notifyHighManagement(id, tenantId);
            res.json(result);
        } catch (error: any) {
            console.error('HIGH MANAGEMENT ERROR:', error.message);
            res.status(500).json({ error: 'Failed to notify High Management' });
        }
    };

    startActionPlan = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const { deadline } = req.body;
            const result = await this.service.startActionPlan(id, tenantId, deadline ? new Date(deadline) : undefined);
            res.json(result);
        } catch (error: any) {
            console.error('START ACTION PLAN ERROR:', error.message);
            res.status(500).json({ error: 'Failed to start action plan' });
        }
    };

    chat = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const { message, context } = req.body;
            const result = await this.service.chatWithAI(id, tenantId, message, context);
            res.json({ message: result });
        } catch (error: any) {
            console.error('CHAT ERROR:', error.message);
            res.status(500).json({ error: 'Failed to chat with AI' });
        }
    };
    contactRiskManager = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const { message, requesterEmail } = req.body;
            const result = await this.service.contactRiskManager(id, tenantId, message, requesterEmail);
            res.json(result);
        } catch (error: any) {
            console.error('CONTACT RISK MANAGER ERROR:', error.message);
            res.status(500).json({ error: 'Failed to contact Risk Manager' });
        }
    };

    approveDeadline = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const { deadline } = req.body;
            if (!deadline) {
                res.status(400).json({ error: 'Deadline is required' });
                return;
            }
            const result = await this.service.approveDeadline(id, tenantId, new Date(deadline));
            res.json(result);
        } catch (error: any) {
            console.error('APPROVE DEADLINE ERROR:', error.message);
            res.status(500).json({ error: 'Failed to approve deadline' });
        }
    };

    rejectDeadline = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            const result = await this.service.rejectDeadline(id, tenantId);
            res.json(result);
        } catch (error: any) {
            console.error('REJECT DEADLINE ERROR:', error.message);
            res.status(500).json({ error: 'Failed to reject deadline' });
        }
    };
}
