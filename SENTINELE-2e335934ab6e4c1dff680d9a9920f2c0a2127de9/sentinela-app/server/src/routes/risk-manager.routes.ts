import { Router } from 'express';
import { RiskManagerController } from '../controllers/risk-manager.controller';

const router = Router();
const controller = new RiskManagerController();

router.post('/', controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
