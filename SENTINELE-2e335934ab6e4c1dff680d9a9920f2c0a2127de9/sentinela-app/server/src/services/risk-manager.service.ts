import { RiskManagerRepository } from '../repositories/risk-manager.repository';
import bcrypt from 'bcryptjs';
import { EmailService } from './email.service';
import { HttpError, assertStrongPassword, randomPassword } from '../lib/http';

/** Papéis que podem ser atribuídos pela tela de gestores. SUPER_ADMIN nunca é atribuível por aqui. */
const ASSIGNABLE_ROLES = ['GESTOR_SETOR', 'ADMIN', 'ALTA_GESTAO', 'TENANT_ADMIN'];
const DEFAULT_ROLE = 'GESTOR_SETOR';

function checkRole(role: unknown, requesterRole: string): string | undefined {
    if (role === undefined || role === null || role === '') return undefined;
    if (typeof role !== 'string' || !ASSIGNABLE_ROLES.includes(role)) {
        throw new HttpError(400, 'Função inválida');
    }
    if (role === 'TENANT_ADMIN' && !['TENANT_ADMIN', 'SUPER_ADMIN'].includes(requesterRole)) {
        throw new HttpError(403, 'Somente o administrador do hospital pode criar outro administrador');
    }
    return role;
}

export class RiskManagerService {
    private repository: RiskManagerRepository;
    private emailService: EmailService;

    constructor() {
        this.repository = new RiskManagerRepository();
        this.emailService = new EmailService();
    }

    private safeParseSectors(sectors: string | null): string[] {
        if (!sectors) return [];
        try {
            return JSON.parse(sectors);
        } catch (e) {
            console.error('Failed to parse sectors JSON:', sectors);
            return [];
        }
    }

    async createManager(tenantId: string, data: any, requesterRole = '') {
        if (!data?.email || typeof data.email !== 'string' || !data?.name) {
            throw new HttpError(400, 'Nome e e-mail são obrigatórios');
        }
        const email = data.email.trim().toLowerCase();
        const role = checkRole(data.role, requesterRole);

        const existingUser = await this.repository.findByEmail(email);

        let manager;
        if (existingUser) {
            // Nunca trazer para este hospital uma conta de outro hospital (nem o super admin)
            if (existingUser.tenantId !== tenantId || existingUser.role === 'SUPER_ADMIN') {
                throw new HttpError(409, 'Este e-mail já está em uso');
            }
            manager = await this.repository.update(existingUser.id, tenantId, {
                name: data.name || existingUser.name,
                role: role || existingUser.role,
                sectors: JSON.stringify(data.sectors || []),
            });
        } else {
            if (data.password) assertStrongPassword(data.password);
            const password = data.password || randomPassword();
            const passwordHash = await bcrypt.hash(password, 10);

            manager = await this.repository.create(tenantId, {
                name: data.name,
                email,
                role: role || DEFAULT_ROLE,
                sectors: JSON.stringify(data.sectors || []),
                password: passwordHash
            });

            // Send welcome email for NEW managers
            try {
                const appUrl = process.env.APP_URL || 'https://sentinelaai.com.br';
                await this.emailService.sendWelcomeEmail(manager.email, manager.name, password, appUrl);
            } catch (error) {
                console.error('Failed to send welcome email to new manager:', error);
            }
        }

        return {
            ...manager,
            sectors: this.safeParseSectors(manager.sectors)
        };
    }

    async getAllManagers(tenantId: string) {
        const managers = await this.repository.findAll(tenantId);
        return managers.map(m => ({
            ...m,
            sectors: this.safeParseSectors(m.sectors)
        }));
    }

    async getManagerById(id: number, tenantId: string) {
        const manager = await this.repository.findById(id, tenantId);
        if (!manager) return null;
        return {
            ...manager,
            sectors: this.safeParseSectors(manager.sectors)
        };
    }

    async updateManager(id: number, tenantId: string, data: any, requesterRole = '') {
        const current = await this.repository.findById(id, tenantId);
        if (!current) throw new HttpError(404, 'Gestor não encontrado');
        if (current.role === 'SUPER_ADMIN') throw new HttpError(403, 'Acesso negado');

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.email) updateData.email = String(data.email).trim().toLowerCase();
        const role = checkRole(data.role, requesterRole);
        if (role) updateData.role = role;
        if (data.sectors) updateData.sectors = JSON.stringify(data.sectors);

        if (data.password) {
            assertStrongPassword(data.password);
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        const manager = await this.repository.update(id, tenantId, updateData);
        return {
            ...manager,
            sectors: this.safeParseSectors(manager.sectors)
        };
    }

    async deleteManager(id: number, tenantId: string) {
        const current = await this.repository.findById(id, tenantId);
        if (!current) throw new HttpError(404, 'Gestor não encontrado');
        if (current.role === 'SUPER_ADMIN') throw new HttpError(403, 'Acesso negado');
        return this.repository.delete(id, tenantId);
    }
}
