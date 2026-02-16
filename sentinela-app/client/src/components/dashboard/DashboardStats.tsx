import React from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip,
    CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { Activity, ShieldCheck, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

interface DashboardStatsProps {
    riskDistribution: { name: string; value: number }[];
    topSectors: { name: string; value: number }[];
    totalEvents: number;
    openEvents: number;
    resolvedEvents: number;
    onFilterRisk?: (risk: string) => void;
}

const COLORS = {
    'GRAVE': '#ef4444',    // red-500
    'MODERADO': '#f59e0b', // amber-500
    'LEVE': '#22c55e',    // green-500
    'NA': '#94a3b8'        // slate-400
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({
    riskDistribution,
    topSectors,
    totalEvents,
    openEvents,
    resolvedEvents,
    onFilterRisk
}) => {
    return (
        <div className="space-y-6">
            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metrics Cards UI stays the same (Phase 6) */}
                <div className="glass-card p-5 rounded-2xl flex flex-col justify-between group hover:premium-gradient hover:text-white transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-200">Total de Eventos</span>
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-white/10">
                            <Activity className="w-5 h-5 text-[#003366] group-hover:text-white" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold">{totalEvents}</div>
                        <p className="text-xs text-slate-400 group-hover:text-blue-300 mt-1">Registrados até o momento</p>
                    </div>
                </div>

                <div className="glass-card p-5 rounded-2xl flex flex-col justify-between group hover:premium-gradient hover:text-white transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-200">Pendentes</span>
                        <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-white/10">
                            <TrendingUp className="w-5 h-5 text-amber-600 group-hover:text-white" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold">{openEvents}</div>
                        <p className="text-xs text-slate-400 group-hover:text-amber-300 mt-1">Ações requeridas</p>
                    </div>
                </div>

                <div className="glass-card p-5 rounded-2xl flex flex-col justify-between group hover:premium-gradient hover:text-white transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-green-200">Resolvidos</span>
                        <div className="p-2 bg-green-50 rounded-lg group-hover:bg-white/10">
                            <ShieldCheck className="w-5 h-5 text-green-600 group-hover:text-white" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold">{resolvedEvents}</div>
                        <p className="text-xs text-slate-400 group-hover:text-green-300 mt-1">SLA cumprido</p>
                    </div>
                </div>

                <div className="glass-card p-5 rounded-2xl flex flex-col justify-between group hover:premium-gradient hover:text-white transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-red-200">Eventos Graves</span>
                        <div className="p-2 bg-red-50 rounded-lg group-hover:bg-white/10">
                            <AlertTriangle className="w-5 h-5 text-red-600 group-hover:text-white" />
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold">{riskDistribution.find(r => r.name === 'GRAVE')?.value || 0}</div>
                        <p className="text-xs text-slate-400 group-hover:text-red-300 mt-1">Prioridade máxima</p>
                    </div>
                </div>
            </div>

            {/* Distribution Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Distribution Chart */}
                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-slate-700">Severidade dos Incidentes</h3>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Visão Global</div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={riskDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    onClick={(data) => onFilterRisk?.(data.name)}
                                    cursor="pointer"
                                >
                                    {riskDistribution.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[entry.name as keyof typeof COLORS] || '#ccc'}
                                            className="hover:opacity-80 transition-opacity"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">Clique em uma fatia para filtrar a lista abaixo</p>
                </div>

                {/* Top Sectors Chart */}
                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-slate-700">Top 5 Setores Notificadores</h3>
                        <div className="flex items-center gap-1 text-blue-600">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Volume Crítico</span>
                        </div>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topSectors} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="#003366"
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
