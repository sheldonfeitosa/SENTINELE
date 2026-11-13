import { Router } from 'express';
import { ArticleController } from '../controllers/article.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';

const router = Router();
const controller = new ArticleController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
// Publicar artigo no blog: somente o administrador do sistema
router.post('/', authenticate, isAdmin, controller.create);

// LinkedIn Auth Routes
import { linkedinService } from '../services/linkedin.service';

router.get('/auth/linkedin', (req, res) => {
    res.redirect(linkedinService.getAuthUrl());
});

router.get('/auth/linkedin/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).send('No code provided');

        await linkedinService.getAccessToken(code as string);

        // O token NÃO é exibido na página (antes ficava visível para quem abrisse o link).
        res.send('<h1>LinkedIn conectado</h1><p>Você já pode fechar esta janela.</p>');
    } catch (error) {
        console.error(error);
        res.status(500).send('LinkedIn Auth Failed');
    }
});

export default router;
