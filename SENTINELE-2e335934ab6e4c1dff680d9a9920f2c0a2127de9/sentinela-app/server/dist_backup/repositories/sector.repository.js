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
exports.SectorRepository = void 0;
const prisma_1 = require("../lib/prisma");
class SectorRepository {
    findAll(tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.sector.findMany({
                where: { tenantId },
                orderBy: { name: 'asc' }
            });
        });
    }
    create(tenantId, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.sector.create({
                data: {
                    name,
                    tenantId: tenantId
                }
            });
        });
    }
    delete(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.sector.delete({
                where: {
                    id,
                    tenantId
                }
            });
        });
    }
}
exports.SectorRepository = SectorRepository;
