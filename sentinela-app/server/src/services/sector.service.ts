import { SectorRepository } from '../repositories/sector.repository';

export class SectorService {
    private repository: SectorRepository;

    constructor() {
        this.repository = new SectorRepository();
    }

    async getAllSectors() {
        return this.repository.findAll();
    }

    async createSector(name: string) {
        if (!name) throw new Error('Sector name is required');
        return this.repository.create(name);
    }

    async deleteSector(id: number) {
        return this.repository.delete(id);
    }
}
