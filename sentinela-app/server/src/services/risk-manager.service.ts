import { RiskManagerRepository } from '../repositories/risk-manager.repository';
import bcrypt from 'bcryptjs';

export class RiskManagerService {
    private repository: RiskManagerRepository;

    constructor() {
        this.repository = new RiskManagerRepository();
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

    async createManager(data: any) {
        // Prepare data for User model
        // Hash password if provided, or set default? 
        // For now, if we are creating managers via this service, we might need a default password or passed password.
        // Assuming data.password exists or we generate a placeholder.
        const passwordHash = await bcrypt.hash(data.password || 'mudar123', 10);

        const manager = await this.repository.create({
            name: data.name,
            email: data.email,
            role: data.role || 'TENANT_ADMIN', // Default role
            sectors: JSON.stringify(data.sectors || []),
            password: passwordHash,
            tenantId: data.tenantId // Must be provided
        });

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

    async getManagerById(id: number) {
        const manager = await this.repository.findById(id);
        if (!manager) return null;
        return {
            ...manager,
            sectors: this.safeParseSectors(manager.sectors)
        };
    }

    async updateManager(id: number, data: any) {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.email) updateData.email = data.email;
        if (data.role) updateData.role = data.role;
        if (data.sectors) updateData.sectors = JSON.stringify(data.sectors);

        // Handle password update if needed
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        const manager = await this.repository.update(id, updateData);
        return {
            ...manager,
            sectors: this.safeParseSectors(manager.sectors)
        };
    }

    async deleteManager(id: number) {
        return this.repository.delete(id);
    }
}
