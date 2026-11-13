import { Router } from 'express';
import { RiskManagerController } from '../controllers/risk-manager.controller';
import { requireRole } from '../lib/http';

const router = Router();
const controller = new RiskManagerController();

// Quem pode cadastrar/alterar/remover gestores: gerente de risco (ADMIN), admin do hospital e super admin
const canManage = requireRole('ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN');

router.post('/', canManage, controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', canManage, controller.update);
router.delete('/:id', canManage, controller.delete);

export default router;
