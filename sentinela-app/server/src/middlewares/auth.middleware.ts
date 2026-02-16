import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET is not defined in environment variables');
}

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        email: string;
        role: string;
        tenantId: string;
    };
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    // Try to get token from cookies first, then from Authorization header
    const token = (req as any).cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        console.warn('Authentication failed: No token provided');
        return res.status(401).json({ error: 'Nenhum token fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as any).user = decoded;
        next();
    } catch (err) {
        console.error('Authentication failed: Invalid or expired token');
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = (req as any).cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as any).user = decoded;
    } catch (err) {
        // Continue even if token is invalid, but user context will be missing
        console.warn('Optional auth: Invalid token provided');
    }
    next();
};
