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
exports.RiskManagerRepository = void 0;
const prisma_1 = require("../lib/prisma");
class RiskManagerRepository {
    create(tenantId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.user.create({
                data: Object.assign(Object.assign({}, data), { tenantId }),
            });
        });
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.user.findUnique({
                where: { email }
            });
        });
    }
    findAll(tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.user.findMany({
                where: { tenantId },
                orderBy: {
                    name: 'asc'
                }
            });
        });
    }
    findById(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.user.findFirst({
                where: { id, tenantId }
            });
        });
    }
    update(id, tenantId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.user.update({
                where: { id, tenantId },
                data
            });
        });
    }
    delete(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.user.delete({
                where: { id, tenantId }
            });
        });
    }
    findBySector(sector, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Since sectors are stored as JSON string or comma-separated, we need to fetch all for the tenant and filter in app
            const allUsers = yield this.findAll(tenantId);
            return allUsers.find(user => {
                if (!user.sectors)
                    return false;
                try {
                    // Try parsing as JSON array
                    const sectors = JSON.parse(user.sectors);
                    if (Array.isArray(sectors)) {
                        return sectors.includes(sector);
                    }
                }
                catch (e) {
                    // Fallback to simple string check (comma-separated or single value)
                    if (user.sectors.includes(',')) {
                        return user.sectors.split(',').map(s => s.trim()).includes(sector);
                    }
                    return user.sectors === sector;
                }
                return false;
            });
        });
    }
}
exports.RiskManagerRepository = RiskManagerRepository;
