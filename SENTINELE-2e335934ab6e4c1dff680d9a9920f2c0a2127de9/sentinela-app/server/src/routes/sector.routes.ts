import { Router } from 'express';
import { SectorController } from '../controllers/sector.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();
const controller = new SectorController();

// Endpoint público: retorna nome do hospital pelo slug
// Usado pelo formulário de notificação anônima para exibir o nome da instituição
router.get('/tenant-info', async (req, res) => {
    const { tenantSlug } = req.query;
    if (!tenantSlug) {
        return res.status(400).json({ error: 'tenantSlug é obrigatório' });
    }
    const tenant = await prisma.tenant.findUnique({
        where: { slug: String(tenantSlug) },
        select: { name: true, slug: true }
    });
    if (!tenant) {
        return res.status(404).json({ error: 'Hospital não encontrado' });
    }
    return res.json(tenant);
});

router.get('/', optionalAuthenticate, controller.getAll);
router.post('/', authenticate, controller.create);
router.delete('/:id', authenticate, controller.delete);

export default router;
