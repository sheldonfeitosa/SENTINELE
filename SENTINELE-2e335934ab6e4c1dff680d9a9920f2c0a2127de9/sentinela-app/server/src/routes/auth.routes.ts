import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import crypto from 'crypto';
import { AuthService } from '../services/auth.service';
import { sendUserError, passwordProblem } from '../lib/http';


import { EmailService } from '../services/email.service';

const router = Router();
const authService = new AuthService();
const emailService = new EmailService();

// Rate limit estrito para o reset de emergência: 3 tentativas por hora por IP
const emergencyResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas tentativas. Tente novamente mais tarde.' }
});

// Login: 10 tentativas a cada 15 min por IP + e-mail (não bloqueia o hospital inteiro atrás do mesmo IP)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip || '')}|${String(req.body?.email || '').toLowerCase()}`,
    message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' }
});

// Cadastro / trial: 5 por hora por IP
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas solicitações. Tente novamente mais tarde.' }
});

// Recuperação de senha: 5 por hora por IP
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas solicitações. Tente novamente mais tarde.' }
});

// Comparação em tempo constante (evita timing attacks na checagem da chave)
function safeKeyEqual(a: string, b: string): boolean {
    const ha = crypto.createHash('sha256').update(String(a)).digest();
    const hb = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
}

router.post('/register', signupLimiter, async (req, res) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        sendUserError(res, error, 400, 'REGISTER');
    }
});

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.json(result);
    } catch (error: any) {
        sendUserError(res, error, 401, 'LOGIN');
    }
});

router.post('/trial-request', signupLimiter, async (req, res) => {
    try {
        const { name, hospital, email, phone } = req.body;

        // Validation
        if (!name || !hospital || !email || !phone) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        // Create trial user and send welcome email (a senha vai SÓ por e-mail)
        await authService.createTrial({ name, hospital, email, phone });

        // Also notify admin regarding new lead (optional, keeping it for now)
        try {
            await emailService.sendTrialRequestNotification({ name, hospital, email, phone });
        } catch (e) {
            console.error("Failed to notify admin about new trial, but user created ok.");
        }

        res.status(200).json({
            message: 'Ambiente criado com sucesso! Enviamos a senha de acesso para o seu e-mail.'
        });
    } catch (error: any) {
        sendUserError(res, error, 400, 'TRIAL');
    }
});

router.post('/reset-password', passwordResetLimiter, async (req, res) => {
    const neutral = { message: 'Se o e-mail estiver cadastrado, enviaremos um link de recuperação.' };
    try {
        const { email } = req.body || {};
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email é obrigatório' });
        }
        await authService.resetPassword(email);
        res.json(neutral);
    } catch (error: any) {
        // Mesmo com falha (ex.: e-mail não enviado), resposta neutra; detalhe só no log
        console.error('[RESET-PASSWORD]', error?.message);
        res.json(neutral);
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
        sendUserError(res, error, 400, 'UPDATE-PASSWORD');
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
router.post('/emergency-reset', emergencyResetLimiter, async (req, res) => {
    try {
        const { adminKey, email, newPassword } = req.body;

        const ADMIN_SECRET = process.env.ADMIN_SECRET;
        if (!ADMIN_SECRET) {
            return res.status(503).json({ error: 'Serviço não configurado.' });
        }
        if (!adminKey || !safeKeyEqual(adminKey, ADMIN_SECRET)) {
            // Auditoria: registra tentativa falha com IP e e-mail alvo
            console.warn(`[EMERGENCY-RESET] Tentativa NEGADA (chave inválida) | IP: ${req.ip} | alvo: ${email || '(sem email)'} | ${new Date().toISOString()}`);
            return res.status(403).json({ error: 'Chave inválida.' });
        }
        if (!email || !newPassword) {
            return res.status(400).json({ error: 'email e newPassword são obrigatórios.' });
        }
        const pwProblem = passwordProblem(newPassword);
        if (pwProblem) {
            return res.status(400).json({ error: pwProblem });
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

        console.warn(`[EMERGENCY-RESET] Senha de ${email} resetada com sucesso | IP: ${req.ip} | ${new Date().toISOString()}`);
        res.json({ message: `Senha de ${email} atualizada com sucesso.` });
    } catch (error: any) {
        console.error('[EMERGENCY-RESET] Erro:', error.message);
        res.status(500).json({ error: 'Erro interno ao resetar senha.' });
    }
});

export const authRoutes = router;
