import { Router } from 'express';
import { AuthService } from '../services/auth.service';


import { EmailService } from '../services/email.service';
import { auditService } from '../services/audit.service';

const router = Router();
const authService = new AuthService();
const emailService = new EmailService();

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

router.post('/register', async (req, res) => {
    try {
        const result = await authService.register(req.body);

        auditService.log({
            action: 'REGISTER',
            resource: 'Auth',
            userId: result.user.id,
            tenantId: result.user.tenant.id,
            ipAddress: req.ip,
            details: { email: result.user.email }
        });

        res.cookie('token', result.token, COOKIE_OPTIONS);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const result = await authService.login(req.body);

        auditService.log({
            action: 'LOGIN_SUCCESS',
            resource: 'Auth',
            userId: result.user.id,
            tenantId: result.user.tenant.id,
            ipAddress: req.ip
        });

        res.cookie('token', result.token, COOKIE_OPTIONS);
        res.json(result);
    } catch (error: any) {
        // Log failed attempt if we can find the tenant
        auditService.log({
            action: 'LOGIN_FAILED',
            resource: 'Auth',
            tenantId: 'SYSTEM', // We don't have tenant context yet
            ipAddress: req.ip,
            details: { email: req.body.email, error: error.message }
        });
        res.status(401).json({ error: error.message });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout realizado com sucesso.' });
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

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email é obrigatório' });
        }
        await authService.forgotPassword(email);

        auditService.log({
            action: 'PASSWORD_RESET_REQUESTED',
            resource: 'Auth',
            tenantId: 'SYSTEM',
            ipAddress: req.ip,
            details: { email }
        });

        res.json({ message: 'Se o e-mail estiver cadastrado, um link de recuperação será enviado.' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/validate-token', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ error: 'Token é obrigatório' });
        const isValid = await authService.validateResetToken(String(token));
        res.json({ valid: isValid });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
        }
        await authService.resetPassword(token, newPassword);

        auditService.log({
            action: 'PASSWORD_RESET_COMPLETED',
            resource: 'Auth',
            tenantId: 'SYSTEM', // Tenant context is inside the token
            ipAddress: req.ip
        });

        res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export const authRoutes = router;
