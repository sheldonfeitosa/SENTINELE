import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/ApiService';
import { type Notification } from '../services/MockDataService';
import { ChevronLeft, Calendar, Clock, AlertTriangle, CheckCircle2, X, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function GanttPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const headerScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await apiService.getNotifications();
                // Filter only items with Action Plan started
                const activeItems = data.filter(n => n.actionPlanStatus && n.actionPlanStatus !== 'NOT_STARTED');
                setNotifications(activeItems);
            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Helper to parse "dd/mm/yyyy" to Local Date (00:00:00)
    const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    };

    // Helper to calculate position and width
    const getBarStyles = (start: string, end: string, minDate: Date, totalDays: number) => {
        const startDate = parseDate(start);
        const endDate = parseDate(end);

        const startDiff = Math.max(0, (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        const duration = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const left = (startDiff / totalDays) * 100;
        const width = (duration / totalDays) * 100;

        return { left: `${left}%`, width: `${width}%` };
    };



    // Calculate timeline range
    const dates = notifications.flatMap(n => [
        n.actionPlanStartDate ? parseDate(n.actionPlanStartDate) : new Date(),
        n.actionPlanDeadline ? parseDate(n.actionPlanDeadline) : new Date()
    ]);
    const today = new Date();
    dates.push(today);

    let minDateVal = Math.min(...dates.map(d => d.getTime()));
    let maxDateVal = Math.max(...dates.map(d => d.getTime()));

    // Enforce at least +/- 15 days padding for visual context
    const PADDING_DAYS = 15;
    const minDateLimit = new Date();
    minDateLimit.setDate(minDateLimit.getDate() - PADDING_DAYS);

    const maxDateLimit = new Date();
    maxDateLimit.setDate(maxDateLimit.getDate() + PADDING_DAYS);

    if (minDateVal > minDateLimit.getTime()) minDateVal = minDateLimit.getTime();
    if (maxDateVal < maxDateLimit.getTime()) maxDateVal = maxDateLimit.getTime();

    const minDate = new Date(minDateVal);
    minDate.setHours(0, 0, 0, 0); // Normalize to midnight
    const maxDate = new Date(maxDateVal);
    maxDate.setHours(0, 0, 0, 0); // Normalize to midnight

    const totalDays = Math.max(10, (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate current date position
    // const today = new Date(); // Already declared above
    const todayDiff = (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const todayLeft = (todayDiff / totalDays) * 100;
    const showCurrentDateLine = todayLeft >= 0 && todayLeft <= 100;

    // Generate calendar headers
    const calendarDays: Date[] = [];
    for (let i = 0; i <= totalDays; i++) {
        const d = new Date(minDate);
        d.setDate(d.getDate() + i);
        calendarDays.push(d);
    }

    // Sync scrolling
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    // Auto-scroll to Today - Effect ensuring visibility on load
    useEffect(() => {
        if (!loading && showCurrentDateLine && scrollContainerRef.current) {
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    // For precise centering, we need the total scrollable width of the *timeline content* part
                    // The timeline content starts after the 256px sidebar (w-64)
                    // The 'todayLeft' is percentage of that timeline width.
                    // Total Scroll Width = 256px + TimelineWidth
                    // Target Scroll = (TimelineWidth * todayLeft/100) - (ViewWidth - 256px)/2

                    const sidebarWidth = 256;
                    const scrollWidth = container.scrollWidth;
                    const clientWidth = container.clientWidth;

                    // Actually, the sidebar is sticky INSIDE the container, so it counts towards scrollWidth?
                    // No, usually sticky elements are part of the flow.
                    // The structure is: 
                    // Container -> [Sticky Sidebar (w-64)] [Timeline Content (flex-1 min-w-[800px])]
                    // So scrollWidth = 256 + 800 (min) or more.
                    // todayLeft is relative to the *Timeline Content* only? 
                    // Let's check calculation of 'left':
                    // const left = (startDiff / totalDays) * 100;
                    // This 'left' is applied to bars inside 'flex-1 relative'. 
                    // So 0% is right after the sidebar.

                    // So position in pixels from start of scroll container:
                    // Pos = SidebarWidth + (TimelineActualWidth * todayLeft / 100)

                    // We want this Pos to be in the center of the Available Viewport (clientWidth).
                    // Center of Viewport = ScrollLeft + (clientWidth / 2)

                    // So: ScrollLeft + clientWidth/2 = SidebarWidth + (TimelineActualWidth * todayLeft / 100)
                    // ScrollLeft = SidebarWidth + (TimelineActualWidth * todayLeft / 100) - clientWidth/2

                    // wait, TimelineActualWidth is (scrollWidth - SidebarWidth)?
                    // Yes, roughly.

                    const timelineActualWidth = scrollWidth - sidebarWidth;
                    const targetPos = sidebarWidth + (timelineActualWidth * (todayLeft / 100));

                    const centerScroll = targetPos - (clientWidth / 2);

                    container.scrollLeft = centerScroll;
                    if (headerScrollRef.current) {
                        headerScrollRef.current.scrollLeft = centerScroll;
                    }
                }
            }, 100);
        }
    }, [loading, showCurrentDateLine, todayLeft]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
                            <Calendar className="w-6 h-6" />
                            Cronograma de Planos de Ação
                        </h1>
                        <p className="text-gray-500">Acompanhamento visual de prazos e status</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-gray-500 hover:text-[#003366] transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Voltar ao Dashboard
                    </button>
                </div>

                {/* Gantt Chart Container */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">

                    {/* Timeline Header */}
                    <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto" ref={headerScrollRef}>
                        <div className="w-64 flex-shrink-0 p-4 font-bold text-gray-600 border-r border-gray-200 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            Evento / ID
                        </div>
                        <div className="flex-1 flex relative" style={{ minWidth: `${totalDays * 50}px` }}>
                            {calendarDays.map((date, i) => (
                                <div key={i} className="flex-1 min-w-[40px] border-r border-gray-100 p-2 text-center">
                                    <span className="block text-xs font-bold text-gray-500">{date.getDate()}</span>
                                    <span className="block text-[10px] text-gray-400 uppercase">{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                                </div>
                            ))}
                            {/* Current Date Line Header */}
                            {showCurrentDateLine && (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                                    style={{ left: `${todayLeft}%` }}
                                    title="Hoje"
                                >
                                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="overflow-x-auto" ref={scrollContainerRef} onScroll={handleScroll}>
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                Nenhum plano de ação iniciado.
                            </div>
                        ) : (
                            notifications.map(n => {
                                const isOverdue = n.actionPlanDeadline && parseDate(n.actionPlanDeadline) < new Date();
                                const barColor = isOverdue ? 'bg-red-500' : 'bg-green-500';
                                const styles = n.actionPlanStartDate && n.actionPlanDeadline
                                    ? getBarStyles(n.actionPlanStartDate, n.actionPlanDeadline, minDate, totalDays)
                                    : { left: '0%', width: '0%' };

                                return (
                                    <div key={n.id} className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                                        <div className="w-64 flex-shrink-0 p-4 border-r border-gray-200 sticky left-0 bg-white group-hover:bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            <div className="font-bold text-[#003366] text-sm">#{n.id} - {n.tipo_evento}</div>
                                            <div className="text-xs text-gray-500 truncate">{n.paciente} {n.nascimento ? `(${n.nascimento})` : ''}</div>
                                            <div className="mt-1 flex items-center gap-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${n.classificacao === 'GRAVE' ? 'bg-red-100 text-red-700' :
                                                    n.classificacao === 'MODERADO' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {n.classificacao}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 relative py-4" style={{ minWidth: `${totalDays * 50}px` }}>
                                            {/* Grid Lines */}
                                            <div className="absolute inset-0 flex pointer-events-none">
                                                {calendarDays.map((_, i) => (
                                                    <div key={i} className="flex-1 border-r border-gray-100 h-full"></div>
                                                ))}
                                            </div>

                                            {/* Current Date Line Body */}
                                            {showCurrentDateLine && (
                                                <div
                                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                                                    style={{ left: `${todayLeft}%` }}
                                                />
                                            )}

                                            {/* Task Bar */}
                                            {n.actionPlanStartDate && n.actionPlanDeadline && (
                                                <div
                                                    className={`absolute h-8 rounded-md shadow-sm ${barColor} flex items-center px-2 text-white text-xs font-bold overflow-hidden whitespace-nowrap transition-all hover:brightness-110 cursor-pointer`}
                                                    style={{
                                                        left: styles.left,
                                                        width: styles.width,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)'
                                                    }}
                                                    title={`Início: ${n.actionPlanStartDate} - Prazo: ${n.actionPlanDeadline}`}
                                                    onClick={() => setSelectedNotification(n)}
                                                >
                                                    {isOverdue && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                    {!isOverdue && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                    {n.status}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Banner Modal */}
            {selectedNotification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 m-4">
                        <div className="bg-[#003366] p-6 text-white flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Resumo do Evento #{selectedNotification.id}
                                </h2>
                                <p className="text-blue-200 text-sm mt-1">{selectedNotification.tipo_evento}</p>
                            </div>
                            <button
                                onClick={() => setSelectedNotification(null)}
                                className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-1"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Paciente</span>
                                    <span className="font-medium text-gray-900">{selectedNotification.paciente} {selectedNotification.nascimento ? `(${selectedNotification.nascimento})` : ''}</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Status do Plano</span>
                                    <div className="flex items-center gap-2">
                                        {selectedNotification.actionPlanStatus === 'IN_PROGRESS' ? (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Em Andamento
                                            </span>
                                        ) : (
                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Pendente</span>
                                        )}
                                        {selectedNotification.actionPlanDeadline && parseDate(selectedNotification.actionPlanDeadline) < new Date() && (
                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> Atrasado
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500 font-bold">Início:</span>
                                            <span className="text-[#003366] font-medium">{selectedNotification.actionPlanStartDate || '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs mt-1">
                                            <span className="text-gray-500 font-bold">Prazo Final:</span>
                                            <span className="text-red-600 font-medium">{selectedNotification.actionPlanDeadline || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-2">Descrição do Evento</span>
                                <p className="text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm leading-relaxed">
                                    {selectedNotification.descricao}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setSelectedNotification(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Fechar
                                </button>
                                <button
                                    onClick={() => navigate(`/tratativa/${selectedNotification.id}`)}
                                    className="px-4 py-2 bg-[#003366] text-white rounded-lg font-bold hover:bg-[#002244] transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                                >
                                    Ver Detalhes Completos <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
