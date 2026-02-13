import { Router } from 'express';
import { AuthService } from '../services/auth.service';


import { EmailService } from '../services/email.service';

const router = Router();
const authService = new AuthService();
const emailService = new EmailService();

router.post('/register', async (req, res) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

router.post('/trial-request', async (req, res) => {
    try {
        const { name, hospital, email, phone } = req.body;

        // Validation
        if (!name || !hospital || !email || !phone) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        // Create trial user and send welcome email
        const { password } = await authService.createTrial({ name, hospital, email, phone });

        // Also notify admin regarding new lead (optional, keeping it for now)
        try {
            await emailService.sendTrialRequestNotification({ name, hospital, email, phone });
        } catch (e) {
            console.error("Failed to notify admin about new trial, but user created ok.");
        }

        res.status(200).json({
            message: 'Ambiente criado com sucesso!',
            tempPassword: password
        });
    } catch (error: any) {
        console.error('Trial request error:', error);
        res.status(400).json({ error: error.message || 'Erro ao processar solicitação' });
    }
});

export const authRoutes = router;
