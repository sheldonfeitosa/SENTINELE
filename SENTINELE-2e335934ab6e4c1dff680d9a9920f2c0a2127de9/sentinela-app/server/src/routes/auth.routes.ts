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

router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email é obrigatório' });
        }
        await authService.resetPassword(email);
        res.json({ message: 'Um link de recuperação foi enviado para o seu e-mail.' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ error: 'Token é obrigatório' });
        }
        await authService.verifyResetToken(token as string);
        res.json({ valid: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/update-password-with-token', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
        }
        await authService.updatePasswordWithToken(token, newPassword);
        res.json({ message: 'Senha atualizada com sucesso.' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Magic Link: autentica gestor via link do email sem precisar de senha
router.get('/magic-login', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Token é obrigatório' });
        }
        const result = await authService.loginWithMagicToken(token);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

// Acesso Público: autentica gestor de setor SEM conta no sistema usando token JWT público
// Gerado pelo buildMagicUrl quando o email não tem User cadastrado
router.get('/public-token', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Token público é obrigatório' });
        }
        const result = await authService.loginWithPublicToken(token);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

// Emergency password reset — protegido por ADMIN_SECRET env var
// Uso: POST /auth/emergency-reset  { adminKey, email, newPassword }
router.post('/emergency-reset', async (req, res) => {
    try {
        const { adminKey, email, newPassword } = req.body;

        const ADMIN_SECRET = process.env.ADMIN_SECRET;
        if (!ADMIN_SECRET) {
            return res.status(503).json({ error: 'Serviço não configurado.' });
        }
        if (adminKey !== ADMIN_SECRET) {
            return res.status(403).json({ error: 'Chave inválida.' });
        }
        if (!email || !newPassword) {
            return res.status(400).json({ error: 'email e newPassword são obrigatórios.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' });
        }

        const bcrypt = await import('bcryptjs');
        const { prisma } = await import('../lib/prisma');

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: `Usuário '${email}' não encontrado.` });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
        });

        console.log(`[EMERGENCY-RESET] Senha de ${email} resetada com sucesso.`);
        res.json({ message: `Senha de ${email} atualizada com sucesso.` });
    } catch (error: any) {
        console.error('[EMERGENCY-RESET] Erro:', error.message);
        res.status(500).json({ error: 'Erro interno ao resetar senha.' });
    }
});

export const authRoutes = router;
