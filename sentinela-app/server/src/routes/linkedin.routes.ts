import { Router } from 'express';
import { LinkedinController } from '../controllers/linkedin.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const controller = new LinkedinController();

// Auth routes
// GET /api/linkedin/auth -> Returns the URL to redirect the user to
router.get('/auth', authenticate, controller.auth);

// POST /api/linkedin/callback -> Frontend sends code, backend returns token confirmation
router.post('/callback', authenticate, controller.callback);

export default router;
