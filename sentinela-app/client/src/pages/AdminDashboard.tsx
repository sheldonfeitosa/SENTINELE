import { useState, useEffect } from 'react';
import { apiService } from '../services/ApiService';
import { Building2, Users, AlertCircle, Search, ShieldCheck, Key, Clock, CreditCard, ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import { Toast, type ToastType } from '../components/ui/Toast';
import React from 'react';

export function AdminDashboard() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // UI States
    const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
    const [editingDeadline, setEditingDeadline] = useState<number | null>(null);
    const [newDeadline, setNewDeadline] = useState('');
    const [resettingPasswordUser, setResettingPasswordUser] = useState<any | null>(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            const [tData, iData, sData] = await Promise.all([
                apiService.getAdminTenantsDetailed(),
                apiService.getAdminIncidents(),
                apiService.getAdminStats()
            ]);
            setTenants(tData);
            setIncidents(iData);
            setStats(sData);
        } catch (error) {
            console.error('Failed to load admin data:', error);
            setToast({ message: 'Erro ao carregar dados administrativos.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resettingPasswordUser || !newPassword) return;
        try {
            await apiService.adminResetPassword(resettingPasswordUser.id, newPassword);
            setToast({ message: `Senha de ${resettingPasswordUser.name} alterada com sucesso!`, type: 'success' });
            setResettingPasswordUser(null);
            setNewPassword('');
        } catch (error) {
            setToast({ message: 'Erro ao resetar senha.', type: 'error' });
        }
    };

    const handleUpdateDeadline = async (incidentId: number) => {
        if (!newDeadline) return;
        try {
            await apiService.adminUpdateDeadline(incidentId, new Date(newDeadline));
            setToast({ message: 'Prazo atualizado com sucesso.', type: 'success' });
            setEditingDeadline(null);
            loadAdminData(); // Refresh list
        } catch (error) {
            setToast({ message: 'Erro ao atualizar prazo.', type: 'error' });
        }
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-[#003366] flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-[#0ea5e9]" />
                        Gestão Estratégica Sentinela AI
                    </h2>
                    <p className="text-gray-600 mt-1">Controle total sobre clientes, usuários, assinaturas e auditoria.</p>
                </div>
                <button
                    onClick={loadAdminData}
                    className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-bold hover:bg-[#002244] transition-all"
                >
                    Atualizar Dados
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Hospitais na Base</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalTenants || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Incidentes Totais</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalIncidents || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Usuários Totais</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                    </div>
                </div>
            </div>

            {/* Hospital & User Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#0ea5e9]" />
                        Clientes e Usuários
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar hospital ou slug..."
                            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Hospital</th>
                                <th className="px-6 py-4">Status SaaS</th>
                                <th className="px-6 py-4 text-center">Usuários</th>
                                <th className="px-6 py-4">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredTenants.map(t => (
                                <React.Fragment key={t.id}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{t.name}</div>
                                            <div className="text-xs text-gray-500">slug: {t.slug}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {t.users[0]?.subscriptionStatus === 'trialing' ? (
                                                    <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                                                        Teste (30 Dias)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                                                        Cliente Ativo
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-blue-600">
                                            {t.users.length}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setExpandedTenant(expandedTenant === t.id ? null : t.id)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                {expandedTenant === t.id ? <ChevronUp /> : <ChevronDown />}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedTenant === t.id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={4} className="px-10 py-4">
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Usuários do {t.name}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {t.users.map((u: any) => (
                                                            <div key={u.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm">
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-900">{u.name}</p>
                                                                    <p className="text-[10px] text-gray-500">{u.email}</p>
                                                                    <p className="text-[10px] font-medium text-blue-500">{u.role}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => setResettingPasswordUser(u)}
                                                                    className="p-2 hover:bg-orange-50 text-orange-500 rounded-md transition-colors"
                                                                    title="Mudar Senha"
                                                                >
                                                                    <Key className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Global Audit Log */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-baseline justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            Controle Global de Incidentes
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Alterar prazos e auditar dados de formulários de qualquer cliente.</p>
                    </div>
                </div>
                <div className="overflow-x-auto h-[500px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-gray-50 shadow-sm z-10">
                            <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">ID / Hospital</th>
                                <th className="px-6 py-4">Paciente</th>
                                <th className="px-6 py-4">Setor</th>
                                <th className="px-6 py-4">Prazo de Tratativa</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Auditoria</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                            {incidents.map(i => (
                                <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-[#003366]">#{i.id}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">{i.tenant.name}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800 uppercase">{i.patientName || 'Anônimo'}</td>
                                    <td className="px-6 py-4">{i.sector}</td>
                                    <td className="px-6 py-4">
                                        {editingDeadline === i.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="date"
                                                    className="p-1 border border-gray-300 rounded text-[10px]"
                                                    value={newDeadline}
                                                    onChange={(e) => setNewDeadline(e.target.value)}
                                                />
                                                <button onClick={() => handleUpdateDeadline(i.id)} className="text-green-500"><Save className="w-4 h-4" /></button>
                                                <button onClick={() => setEditingDeadline(null)} className="text-red-500"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-orange-600">
                                                    {i.actionPlanDeadline ? new Date(i.actionPlanDeadline).toLocaleDateString('pt-BR') : 'S/ PRAZO'}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setEditingDeadline(i.id);
                                                        setNewDeadline(i.actionPlanDeadline ? new Date(i.actionPlanDeadline).toISOString().split('T')[0] : '');
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${i.status === 'Concluído' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {i.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-blue-500 font-bold hover:underline">Ver Detalhes</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Password Reset Modal */}
            {resettingPasswordUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 animate-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                                <Key className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Resetar Senha</h3>
                                <p className="text-sm text-gray-500">Usuário: {resettingPasswordUser.name}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nova Senha</label>
                                <input
                                    type="password"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono"
                                    placeholder="Digite a nova senha..."
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setResettingPasswordUser(null)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleResetPassword}
                                    className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                                >
                                    Confirmar Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
