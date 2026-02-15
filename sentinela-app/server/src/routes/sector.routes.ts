import { Router } from 'express';
import { SectorController } from '../controllers/sector.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const controller = new SectorController();

router.get('/', controller.getAll);
router.post('/', authenticate, controller.create);
router.delete('/:id', authenticate, controller.delete);

export default router;
