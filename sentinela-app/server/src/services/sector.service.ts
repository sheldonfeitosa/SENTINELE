import { SectorRepository } from '../repositories/sector.repository';

export class SectorService {
    private repository: SectorRepository;

    constructor() {
        this.repository = new SectorRepository();
    }

    async getAllSectors(tenantId: string) {
        return this.repository.findAll(tenantId);
    }

    async createSector(tenantId: string, name: string) {
        if (!name) throw new Error('Sector name is required');
        return this.repository.create(tenantId, name);
    }

    async deleteSector(id: number, tenantId: string) {
        return this.repository.delete(id, tenantId);
    }
}
