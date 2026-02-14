import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';

const router = Router();
const controller = new AdminController();

// All routes here require authentication and SUPER_ADMIN role
router.use(authenticate, isAdmin);

router.get('/tenants', controller.getTenants);
router.get('/tenants-detailed', controller.getTenantsWithUsers);
router.get('/incidents', controller.getIncidents);
router.get('/stats', controller.getStats);
router.post('/reset-password', controller.resetPassword);
router.put('/update-deadline', controller.updateDeadline);
router.put('/update-subscription', controller.updateSubscription);

export default router;
