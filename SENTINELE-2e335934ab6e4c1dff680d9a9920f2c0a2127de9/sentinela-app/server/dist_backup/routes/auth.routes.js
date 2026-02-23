"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const email_service_1 = require("../services/email.service");
const router = (0, express_1.Router)();
const authService = new auth_service_1.AuthService();
const emailService = new email_service_1.EmailService();
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield authService.register(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield authService.login(req.body);
        res.json(result);
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
}));
router.post('/trial-request', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, hospital, email, phone } = req.body;
        // Validation
        if (!name || !hospital || !email || !phone) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        // Create trial user and send welcome email
        const { password } = yield authService.createTrial({ name, hospital, email, phone });
        // Also notify admin regarding new lead (optional, keeping it for now)
        try {
            yield emailService.sendTrialRequestNotification({ name, hospital, email, phone });
        }
        catch (e) {
            console.error("Failed to notify admin about new trial, but user created ok.");
        }
        res.status(200).json({
            message: 'Ambiente criado com sucesso!',
            tempPassword: password
        });
    }
    catch (error) {
        console.error('Trial request error:', error);
        res.status(400).json({ error: error.message || 'Erro ao processar solicitação' });
    }
}));
router.post('/reset-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email é obrigatório' });
        }
        yield authService.resetPassword(email);
        res.json({ message: 'Um link de recuperação foi enviado para o seu e-mail.' });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
router.get('/verify-reset-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ error: 'Token é obrigatório' });
        }
        yield authService.verifyResetToken(token);
        res.json({ valid: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
router.post('/update-password-with-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
        }
        yield authService.updatePasswordWithToken(token, newPassword);
        res.json({ message: 'Senha atualizada com sucesso.' });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
exports.authRoutes = router;
