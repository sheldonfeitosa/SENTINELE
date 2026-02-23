import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = (process.env.JWT_SECRET || 'sentinela-secret-key-change-me').replace(/[\r\n]/g, '').trim();

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        email: string;
        role: string;
        tenantId: string;
    };
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as any).user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
        return authenticate(req, res, next);
    }
    next();
};
