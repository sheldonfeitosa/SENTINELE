import { useState, useEffect } from 'react';
import { apiService } from '../services/ApiService';
import { ClipboardList, Search, Shield, User, Clock, Globe, Info } from 'lucide-react';
import React from 'react';

export function AuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('');

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            // Re-using the apiService we updated earlier.
            // Note: In ApiService.ts it was exported as apiService.
            const data = await (apiService as any).getAuditLogs();
            setLogs(data);
        } catch (error) {
            console.error('Failed to load audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesAction = filterAction ? log.action === filterAction : true;

        return matchesSearch && matchesAction;
    });

    const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-[#003366] flex items-center gap-3">
                        <Shield className="w-8 h-8 text-[#0ea5e9]" />
                        Trilha de Auditoria
                    </h2>
                    <p className="text-gray-600 mt-1">Registro completo de ações e acessos para compliance e segurança.</p>
                </div>
                <button
                    onClick={loadLogs}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
                >
                    Atualizar Logs
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por ação, usuário ou recurso..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                >
                    <option value="">Todas as Ações</option>
                    {uniqueActions.map(action => (
                        <option key={action} value={action}>{action}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#003366] text-white text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Data/Hora</th>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Ação</th>
                                <th className="px-6 py-4">Recurso</th>
                                <th className="px-6 py-4">IP</th>
                                <th className="px-6 py-4 text-center">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-now8">
                                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {log.user?.name ? log.user.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 leading-none">{log.user?.name || 'Sistema/Anônimo'}</p>
                                                <p className="text-[10px] text-gray-500 mt-1">{log.user?.email || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${log.action.includes('FAILED') || log.action.includes('DELETE')
                                            ? 'bg-red-50 text-red-700 border-red-100'
                                            : log.action.includes('CREATED') || log.action.includes('SUCCESS')
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-600 font-medium flex items-center gap-1">
                                            <ClipboardList className="w-3.5 h-3.5 text-gray-400" />
                                            {log.resource}
                                            {log.resourceId && <span className="text-[10px] text-gray-400 font-mono">#{log.resourceId}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-gray-500 font-mono text-xs">
                                            <Globe className="w-3.5 h-3.5" />
                                            {log.ipAddress || '0.0.0.0'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {Object.keys(log.details || {}).length > 0 ? (
                                            <button
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors group"
                                                title={JSON.stringify(log.details, null, 2)}
                                            >
                                                <Info className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                                        Nenhum registro encontrado para os filtros selecionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <p>Exibindo últimos 200 logs de segurança.</p>
                    <p className="font-bold text-[#003366]">SENTINELA AI SYSTEM AUDIT</p>
                </div>
            </div>
        </div>
    );
}
