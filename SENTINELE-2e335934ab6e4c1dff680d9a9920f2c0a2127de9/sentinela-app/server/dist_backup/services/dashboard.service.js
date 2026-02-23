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
exports.DashboardService = void 0;
const prisma_1 = require("../lib/prisma");
class DashboardService {
    getAdvancedStats(tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const notifications = yield prisma_1.prisma.incident.findMany({
                where: { tenantId }
            });
            // 1. Counters
            const totalEvents = notifications.length;
            const openEvents = notifications.filter(n => n.status !== 'Concluído').length;
            const resolvedEvents = notifications.filter(n => n.status === 'Concluído').length;
            // 2. Events per Sector (Top 5)
            const sectorMap = {};
            notifications.forEach(n => {
                const sector = n.sector || 'Não Informado';
                sectorMap[sector] = (sectorMap[sector] || 0) + 1;
            });
            const topSectors = Object.entries(sectorMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
            // 3. Risk Distribution
            const riskMap = { 'GRAVE': 0, 'MODERADO': 0, 'LEVE': 0, 'NA': 0 };
            notifications.forEach(n => {
                const risk = n.riskLevel || 'NA';
                if (riskMap[risk] !== undefined) {
                    riskMap[risk]++;
                }
            });
            const riskDistribution = Object.entries(riskMap).map(([name, value]) => ({ name, value }));
            return {
                totalEvents,
                openEvents,
                resolvedEvents,
                topSectors,
                riskDistribution
            };
        });
    }
}
exports.DashboardService = DashboardService;
