import { Router } from 'express';
import { ArticleController } from '../controllers/article.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const controller = new ArticleController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', authenticate, controller.create);

// LinkedIn Auth Routes
import { linkedinService } from '../services/linkedin.service';

router.get('/auth/linkedin', (req, res) => {
    res.redirect(linkedinService.getAuthUrl());
});

router.get('/auth/linkedin/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).send('No code provided');

        const accessToken = await linkedinService.getAccessToken(code as string);

        // In a real app, STORE this token in the DB for the user.
        // For now, we'll just display it so the user can copy it to .env or verify flow.
        res.send(`<h1>Success! LinkedIn Connected</h1><p>Access Token: ${accessToken}</p>`);
    } catch (error) {
        console.error(error);
        res.status(500).send('LinkedIn Auth Failed');
    }
});

export default router;
