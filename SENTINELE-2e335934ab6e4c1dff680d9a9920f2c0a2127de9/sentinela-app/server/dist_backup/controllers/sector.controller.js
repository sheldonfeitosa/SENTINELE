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
exports.SectorController = void 0;
const sector_service_1 = require("../services/sector.service");
const prisma_1 = require("../lib/prisma");
class SectorController {
    constructor() {
        this.getAll = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                let tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
                const { tenantSlug } = req.query;
                if (!tenantId && tenantSlug) {
                    const tenant = yield prisma_1.prisma.tenant.findUnique({ where: { slug: String(tenantSlug) } });
                    if (tenant) {
                        tenantId = tenant.id;
                    }
                }
                if (!tenantId) {
                    return res.status(401).json({ error: 'Tenant context missing' });
                }
                const sectors = yield this.service.getAllSectors(tenantId);
                res.json(sectors);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to fetch sectors' });
            }
        });
        this.create = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { name } = req.body;
                const tenantId = req.user.tenantId;
                const sector = yield this.service.createSector(tenantId, name);
                res.status(201).json(sector);
            }
            catch (error) {
                if (error.code === 'P2002') {
                    res.status(400).json({ error: 'Sector already exists' });
                }
                else {
                    res.status(500).json({ error: 'Failed to create sector' });
                }
            }
        });
        this.delete = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id);
                const tenantId = req.user.tenantId;
                yield this.service.deleteSector(id, tenantId);
                res.status(204).send();
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to delete sector' });
            }
        });
        this.service = new sector_service_1.SectorService();
    }
}
exports.SectorController = SectorController;
