import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/** Erro com status HTTP e mensagem segura para o cliente. */
export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

/** Converte :id da rota em inteiro positivo; lança 400 se inválido. */
export function parseId(raw: unknown): number {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'ID inválido');
    return id;
}

/** Senha mínima: 8+ caracteres, ao menos uma letra e um número. Retorna mensagem de erro ou null. */
export function passwordProblem(password: unknown): string | null {
    if (typeof password !== 'string' || password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'A senha deve conter letras e números.';
    return null;
}

export function assertStrongPassword(password: unknown) {
    const p = passwordProblem(password);
    if (p) throw new HttpError(400, p);
}

/** Senha temporária aleatória que satisfaz a política. */
export function randomPassword(): string {
    return crypto.randomBytes(9).toString('base64url') + '7a';
}

/** Responde erros sem vazar detalhes internos (Prisma, caminhos do servidor). */
export function sendError(res: Response, error: any, fallback: string, logLabel?: string) {
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
    // Prisma: registro não encontrado / violação de unicidade
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Registro não encontrado' });
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Já existe um registro com esses dados' });
    console.error(`[${logLabel || 'ERROR'}]`, error?.message || error);
    return res.status(500).json({ error: fallback });
}

/**
 * Para rotas cujas mensagens de negócio (throw new Error('...')) são seguras para o usuário:
 * devolve a mensagem com `status`, mas esconde erros internos (Prisma, TypeError etc.).
 */
export function sendUserError(res: Response, error: any, status: number, label: string) {
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
    const internal = !error || error.code || /^(Prisma|TypeError|ReferenceError|SyntaxError)/.test(error.name || '') || /prisma|invocation|C:\\|\/var\//i.test(error.message || '');
    if (internal) {
        console.error(`[${label}]`, error?.message || error);
        return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
    }
    return res.status(status).json({ error: error.message });
}

/** Handler global: último middleware do app. */
export function globalErrorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
    return sendError(res, err, 'Erro interno', `${req.method} ${req.path}`);
}

/** Exige um dos papéis informados. Use depois de authenticate. */
export const requireRole = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (!role) return res.status(401).json({ error: 'Não autenticado' });
    if (!roles.includes(role)) return res.status(403).json({ error: 'Acesso negado' });
    next();
};
