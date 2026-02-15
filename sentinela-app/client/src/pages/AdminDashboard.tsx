import { useState, useEffect } from 'react';
import { apiService } from '../services/ApiService';
import { Building2, Users, Search, Key, CreditCard, ChevronDown, ChevronUp, DollarSign, TrendingUp, Mail, UserPlus, Trash2, X, Lock, Unlock } from 'lucide-react';
import { Toast, type ToastType } from '../components/ui/Toast';
import React from 'react';

export function AdminDashboard() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // UI States
    const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
    const [resettingPasswordUser, setResettingPasswordUser] = useState<any | null>(null);
    const [newPassword, setNewPassword] = useState('');

    // User CRUD States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTenantForUser, setSelectedTenantForUser] = useState<any | null>(null);
    const [newUserForm, setNewUserForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER'
    });
    const [userToDelete, setUserToDelete] = useState<any | null>(null);
    const [tenantToDelete, setTenantToDelete] = useState<any | null>(null);

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            const [tData, sData] = await Promise.all([
                apiService.getAdminTenantsDetailed(),
                apiService.getAdminStats()
            ]);
            setTenants(tData);
            setStats(sData);
        } catch (error) {
            setToast({ message: 'Erro ao carregar dados financeiros.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSendSalesEmail = async (userEmail: string) => {
        try {
            await apiService.adminSendSalesEmail(userEmail);
            setToast({ message: `E-mail de prospecção enviado para ${userEmail}`, type: 'success' });
        } catch (error) {
            setToast({ message: 'Erro ao enviar e-mail.', type: 'error' });
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantForUser) return;
        try {
            await apiService.adminCreateUser({
                ...newUserForm,
                tenantId: selectedTenantForUser.id
            });
            setToast({ message: 'Usuário criado com sucesso!', type: 'success' });
            setIsCreateModalOpen(false);
            setNewUserForm({ name: '', email: '', password: '', role: 'USER' });
            loadAdminData();
        } catch (error) {
            setToast({ message: 'Erro ao criar usuário.', type: 'error' });
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await apiService.adminDeleteUser(userToDelete.id);
            setToast({ message: 'Usuário removido com sucesso!', type: 'success' });
            setUserToDelete(null);
            loadAdminData();
        } catch (error) {
            setToast({ message: 'Erro ao remover usuário.', type: 'error' });
        }
    };

    const handleDeleteTenant = async () => {
        if (!tenantToDelete) return;
        try {
            await apiService.adminDeleteTenant(tenantToDelete.id);
            setToast({ message: 'Hospital e todos os dados removidos com sucesso!', type: 'success' });
            setTenantToDelete(null);
            loadAdminData();
        } catch (error) {
            setToast({ message: 'Erro ao remover hospital.', type: 'error' });
        }
    };

    const handleToggleSubscription = async (tenantId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        try {
            await apiService.adminUpdateSubscription(tenantId, newStatus);
            setToast({
                message: `Hospital ${newStatus === 'suspended' ? 'suspenso' : 'ativado'} com sucesso!`,
                type: 'success'
            });
            loadAdminData();
        } catch (error) {
            setToast({ message: 'Erro ao atualizar status do hospital.', type: 'error' });
        }
    };

    const handleResetPassword = async () => {
        if (!resettingPasswordUser || !newPassword) return;
        try {
            await apiService.adminResetPassword(resettingPasswordUser.id, newPassword);
            setToast({ message: 'Senha resetada com sucesso!', type: 'success' });
            setResettingPasswordUser(null);
            setNewPassword('');
        } catch (error) {
            setToast({ message: 'Erro ao resetar senha.', type: 'error' });
        }
    };

    const calculateRemainingDays = (endDate: string) => {
        const remaining = new Date(endDate).getTime() - new Date().getTime();
        const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
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
                        <DollarSign className="w-8 h-8 text-emerald-500" />
                        Painel Administrativo Financeiro
                    </h2>
                    <p className="text-gray-600 mt-1">Monitore MRR, assinaturas ativas e prospecção de novos clientes.</p>
                </div>
                <button
                    onClick={loadAdminData}
                    className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-bold hover:bg-[#002244] transition-all"
                >
                    Atualizar Dados
                </button>
            </div>

            {/* Financial Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">MRR Estimado</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.estimatedMRR || 0)}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Assinantes Ativos</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.activeSubscriptions || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Usuários Totais</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-orange-50 rounded-lg">
                        <Building2 className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Hospitais na Base</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalTenants || 0}</p>
                    </div>
                </div>
            </div>

            {/* Billing Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-emerald-500" />
                        Faturamento por Cliente
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar hospital ou slug..."
                            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64"
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
                                <th className="px-6 py-4 text-center">Status de Pagamento</th>
                                <th className="px-6 py-4 text-center">Fim do Período / Trial</th>
                                <th className="px-6 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredTenants.map(t => {
                                const mainUser = t.users[0];
                                const isTrial = mainUser?.subscriptionStatus === 'trialing';
                                const daysLeft = mainUser?.currentPeriodEnd ? calculateRemainingDays(mainUser.currentPeriodEnd) : null;

                                return (
                                    <React.Fragment key={t.id}>
                                        <tr className={`hover:bg-gray-50 transition-colors ${mainUser?.subscriptionStatus === 'suspended' ? 'opacity-60 bg-gray-50/50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{t.name}</div>
                                                <div className="text-xs text-gray-500">slug: {t.slug}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {mainUser?.subscriptionStatus === 'suspended' ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 uppercase border border-gray-200">
                                                        Acesso Suspenso
                                                    </span>
                                                ) : isTrial ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">
                                                        Em Teste
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                                                        Assinante Ativo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {daysLeft !== null ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-xs font-bold ${daysLeft <= 7 ? 'text-red-500' : 'text-gray-900'}`}>
                                                            {daysLeft} dias restantes
                                                        </span>
                                                        <div className="text-[10px] text-gray-400">
                                                            Até {new Date(mainUser.currentPeriodEnd).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-medium text-gray-400">
                                                        Sem prazo definido
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {isTrial && daysLeft !== null && daysLeft <= 15 && (
                                                        <button
                                                            onClick={() => handleSendSalesEmail(mainUser.email)}
                                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                                            title="Enviar E-mail de Prospecção"
                                                        >
                                                            <Mail className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleToggleSubscription(t.id, mainUser?.subscriptionStatus)}
                                                        className={`p-2 rounded-lg transition-colors ${mainUser?.subscriptionStatus === 'suspended' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                                                        title={mainUser?.subscriptionStatus === 'suspended' ? "Reativar Acesso (Liberar)" : "Suspender Acesso (Bloquear)"}
                                                    >
                                                        {mainUser?.subscriptionStatus === 'suspended' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setTenantToDelete(t)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                        title="Excluir Hospital (Permanente)"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setExpandedTenant(expandedTenant === t.id ? null : t.id)}
                                                        className="p-2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {expandedTenant === t.id ? <ChevronUp /> : <ChevronDown />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedTenant === t.id && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={4} className="px-10 py-4">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Usuários Registrados</h4>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTenantForUser(t);
                                                                    setIsCreateModalOpen(true);
                                                                }}
                                                                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                                                            >
                                                                <UserPlus className="w-3 h-3" />
                                                                Adicionar Usuário
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {t.users.map((u: any) => (
                                                                <div key={u.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm">
                                                                    <div>
                                                                        <p className="text-sm font-bold text-gray-900">{u.name}</p>
                                                                        <p className="text-[10px] text-gray-500">{u.email}</p>
                                                                        <p className="text-[10px] font-medium text-emerald-600">{u.role}</p>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            onClick={() => setResettingPasswordUser(u)}
                                                                            className="p-2 hover:bg-orange-50 text-orange-500 rounded-md transition-colors"
                                                                            title="Resetar Senha"
                                                                        >
                                                                            <Key className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setUserToDelete(u)}
                                                                            className="p-2 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                                                                            title="Excluir Usuário"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Novo Usuário</h3>
                                    <p className="text-sm text-gray-500">{selectedTenantForUser?.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome Completo</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={newUserForm.name}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-mail</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={newUserForm.email}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Senha Inicial</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={newUserForm.password}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Role/Papel</label>
                                <select
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                    value={newUserForm.role}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                >
                                    <option value="USER">Usuário Comum</option>
                                    <option value="TENANT_ADMIN">Admin Hospitalar</option>
                                    <option value="RISK_ANALYST">Analista de Riscos</option>
                                    <option value="SUPER_ADMIN">Super Administrador</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                            >
                                Criar Usuário
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {userToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-sm:max-w-xs w-full p-8 animate-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-red-100 rounded-full text-red-600">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Excluir Usuário?</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    Deseja realmente remover **{userToDelete.name}**? Esta ação não pode ser desfeita.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setUserToDelete(null)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                                >
                                    Sim, Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Tenant Confirmation Modal */}
            {tenantToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-8 animate-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-red-100 rounded-full text-red-600 animate-pulse">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#003366]">Excluir Hospital?</h3>
                                <p className="text-sm text-red-600 font-bold mt-2 uppercase tracking-tight">
                                    CUIDADO: Ação Irreversível!
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Isso apagará permanentemente o hospital **{tenantToDelete.name}**, todos os seus usuários, setores e dados de incidentes.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    onClick={handleDeleteTenant}
                                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                                >
                                    Confirmar Exclusão Total
                                </button>
                                <button
                                    onClick={() => setTenantToDelete(null)}
                                    className="w-full px-4 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
