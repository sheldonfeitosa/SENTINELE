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
router.get('/stats', controller.getStats);
router.post('/reset-password', controller.resetPassword);
router.put('/update-subscription', controller.updateSubscription);
router.post('/send-sales-email', controller.sendSalesEmail);
router.post('/users', controller.createUser);
router.delete('/users/:id', controller.deleteUser);
router.delete('/tenants/:id', controller.deleteTenant);

// Audit Logs - specific route
router.get('/audit/logs', controller.getAuditLogs);

export default router;
