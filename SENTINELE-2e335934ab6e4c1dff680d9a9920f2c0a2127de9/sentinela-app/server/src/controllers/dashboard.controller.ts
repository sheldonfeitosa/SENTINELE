import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
    private service: DashboardService;

    constructor() {
        this.service = new DashboardService();
    }

    getStats = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            if (!user || !user.tenantId) {
                return res.status(401).json({ error: 'User tenant context missing' });
            }

            const stats = await this.service.getAdvancedStats(user.tenantId);
            res.json(stats);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    }
}
