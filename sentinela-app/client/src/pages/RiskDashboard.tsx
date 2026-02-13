import { useEffect, useState } from 'react';
import { apiService } from '../services/ApiService';
import { type Notification } from '../services/MockDataService';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, RefreshCw, Activity, AlertTriangle, Clock, CheckCircle2, Building2, Brain, Mail } from 'lucide-react';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { EmailModal } from '../components/EmailModal';
import { Toast, type ToastType } from '../components/ui/Toast';

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

    // Email Modal State
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedEmailNotification, setSelectedEmailNotification] = useState<{ id: number, sector: string } | null>(null);
    const [emailLoading, setEmailLoading] = useState(false);

    // Initialize highlighted row from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sentinela_selected_notification');
        if (saved) {
            setHighlightedId(Number(saved));
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

        const eventDate = new Date(n.data_evento.split('/').reverse().join('-')); // Assuming dd/mm/yyyy
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
            // Optimistic update
            setNotifications(prev => prev.map(n => {
                if (n.id === id) {
                    const updated = { ...n, [field]: value };

                    if (field === 'tipo_notificacao' && value === 'NÃO CONFORMIDADE') {
                        updated.classificacao = 'NA';
                    }

                    // Optimistic Deadline Update
                    if (field === 'classificacao' && n.actionPlanStatus === 'IN_PROGRESS' && n.actionPlanStartDate) {
                        // We need to parse the start date correctly. 
                        // Assuming actionPlanStartDate is in "dd/mm/yyyy" or ISO. 
                        // The mock interface says string, usually formatted.
                        // Let's try to parse it. If it fails, we skip optimistic update for deadline.
                        try {
                            const parts = n.actionPlanStartDate?.split('/');
                            if (parts && parts.length === 3) {
                                const startDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                                const newDeadline = new Date(startDate);

                                switch (value) {
                                    case 'GRAVE':
                                        newDeadline.setDate(newDeadline.getDate() + 1);
                                        break;
                                    case 'MODERADO':
                                        newDeadline.setDate(newDeadline.getDate() + 3);
                                        break;
                                    default: // LEVE or NA
                                        newDeadline.setDate(newDeadline.getDate() + 5);
                                        break;
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

    const openConfirmationModal = (id: number) => {
        setSelectedId(id);
        setModalOpen(true);
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
            await loadData(true); // Silent reload
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
            'LEVE': 'bg-green-100 text-green-800 border-green-200',
            'MODERADO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'GRAVE': 'bg-red-100 text-red-800 border-red-200',
            'NA': 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return styles[level as keyof typeof styles] || 'bg-gray-100 text-gray-800';
    };

    const getNotificationTypeStyles = (type: string) => {
        const styles = {
            'EVENTO ADVERSO': 'bg-orange-100 text-orange-800 border-orange-200',
            'NÃO CONFORMIDADE': 'bg-blue-100 text-blue-800 border-blue-200',
        };
        return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-600 border-gray-200';
    };

    const getTratativaButtonStyles = (n: Notification) => {
        if (n.actionPlanStatus === 'IN_PROGRESS') {
            return 'bg-green-600 hover:bg-green-700 text-white'; // Started (Green)
        }

        // Check deadline for Warning (Yellow)
        if (n.prazo) {
            const deadline = new Date(n.prazo.split('/').reverse().join('-'));
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const diffTime = deadline.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 2 && diffDays >= 0) {
                return 'bg-yellow-500 hover:bg-yellow-600 text-white'; // Warning (Yellow)
            }
        }

        return 'bg-blue-600 hover:bg-blue-700 text-white'; // Default (Blue)
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const paginatedNotifications = filteredNotifications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="space-y-6">
            <ConfirmationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleConfirmSend}
                title="Reportar à Alta Gestão"
                message="Deseja encaminhar este evento para análise da Alta Gestão? Esta ação notificará os diretores responsáveis."
                isLoading={actionLoading}
                type="warning"
            />

            <EmailModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                onSend={handleSendEmail}
                isLoading={emailLoading}
                sectorName={selectedEmailNotification?.sector}
            />

            {/* Reanalysis Processing Banner */}
            {reanalyzingId && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="relative">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <Brain className="w-3 h-3 absolute top-1 left-1 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">Reanalisando Evento #{reanalyzingId}</span>
                        <span className="text-xs text-blue-100">A IA está processando os novos dados...</span>
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-[#003366]">INMCEB INSTITUTO DE MEDICINA DO COMPORTAMENTO EURÍPEDES BARSANULFO</h2>
                    <p className="text-sm text-gray-500">Monitoramento em tempo real de eventos adversos</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            placeholder="Buscar paciente, ID, setor..."
                            className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => loadData()}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                        title="Atualizar"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-gray-600 hover:bg-gray-50 border-gray-200'}`}
                        title="Filtrar"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                        title="Baixar CSV"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <Link
                        to="/gantt"
                        className="p-2 text-[#003366] hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                        title="Ver Cronograma (Gantt)"
                    >
                        <Clock className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Filters Bar */}
            {showFilters && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-5 gap-4 animate-fade-in-down">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setCurrentPage(1); }}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#003366]"
                        >
                            <option value="">Todos</option>
                            <option value="Aberto">Aberto</option>
                            <option value="Em Análise">Em Análise</option>
                            <option value="Concluído">Concluído</option>
                            <option value="PENDENTE">Pendente</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Classificação</label>
                        <select
                            value={filters.classificacao}
                            onChange={(e) => { setFilters({ ...filters, classificacao: e.target.value }); setCurrentPage(1); }}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#003366]"
                        >
                            <option value="">Todas</option>
                            <option value="LEVE">Leve</option>
                            <option value="MODERADO">Moderado</option>
                            <option value="GRAVE">Grave</option>
                            <option value="NA">NA</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                        <select
                            value={filters.tipo}
                            onChange={(e) => { setFilters({ ...filters, tipo: e.target.value }); setCurrentPage(1); }}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#003366]"
                        >
                            <option value="">Todos</option>
                            <option value="EVENTO ADVERSO">Evento Adverso</option>
                            <option value="NÃO CONFORMIDADE">Não Conformidade</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Inicial</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setCurrentPage(1); }}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#003366]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Final</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setCurrentPage(1); }}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#003366]"
                        />
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
                {/* 1. Eventos Adversos */}
                <div
                    onClick={() => { setFilters({ ...filters, tipo: 'EVENTO ADVERSO' }); setCurrentPage(1); }}
                    className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[10px] font-bold text-orange-600 uppercase">Eventos Adversos</h3>
                        <Activity className="w-3.5 h-3.5 text-orange-600" />
                    </div>
                    <p className="text-xl font-bold text-[#003366]">{filteredNotifications.filter(n => n.tipo_notificacao === 'EVENTO ADVERSO').length}</p>
                    <div className="w-full h-1 bg-orange-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: '100%' }} />
                    </div>
                </div>

                {/* 2. Não Conformidades */}
                <div
                    onClick={() => { setFilters({ ...filters, tipo: 'NÃO CONFORMIDADE' }); setCurrentPage(1); }}
                    className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[10px] font-bold text-blue-600 uppercase">Não Conformidades</h3>
                        <Activity className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <p className="text-xl font-bold text-[#003366]">{filteredNotifications.filter(n => n.tipo_notificacao === 'NÃO CONFORMIDADE').length}</p>
                    <div className="w-full h-1 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '100%' }} />
                    </div>
                </div>

                {/* 3. Total Eventos */}
                <div
                    onClick={() => { setFilters({ ...filters, tipo: '', classificacao: '', status: '' }); setCurrentPage(1); }}
                    className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase">Total Eventos</h3>
                        <Activity className="w-3.5 h-3.5 text-[#003366]" />
                    </div>
                    <p className="text-xl font-bold text-[#003366]">{filteredNotifications.length}</p>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                            className="h-full bg-orange-400"
                            style={{ width: `${(filteredNotifications.filter(n => n.tipo_notificacao === 'EVENTO ADVERSO').length / (filteredNotifications.length || 1)) * 100}%` }}
                        />
                        <div
                            className="h-full bg-blue-400"
                            style={{ width: `${(filteredNotifications.filter(n => n.tipo_notificacao === 'NÃO CONFORMIDADE').length / (filteredNotifications.length || 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* 4. Graves */}
                <div
                    onClick={() => { setFilters({ ...filters, classificacao: 'GRAVE' }); setCurrentPage(1); }}
                    className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[10px] font-bold text-red-500 uppercase">Graves</h3>
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <p className="text-xl font-bold text-[#003366]">{filteredNotifications.filter(n => n.classificacao === 'GRAVE').length}</p>
                    <div className="w-full h-1 bg-red-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: '100%' }} />
                    </div>
                </div>

                {/* 5. Moderados */}
                <div
                    onClick={() => { setFilters({ ...filters, classificacao: 'MODERADO' }); setCurrentPage(1); }}
                    className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[10px] font-bold text-yellow-600 uppercase">Moderados</h3>
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
                    </div>
                    <p className="text-xl font-bold text-[#003366]">{filteredNotifications.filter(n => n.classificacao === 'MODERADO').length}</p>
                    <div className="w-full h-1 bg-yellow-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-600" style={{ width: '100%' }} />
                    </div>
                </div>

                {/* 6. Leves */}
                <div
                    onClick={() => { setFilters({ ...filters, classificacao: 'LEVE' }); setCurrentPage(1); }}
                    className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[10px] font-bold text-green-600 uppercase">Leves</h3>
                        <AlertTriangle className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <p className="text-xl font-bold text-[#003366]">{filteredNotifications.filter(n => n.classificacao === 'LEVE').length}</p>
                    <div className="w-full h-1 bg-green-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600" style={{ width: '100%' }} />
                    </div>
                </div>

                {/* 7. Pendentes */}
                <div
                    onClick={() => { setFilters({ ...filters, status: 'PENDENTE' }); setCurrentPage(1); }}
                    className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[10px] font-bold text-yellow-500 uppercase">Pendentes</h3>
                        <Clock className="w-3.5 h-3.5 text-yellow-500" />
                    </div>
                    <p className="text-xl font-bold text-[#003366]">{filteredNotifications.filter(n => n.status === 'Aberto' || n.status === 'Em Análise').length}</p>
                    <div className="w-full h-1 bg-yellow-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500" style={{ width: '100%' }} />
                    </div>
                </div>

                {/* 8. Resolvidos */}
                <div
                    onClick={() => { setFilters({ ...filters, status: 'Concluído' }); setCurrentPage(1); }}
                    className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[10px] font-bold text-green-500 uppercase">Resolvidos</h3>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    </div>
                    <p className="text-xl font-bold text-[#003366]">{filteredNotifications.filter(n => n.status === 'Concluído').length}</p>
                    <div className="w-full h-1 bg-green-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '100%' }} />
                    </div>
                </div>

                {/* 9. Tratativa em Curso */}
                <div
                    className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-24 cursor-pointer hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[10px] font-bold text-blue-500 uppercase">Tratativa em Curso</h3>
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <p className="text-xl font-bold text-[#003366]">{filteredNotifications.filter(n => n.actionPlanStatus === 'IN_PROGRESS').length}</p>
                    <div className="w-full h-1 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '100%' }} />
                    </div>
                </div>
            </div>

            {/* Data Grid */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366]"></div>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg flex-1 overflow-hidden flex flex-col h-[calc(100vh-240px)] min-h-[500px]">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-[#003366] sticky left-0 bg-gray-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">ID</th>
                                    <th className="px-4 py-3 font-bold text-[#003366] sticky left-[60px] bg-gray-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Carimbo Data/Hora</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Nome Paciente</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Nome Mãe</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Nascimento</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Sexo</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Setor Ocorrência</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Setor Notificado</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Tipo Notificação</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Data Evento</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Período</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Idade</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Data Internação</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Tipo de Evento e Não Conformidade</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Classificação</th>
                                    <th className="px-4 py-3 font-bold text-[#003366]">Prazo Tratativa</th>
                                    <th className="px-4 py-3 font-bold text-[#003366] text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedNotifications.map((n) => (
                                    <tr
                                        key={n.id}
                                        onClick={() => handleRowClick(n.id)}
                                        className={`transition-colors group cursor-pointer ${highlightedId === n.id ? '!bg-blue-100 border-l-4 border-l-[#003366]' : 'hover:bg-blue-50/50 border-l-4 border-l-transparent'}`}
                                    >
                                        <td className={`px-4 py-3 font-medium text-[#003366] sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${highlightedId === n.id ? '!bg-blue-100' : 'bg-white group-hover:bg-blue-50/50'}`}>
                                            #{n.id}
                                        </td>
                                        <td className={`px-4 py-3 text-gray-600 sticky left-[60px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${highlightedId === n.id ? '!bg-blue-100' : 'bg-white group-hover:bg-blue-50/50'}`}>
                                            {n.created_at}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{n.paciente || '-'} {n.nascimento ? `(${n.nascimento})` : ''}</td>
                                        <td className="px-4 py-3 text-gray-500">{n.nome_mae || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500">{n.nascimento || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500">{n.sexo || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500">{n.setor}</td>
                                        <td className="px-4 py-3 text-gray-500">{n.setor_notificado || '-'}</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={n.tipo_notificacao}
                                                onChange={(e) => handleUpdate(n.id, 'tipo_notificacao', e.target.value)}
                                                className={`appearance-none cursor-pointer px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getNotificationTypeStyles(n.tipo_notificacao)}`}
                                                style={{ textAlignLast: 'center' }}
                                            >
                                                <option value="EVENTO ADVERSO">Evento Adverso</option>
                                                <option value="NÃO CONFORMIDADE">Não Conformidade</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{n.data_evento}</td>
                                        <td className="px-4 py-3 text-gray-500">{n.periodo || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500">{n.idade || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500">{n.data_internacao || '-'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={n.tipo_evento}
                                                    title={n.tipo_evento} // Show full text on hover
                                                    onChange={(e) => handleUpdate(n.id, 'tipo_evento', e.target.value)}
                                                    className="w-32 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 outline-none uppercase" // Added uppercase
                                                />
                                                <button
                                                    onClick={(e) => handleReanalyze(e, n.id)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Reanalisar com IA"
                                                >
                                                    <Brain className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={n.classificacao}
                                                onChange={(e) => handleUpdate(n.id, 'classificacao', e.target.value)}
                                                className={`appearance-none cursor-pointer px-2 py-0.5 rounded-full text-xs font-bold border outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getRiskBadgeStyles(n.classificacao)}`}
                                                style={{ textAlignLast: 'center' }}
                                            >
                                                <option value="LEVE">LEVE</option>
                                                <option value="MODERADO">MODERADO</option>
                                                <option value="GRAVE">GRAVE</option>
                                                <option value="NA">NA</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                            {n.prazo}
                                        </td>
                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenEmailModal(n); }}
                                                className="inline-flex items-center justify-center p-1.5 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#003366] transition-colors shadow-sm"
                                                title="Enviar Email para Gestor"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </button>
                                            <Link
                                                to={`/tratativa/${n.id}`}
                                                title={n.descricao}
                                                className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm ${getTratativaButtonStyles(n)}`}
                                            >
                                                {n.actionPlanStatus === 'IN_PROGRESS' && <Clock className="w-3 h-3 mr-1" />}
                                                Tratativa
                                            </Link>
                                            <button
                                                onClick={() => openConfirmationModal(n.id)}
                                                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors shadow-sm ml-2"
                                                title="Reportar à Alta Gestão"
                                            >
                                                <Building2 className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                        <span>Mostrando {paginatedNotifications.length} de {filteredNotifications.length} registros (Página {currentPage} de {totalPages})</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
