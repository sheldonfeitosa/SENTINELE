"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectorService = void 0;
const sector_repository_1 = require("../repositories/sector.repository");
class SectorService {
    constructor() {
        this.repository = new sector_repository_1.SectorRepository();
    }
    getAllSectors(tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.findAll(tenantId);
        });
    }
    createSector(tenantId, name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!name)
                throw new Error('Sector name is required');
            return this.repository.create(tenantId, name);
        });
    }
    deleteSector(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.delete(id, tenantId);
        });
    }
}
exports.SectorService = SectorService;
