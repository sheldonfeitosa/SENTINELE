import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Não autorizado. Contexto de usuário ausente.' });
    }

    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Requer privilégios de Administrador do Sistema.' });
    }

    next();
};
