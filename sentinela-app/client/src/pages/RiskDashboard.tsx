import { useEffect, useState } from 'react';
import { apiService } from '../services/ApiService';
import { type Notification } from '../services/MockDataService';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, RefreshCw, Activity, AlertTriangle, Clock, CheckCircle2, Building2, Brain, Mail } from 'lucide-react';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { EmailModal } from '../components/EmailModal';
import { Toast, type ToastType } from '../components/ui/Toast';
import { DashboardStats } from '../components/dashboard/DashboardStats';

export function RiskDashboard() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        classificacao: '',
        tipo: '',
        startDate: '',
        endDate: ''
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);
    const [reanalyzingId, setReanalyzingId] = useState<number | null>(null);
    const [hospitalName, setHospitalName] = useState('Hospital');

    // Email Modal State
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedEmailNotification, setSelectedEmailNotification] = useState<{ id: number, sector: string } | null>(null);
    const [emailLoading, setEmailLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Initialize highlighted row and hospital name from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sentinela_selected_notification');
        if (saved) {
            setHighlightedId(Number(saved));
        }

        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.tenant?.name) {
                    setHospitalName(user.tenant.name);
                } else {
                    setHospitalName('Hospital Geral');
                }
            } catch (e) {
                console.error('Failed to parse user data');
            }
        }
    }, []);

    const handleRowClick = (id: number) => {
        setHighlightedId(id);
        localStorage.setItem('sentinela_selected_notification', id.toString());
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = (
            n.paciente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.id.toString().includes(searchTerm) ||
            n.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (n.nome_mae && n.nome_mae.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const matchesStatus = filters.status
            ? (filters.status === 'PENDENTE'
                ? (n.status === 'Aberto' || n.status === 'Em Análise')
                : n.status === filters.status)
            : true;
        const matchesClassificacao = filters.classificacao ? n.classificacao === filters.classificacao : true;
        const matchesTipo = filters.tipo ? n.tipo_notificacao === filters.tipo : true;

        const eventDate = new Date(n.data_evento.split('/').reverse().join('-'));
        const matchesStartDate = filters.startDate ? eventDate >= new Date(filters.startDate) : true;
        const matchesEndDate = filters.endDate ? eventDate <= new Date(filters.endDate) : true;

        return matchesSearch && matchesStatus && matchesClassificacao && matchesTipo && matchesStartDate && matchesEndDate;
    });

    const handleDownload = () => {
        const headers = ['ID', 'Data Criação', 'Paciente', 'Mãe', 'Nascimento', 'Sexo', 'Setor', 'Setor Notificado', 'Tipo Notificação', 'Data Evento', 'Período', 'Idade', 'Internação', 'Tipo Evento (IA)', 'Classificação', 'Prazo', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredNotifications.map(n => [
                n.id,
                n.created_at,
                `"${n.paciente || ''} ${n.nascimento ? `(${n.nascimento})` : ''}"`,
                `"${n.nome_mae || ''}"`,
                n.nascimento || '',
                n.sexo || '',
                n.setor,
                n.setor_notificado || '',
                n.tipo_notificacao,
                n.data_evento,
                n.periodo || '',
                n.idade || '',
                n.data_internacao || '',
                n.tipo_evento || '',
                n.classificacao,
                n.prazo,
                n.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `notificacoes_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await apiService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleUpdate = async (id: number, field: string, value: string) => {
        try {
            await apiService.updateNotification(id, { [field]: value });
            setNotifications(prev => prev.map(n => {
                if (n.id === id) {
                    const updated = { ...n, [field]: value };
                    if (field === 'tipo_notificacao' && value === 'NÃO CONFORMIDADE') {
                        updated.classificacao = 'NA';
                    }
                    if (field === 'classificacao' && n.actionPlanStatus === 'IN_PROGRESS' && n.actionPlanStartDate) {
                        try {
                            const parts = n.actionPlanStartDate?.split('/');
                            if (parts && parts.length === 3) {
                                const startDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                                const newDeadline = new Date(startDate);
                                switch (value) {
                                    case 'GRAVE': newDeadline.setDate(newDeadline.getDate() + 1); break;
                                    case 'MODERADO': newDeadline.setDate(newDeadline.getDate() + 3); break;
                                    default: newDeadline.setDate(newDeadline.getDate() + 5); break;
                                }
                                updated.prazo = newDeadline.toLocaleDateString('pt-BR');
                            }
                        } catch (e) {
                            console.error("Error calculating optimistic deadline", e);
                        }
                    }
                    return updated;
                }
                return n;
            }));
        } catch (error) {
            console.error('Failed to update:', error);
            setToast({ message: 'Erro ao atualizar registro.', type: 'error' });
        }
    };

    const handleConfirmSend = async () => {
        if (!selectedId) return;
        setActionLoading(true);
        try {
            await apiService.notifyHighManagement(selectedId);
            setModalOpen(false);
            setToast({ message: 'Reporte enviado à Alta Gestão com sucesso!', type: 'success' });
        } catch (err) {
            console.error('Erro ao reportar:', err);
            setToast({ message: 'Erro ao enviar reporte. Verifique se existem gestores de Alta Gestão cadastrados.', type: 'error' });
        } finally {
            setActionLoading(false);
            setSelectedId(null);
        }
    };

    const handleReanalyze = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            setReanalyzingId(id);
            await apiService.reanalyzeNotification(id);
            await loadData(true);
            setToast({ message: 'Reanálise concluída com sucesso!', type: 'success' });
        } catch (error) {
            console.error('Failed to reanalyze:', error);
            setToast({ message: 'Erro ao reanalisar notificação.', type: 'error' });
        } finally {
            setReanalyzingId(null);
        }
    };

    const handleOpenEmailModal = (n: Notification) => {
        setSelectedEmailNotification({ id: n.id, sector: n.setor_notificado || n.setor });
        setEmailModalOpen(true);
    };

    const handleSendEmail = async (email: string) => {
        if (!selectedEmailNotification) return;
        setEmailLoading(true);
        try {
            await apiService.forwardToSector(selectedEmailNotification.id, email);
            setEmailModalOpen(false);
            setToast({ message: 'Email enviado com sucesso para o gestor!', type: 'success' });
            setSelectedEmailNotification(null);
        } catch (error) {
            console.error('Failed to send email:', error);
            setToast({ message: 'Erro ao enviar email.', type: 'error' });
        } finally {
            setEmailLoading(false);
        }
    };

    const getRiskBadgeStyles = (level: string) => {
        const styles = {
            'LEVE': 'bg-green-100 text-green-800 border-green-200 shadow-sm',
            'MODERADO': 'bg-amber-100 text-amber-800 border-amber-200 shadow-sm',
            'GRAVE': 'bg-rose-100 text-rose-800 border-rose-200 shadow-sm font-bold',
            'NA': 'bg-slate-100 text-slate-800 border-slate-200',
        };
        return styles[level as keyof typeof styles] || 'bg-slate-100 text-slate-800';
    };

    const getNotificationTypeStyles = (type: string) => {
        const styles = {
            'EVENTO ADVERSO': 'bg-orange-50 text-orange-700 border-orange-200 text-[10px] py-0.5 px-2 rounded font-bold uppercase tracking-wider',
            'NÃO CONFORMIDADE': 'bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0.5 px-2 rounded font-bold uppercase tracking-wider',
        };
        return styles[type as keyof typeof styles] || 'bg-slate-50 text-slate-600 border-slate-200';
    };

    const getTratativaButtonStyles = (n: Notification) => {
        if (n.actionPlanStatus === 'IN_PROGRESS') return 'bg-emerald-600 hover:bg-emerald-700 text-white';
        if (n.prazo) {
            const deadline = new Date(n.prazo.split('/').reverse().join('-'));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 2 && diffDays >= 0) return 'bg-amber-500 hover:bg-amber-600 text-white';
        }
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    };

    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const paginatedNotifications = filteredNotifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    };

    const calculateStats = () => {
        const riskDistribution = [
            { name: 'GRAVE', value: notifications.filter(n => n.classificacao === 'GRAVE').length },
            { name: 'MODERADO', value: notifications.filter(n => n.classificacao === 'MODERADO').length },
            { name: 'LEVE', value: notifications.filter(n => n.classificacao === 'LEVE').length },
            { name: 'NA', value: notifications.filter(n => n.classificacao === 'NA').length },
        ].filter(r => r.value > 0);

        const sectorMap: Record<string, number> = {};
        notifications.forEach(n => { sectorMap[n.setor] = (sectorMap[n.setor] || 0) + 1; });
        const topSectors = Object.entries(sectorMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return { riskDistribution, topSectors };
    };

    const { riskDistribution, topSectors } = calculateStats();

    return (
        <div className="space-y-6 pb-20">
            {/* ... modals ... */}
            <ConfirmationModal
                isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={handleConfirmSend}
                title="Reportar à Alta Gestão" message="Deseja encaminhar este evento para análise da Alta Gestão?"
                isLoading={actionLoading} type="warning"
            />
            <EmailModal
                isOpen={emailModalOpen} onClose={() => setEmailModalOpen(false)} onSend={handleSendEmail}
                isLoading={emailLoading} sectorName={selectedEmailNotification?.sector}
            />

            {reanalyzingId && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-[#003366] text-white px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-6 animate-in slide-in-from-top-12 duration-500 border border-white/10 backdrop-blur-xl">
                    <div className="relative">
                        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <Brain className="w-5 h-5 absolute top-2.5 left-2.5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg tracking-tight">IA IA REANALISANDO EVENTO #{reanalyzingId}</span>
                        <span className="text-sm text-blue-200/80">Refinando classificação e plano de ação...</span>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header / Command Bar */}
            <div className="glass-card p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 w-full">
                    <div className="p-3 bg-[#003366] rounded-xl shadow-lg shadow-blue-900/20">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#003366] tracking-tight decoration-blue-500/20 underline-offset-4">{hospitalName}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status: Monitoramento Ativo (IA ON)</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text" value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            placeholder="Buscar por paciente, ID, setor ou descrição..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-300 placeholder:text-slate-400 shadow-inner"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => loadData()} className="p-3 text-slate-400 hover:text-[#003366] hover:bg-blue-50 rounded-xl border border-slate-200 transition-all duration-300 shadow-sm" title="Atualizar">
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => setShowFilters(!showFilters)} className={`p-3 rounded-xl border transition-all duration-300 shadow-sm ${showFilters ? 'bg-[#003366] border-[#003366] text-white ring-4 ring-blue-100' : 'text-slate-400 hover:text-[#003366] hover:bg-blue-50 border-slate-200'}`} title="Filtros Avançados">
                            <Filter className="w-5 h-5" />
                        </button>
                        <button onClick={handleDownload} className="p-3 text-slate-400 hover:text-[#003366] hover:bg-blue-50 rounded-xl border border-slate-200 transition-all duration-300 shadow-sm" title="Exportar Relatório">
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Drawer */}
            {showFilters && (
                <div className="glass-card p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status do Fluxo</label>
                        <select
                            value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setCurrentPage(1); }}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-200 outline-none"
                        >
                            <option value="">TODOS</option>
                            <option value="Aberto">ABERTO</option>
                            <option value="Em Análise">EM ANÁLISE</option>
                            <option value="Concluído">CONCLUÍDO</option>
                            <option value="PENDENTE">PENDENTE</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Classificação IA</label>
                        <select
                            value={filters.classificacao} onChange={(e) => { setFilters({ ...filters, classificacao: e.target.value }); setCurrentPage(1); }}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-200 outline-none"
                        >
                            <option value="">TODAS</option>
                            <option value="LEVE">LEVE</option>
                            <option value="MODERADO">MODERADO</option>
                            <option value="GRAVE">GRAVE</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Natureza do Evento</label>
                        <select
                            value={filters.tipo} onChange={(e) => { setFilters({ ...filters, tipo: e.target.value }); setCurrentPage(1); }}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-200 outline-none"
                        >
                            <option value="">TODOS</option>
                            <option value="EVENTO ADVERSO">EVENTO ADVERSO</option>
                            <option value="NÃO CONFORMIDADE">NÃO CONFORMIDADE</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Janela: Início</label>
                        <input
                            type="date" value={filters.startDate} onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setCurrentPage(1); }}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Janela: Fim</label>
                        <input
                            type="date" value={filters.endDate} onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setCurrentPage(1); }}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                    </div>
                </div>
            )}

            <DashboardStats
                totalEvents={notifications.length}
                openEvents={notifications.filter(n => n.status !== 'Concluído').length}
                resolvedEvents={notifications.filter(n => n.status === 'Concluído').length}
                riskDistribution={riskDistribution}
                topSectors={topSectors}
                onFilterRisk={(risk) => {
                    setFilters(f => ({ ...f, classificacao: risk }));
                    setCurrentPage(1);
                    setShowFilters(true);
                }}
            />

            {/* Main Content Area */}
            <div className="glass-card rounded-2xl border border-slate-200 shadow-2xl flex flex-col h-[650px] overflow-hidden">
                <div className="overflow-auto scrollbar-premium flex-1">
                    <table className="w-full text-sm text-left whitespace-nowrap border-separate border-spacing-0">
                        <thead className="bg-[#001a33] sticky top-0 z-40 transform-gpu">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-[#00aaff] uppercase border-b border-white/5 bg-[#001a33] sticky left-0 z-50">ID</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-[#00aaff] uppercase border-b border-white/5 bg-[#001a33] sticky left-[80px] z-50">Data/Hora</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase border-b border-white/5">Paciente</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase border-b border-white/5">Mãe</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase border-b border-white/5 text-center">Setor</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase border-b border-white/5 text-center">Natureza</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase border-b border-white/5 text-center">IA Recomenda</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase border-b border-white/5 text-center">Risco</th>
                                <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase border-b border-white/5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(10).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-6 border-b border-slate-50"><div className="h-2 w-8 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-6 border-b border-slate-50"><div className="h-2 w-24 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-6 border-b border-slate-50"><div className="h-2 w-48 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-6 border-b border-slate-50"><div className="h-2 w-32 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-6 border-b border-slate-50"><div className="h-2 w-16 bg-slate-100 rounded mx-auto"></div></td>
                                        <td className="px-6 py-6 border-b border-slate-50"><div className="h-2 w-24 bg-slate-100 rounded mx-auto"></div></td>
                                        <td className="px-6 py-6 border-b border-slate-50"><div className="h-2 w-24 bg-slate-100 rounded mx-auto"></div></td>
                                        <td className="px-6 py-6 border-b border-slate-50"><div className="h-2 w-16 bg-slate-100 rounded-full mx-auto"></div></td>
                                        <td className="px-6 py-6 border-b border-slate-50"><div className="h-2 w-20 bg-slate-100 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : (
                                paginatedNotifications.map((n) => (
                                    <tr
                                        key={n.id} onClick={() => handleRowClick(n.id)}
                                        className={`group cursor-pointer transition-all duration-300 ${highlightedId === n.id ? 'bg-blue-50/80' : 'hover:bg-slate-50/80 text-slate-600 hover:text-slate-900'}`}
                                    >
                                        <td className={`px-6 py-4 font-mono font-bold text-xs sticky left-0 z-20 ${highlightedId === n.id ? 'bg-blue-50/80 text-blue-700' : 'bg-white group-hover:bg-slate-50/80 text-slate-400'}`}>
                                            #{n.id}
                                        </td>
                                        <td className={`px-6 py-4 text-xs font-medium sticky left-[80px] z-20 ${highlightedId === n.id ? 'bg-blue-50/80' : 'bg-white group-hover:bg-slate-50/80'}`}>
                                            {n.created_at}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-xs">{n.paciente || '-'}</span>
                                                <span className="text-[10px] text-slate-400">{n.nascimento ? `Nasc: ${n.nascimento}` : ''}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{n.nome_mae || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase tracking-tight">{n.setor}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <select
                                                value={n.tipo_notificacao} onChange={(e) => handleUpdate(n.id, 'tipo_notificacao', e.target.value)}
                                                className={`${getNotificationTypeStyles(n.tipo_notificacao)} border focus:ring-2 focus:ring-blue-100 cursor-pointer outline-none transition-all`}
                                            >
                                                <option value="EVENTO ADVERSO">EVENTO ADVERSO</option>
                                                <option value="NÃO CONFORMIDADE">NÃO CONFORMIDADE</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <input
                                                    type="text" value={n.tipo_evento} onChange={(e) => handleUpdate(n.id, 'tipo_evento', e.target.value)}
                                                    className="w-36 px-2 py-1 text-[10px] font-bold bg-slate-50 border border-slate-200 rounded uppercase focus:ring-2 focus:ring-blue-200 focus:bg-white outline-none transition-all"
                                                />
                                                <button onClick={(e) => handleReanalyze(e, n.id)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="Reanálise Profunda (IA)">
                                                    <Brain className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <select
                                                value={n.classificacao} onChange={(e) => handleUpdate(n.id, 'classificacao', e.target.value)}
                                                className={`${getRiskBadgeStyles(n.classificacao)} border text-[10px] px-2.5 py-1 rounded-full cursor-pointer outline-none focus:ring-2 focus:ring-blue-200 transition-all uppercase`}
                                            >
                                                <option value="LEVE">LEVE</option>
                                                <option value="MODERADO">MODERADO</option>
                                                <option value="GRAVE">GRAVE</option>
                                                <option value="NA">N/A</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenEmailModal(n); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all" title="Acionar Responsável">
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                                <Link
                                                    to={`/tratativa/${n.id}`}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${getTratativaButtonStyles(n)} transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                                                >
                                                    {n.actionPlanStatus === 'IN_PROGRESS' && <Clock className="w-3 h-3 animate-spin" />}
                                                    <span>Tratativa</span>
                                                </Link>
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedId(n.id); setModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-slate-100 transition-all" title="Alta Gestão">
                                                    <Building2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Controls */}
                <div className="bg-slate-50/80 backdrop-blur-md px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registros Visíveis</p>
                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black text-[#003366]">{paginatedNotifications.length} de {filteredNotifications.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                            className="p-2 text-slate-400 hover:text-[#003366] disabled:opacity-30 disabled:hover:bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                        >
                            <Clock className="w-5 h-5 rotate-180" />
                        </button>
                        <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-slate-400">
                            <span className="text-[#003366]">{currentPage}</span>
                            <span>/</span>
                            <span>{totalPages}</span>
                        </div>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                            className="p-2 text-slate-400 hover:text-[#003366] disabled:opacity-30 disabled:hover:bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                        >
                            <Clock className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
