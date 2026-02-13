import { prisma } from '../lib/prisma';

export class DashboardService {

    async getAdvancedStats(tenantId: string) {
        const notifications = await prisma.incident.findMany({
            where: { tenantId }
        });

        // 1. Counters
        const totalEvents = notifications.length;
        const openEvents = notifications.filter(n => n.status !== 'Concluído').length;
        const resolvedEvents = notifications.filter(n => n.status === 'Concluído').length;

        // 2. Events per Sector (Top 5)
        const sectorMap: Record<string, number> = {};
        notifications.forEach(n => {
            const sector = n.sector || 'Não Informado';
            sectorMap[sector] = (sectorMap[sector] || 0) + 1;
        });

        const topSectors = Object.entries(sectorMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // 3. Risk Distribution
        const riskMap: Record<string, number> = { 'GRAVE': 0, 'MODERADO': 0, 'LEVE': 0, 'NA': 0 };
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
    }
}
