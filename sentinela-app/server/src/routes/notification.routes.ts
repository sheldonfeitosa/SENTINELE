import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();
const controller = new NotificationController();

router.post('/', optionalAuthenticate, controller.create); // Public but collects user context if logged in
router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.put('/:id', authenticate, controller.update);
router.post('/:id/analyze-root-cause', authenticate, controller.generateRCA);
router.post('/:id/five-whys', authenticate, controller.generateFiveWhys);
router.post('/:id/reanalyze', authenticate, controller.reanalyze);
router.post('/:id/forward', authenticate, controller.forwardToSector);
router.post('/:id/high-management', authenticate, controller.notifyHighManagement);
router.post('/:id/start-action-plan', authenticate, controller.startActionPlan);
router.post('/:id/chat', authenticate, controller.chat);
router.post('/:id/contact-risk-manager', authenticate, controller.contactRiskManager);
router.post('/:id/approve-deadline', authenticate, controller.approveDeadline);
router.post('/:id/reject-deadline', authenticate, controller.rejectDeadline);

export { router as notificationRoutes };
