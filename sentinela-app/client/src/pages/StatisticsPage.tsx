import { useEffect, useState } from 'react';
import { apiService } from '../services/ApiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function StatisticsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [advancedStats, setAdvancedStats] = useState<any>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedSector, setSelectedSector] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [data, stats] = await Promise.all([
                apiService.getNotifications(),
                apiService.getDashboardStats()
            ]);
            setNotifications(data);
            setAdvancedStats(stats);
        } catch (error) {
            console.error('Failed to load stats data:', error);
        }
    };

    const filteredData = notifications.filter(n => {
        const eventDate = new Date(n.data_evento);
        const start = dateRange.start ? new Date(dateRange.start) : null;
        const end = dateRange.end ? new Date(dateRange.end) : null;

        const matchesDate = (!start || eventDate >= start) && (!end || eventDate <= end);
        const matchesSector = selectedSector ? n.setor === selectedSector : true;

        return matchesDate && matchesSector;
    });

    // Stats Calculations
    const totalEvents = filteredData.length;
    const openEvents = filteredData.filter(n => n.status === 'Aberto' || n.status === 'Em Análise').length;
    const closedEvents = filteredData.filter(n => n.status === 'Concluído').length;

    // Chart Data Preparation
    const eventsBySector = Object.entries(filteredData.reduce((acc: any, curr) => {
        acc[curr.setor] = (acc[curr.setor] || 0) + 1;
        return acc;
    }, {})).map(([name, value]) => ({ name, value }));

    const eventsByType = Object.entries(filteredData.reduce((acc: any, curr) => {
        acc[curr.tipo_notificacao] = (acc[curr.tipo_notificacao] || 0) + 1;
        return acc;
    }, {})).map(([name, value]) => ({ name, value }));

    const eventsByClassification = Object.entries(filteredData.reduce((acc: any, curr) => {
        acc[curr.classificacao] = (acc[curr.classificacao] || 0) + 1;
        return acc;
    }, {})).map(([name, value]) => ({ name, value }));

    const eventsByNotifiedSector = Object.entries(filteredData.reduce((acc: any, curr) => {
        const sector = curr.setor_notificado || 'Não Informado';
        acc[sector] = (acc[sector] || 0) + 1;
        return acc;
    }, {})).map(([name, value]) => ({ name, value }));

    const eventsByPeriod = Object.entries(filteredData.reduce((acc: any, curr) => {
        const period = curr.periodo || 'Não Informado';
        acc[period] = (acc[period] || 0) + 1;
        return acc;
    }, {})).map(([name, value]) => ({ name, value }));

    const eventsByEventType = Object.entries(filteredData.reduce((acc: any, curr) => {
        const type = curr.tipo_evento || 'Em Análise';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {})).map(([name, value]) => ({ name, value }));

    const generateReport = () => {
        const doc = new jsPDF();

        doc.setFillColor(0, 51, 102);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('Relatório Gerencial de Riscos', 14, 25);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 33);

        let yPos = 50;
        doc.setTextColor(0, 0, 0);

        // Summary Stats
        doc.setFontSize(14);
        doc.text('Resumo Geral', 14, yPos);
        yPos += 10;

        autoTable(doc, {
            startY: yPos,
            head: [['Métrica', 'Valor']],
            body: [
                ['Total de Eventos', totalEvents],
                ['Eventos Abertos', openEvents],
                ['Eventos Concluídos', closedEvents]
            ],
            theme: 'striped',
            headStyles: { fillColor: [0, 51, 102] }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Sector Stats
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.text('Eventos por Setor de Ocorrência', 14, yPos);
        yPos += 10;

        autoTable(doc, {
            startY: yPos,
            head: [['Setor', 'Quantidade']],
            body: eventsBySector.map(item => [item.name, item.value]) as any[],
            theme: 'striped',
            headStyles: { fillColor: [0, 51, 102] }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Notified Sector Stats
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.text('Eventos por Setor Notificado', 14, yPos);
        yPos += 10;

        autoTable(doc, {
            startY: yPos,
            head: [['Setor Notificado', 'Quantidade']],
            body: eventsByNotifiedSector.map(item => [item.name, item.value]) as any[],
            theme: 'striped',
            headStyles: { fillColor: [0, 51, 102] }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Event Type Stats
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.text('Tipos de Evento (IA)', 14, yPos);
        yPos += 10;

        autoTable(doc, {
            startY: yPos,
            head: [['Tipo de Evento', 'Quantidade']],
            body: eventsByEventType.map(item => [item.name, item.value]) as any[],
            theme: 'striped',
            headStyles: { fillColor: [0, 51, 102] }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Period Stats
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.text('Eventos por Período', 14, yPos);
        yPos += 10;

        autoTable(doc, {
            startY: yPos,
            head: [['Período', 'Quantidade']],
            body: eventsByPeriod.map(item => [item.name, item.value]) as any[],
            theme: 'striped',
            headStyles: { fillColor: [0, 51, 102] }
        });

        doc.save('relatorio_gerencial_completo.pdf');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#003366]">Estatísticas e Relatórios</h1>
                    <p className="text-gray-500">Análise descritiva de eventos e indicadores</p>
                </div>
                <button
                    onClick={generateReport}
                    className="flex items-center gap-2 bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-[#002244] transition-colors shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Gerar Relatório PDF
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Início</label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#003366]"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Fim</label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#003366]"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Setor</label>
                    <select
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                        className="p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#003366] min-w-[200px]"
                    >
                        <option value="">Todos os Setores</option>
                        {Array.from(new Set(notifications.map(n => n.setor))).map(sector => (
                            <option key={sector} value={sector}>{sector}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards (Backend Data) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Total de Eventos</h3>
                    <p className="text-3xl font-bold text-[#003366]">{advancedStats?.totalEvents || 0}</p>
                    <span className="text-xs text-gray-400">Registrados no banco</span>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Eventos Abertos</h3>
                    <p className="text-3xl font-bold text-orange-600">{advancedStats?.openEvents || 0}</p>
                    <span className="text-xs text-gray-400">Pendentes de conclusão</span>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Eventos Concluídos</h3>
                    <p className="text-3xl font-bold text-green-600">{advancedStats?.resolvedEvents || 0}</p>
                    <span className="text-xs text-gray-400">Finalizados com sucesso</span>
                </div>
            </div>

            {/* Top Sectors Panel (Backend Data) */}
            {advancedStats?.topSectors && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-[#003366] mb-4">Top 5 Setores (Mais Ocorrências)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        {advancedStats.topSectors.map((sector: any, index: number) => (
                            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                                <span className="block text-xl font-bold text-[#003366]">{sector.value}</span>
                                <span className="text-xs text-gray-500 uppercase">{sector.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Events by Sector */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-[#003366] mb-4">Eventos por Setor</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={eventsBySector}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#003366" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Events by Type */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-[#003366] mb-4">Eventos por Tipo</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={eventsByType}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {eventsByType.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Events by Classification */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-bold text-[#003366] mb-4">Classificação de Risco</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={eventsByClassification} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#82ca9d">
                                    {eventsByClassification.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={
                                            entry.name === 'GRAVE' ? '#EF4444' :
                                                entry.name === 'MODERADO' ? '#F59E0B' : '#10B981'
                                        } />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Events by Notified Sector */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-bold text-[#003366] mb-4">Eventos por Setor Notificado</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={eventsByNotifiedSector}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#003366" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Events by Period */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-[#003366] mb-4">Eventos por Período</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={eventsByPeriod}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {eventsByPeriod.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Events by Event Type (IA) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-[#003366] mb-4">Tipos de Evento (IA)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={eventsByEventType} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={180} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#FF8042" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
