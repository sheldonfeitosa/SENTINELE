import { Request, Response } from 'express';
import { SectorService } from '../services/sector.service';
import { prisma } from '../lib/prisma';

export class SectorController {
    private service: SectorService;

    constructor() {
        this.service = new SectorService();
    }

    getAll = async (req: Request, res: Response) => {
        try {
            let tenantId = (req as any).user?.tenantId;
            const { tenantSlug } = req.query;

            if (!tenantId && tenantSlug) {
                const tenant = await prisma.tenant.findUnique({ where: { slug: String(tenantSlug) } });
                if (tenant) {
                    tenantId = tenant.id;
                }
            }

            if (!tenantId) {
                return res.status(401).json({ error: 'Tenant context missing' });
            }

            const sectors = await this.service.getAllSectors(tenantId);
            res.json(sectors);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch sectors' });
        }
    };

    create = async (req: Request, res: Response) => {
        try {
            const { name } = req.body;
            const tenantId = (req as any).user.tenantId;
            const sector = await this.service.createSector(tenantId, name);
            res.status(201).json(sector);
        } catch (error: any) {
            if (error.code === 'P2002') {
                res.status(400).json({ error: 'Sector already exists' });
            } else {
                res.status(500).json({ error: 'Failed to create sector' });
            }
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const tenantId = (req as any).user.tenantId;
            await this.service.deleteSector(id, tenantId);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to delete sector' });
        }
    };
}
