import { RiskManagerRepository } from '../repositories/risk-manager.repository';
import bcrypt from 'bcryptjs';
import { EmailService } from './email.service';

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

    async createManager(tenantId: string, data: any) {
        const password = data.password || 'mudar123';
        const passwordHash = await bcrypt.hash(password, 10);

        // Check if user already exists in the system
        const existingUser = await this.repository.findByEmail(data.email);

        let manager;
        if (existingUser) {
            // Update existing user - useful if they were just a regular user or added to wrong tenant
            manager = await this.repository.update(existingUser.id, existingUser.tenantId, {
                name: data.name || existingUser.name,
                role: data.role || existingUser.role,
                sectors: JSON.stringify(data.sectors || []),
                tenantId: tenantId // Move them to the current tenant if they were elsewhere or just confirm
            });
        } else {
            // Create new manager
            manager = await this.repository.create(tenantId, {
                name: data.name,
                email: data.email,
                role: data.role || 'TENANT_ADMIN',
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

    async updateManager(id: number, tenantId: string, data: any) {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.email) updateData.email = data.email;
        if (data.role) updateData.role = data.role;
        if (data.sectors) updateData.sectors = JSON.stringify(data.sectors);

        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        const manager = await this.repository.update(id, tenantId, updateData);
        return {
            ...manager,
            sectors: this.safeParseSectors(manager.sectors)
        };
    }

    async deleteManager(id: number, tenantId: string) {
        return this.repository.delete(id, tenantId);
    }
}
