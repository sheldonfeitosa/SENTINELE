import { Router } from 'express';
import { SectorController } from '../controllers/sector.controller';

const router = Router();
const controller = new SectorController();

router.get('/', controller.getAll);
router.post('/', controller.create);
router.delete('/:id', controller.delete);

export default router;
