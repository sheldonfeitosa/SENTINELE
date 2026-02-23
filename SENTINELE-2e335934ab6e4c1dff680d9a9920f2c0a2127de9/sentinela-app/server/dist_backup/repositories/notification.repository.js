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
exports.NotificationRepository = void 0;
const prisma_1 = require("../lib/prisma");
class NotificationRepository {
    create(tenantId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.incident.create({
                data: Object.assign(Object.assign({}, data), { tenantId }),
            });
        });
    }
    findAll(tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.incident.findMany({
                where: { tenantId },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        });
    }
    update(id, tenantId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.incident.update({
                where: { id, tenantId },
                data
            });
        });
    }
    findById(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.prisma.incident.findFirst({
                where: Object.assign({ id }, (tenantId ? { tenantId } : {}))
            });
        });
    }
    findSimilarResolved(tenantId_1, eventType_1) {
        return __awaiter(this, arguments, void 0, function* (tenantId, eventType, limit = 3) {
            return prisma_1.prisma.incident.findMany({
                where: {
                    tenantId,
                    status: 'CONCLUIDO',
                    OR: [
                        { type: { contains: eventType } },
                        { eventTypeAi: { contains: eventType } }
                    ],
                    rootCause: { not: null },
                    actionPlan: { not: null }
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    description: true,
                    rootCause: true,
                    actionPlan: true,
                    riskLevel: true
                }
            });
        });
    }
}
exports.NotificationRepository = NotificationRepository;
