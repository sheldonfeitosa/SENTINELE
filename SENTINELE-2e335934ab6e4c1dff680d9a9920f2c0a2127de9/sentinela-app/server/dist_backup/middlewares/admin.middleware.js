"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Não autorizado. Contexto de usuário ausente.' });
    }
    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Requer privilégios de Administrador do Sistema.' });
    }
    next();
};
exports.isAdmin = isAdmin;
