import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Brain, CheckCircle2, AlertTriangle, Paperclip, Play, FileText, MessageSquare, X, Send, GitBranch, HelpCircle, Calendar, Clock } from 'lucide-react';
import { apiService } from '../services/ApiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Toast, type ToastType } from '../components/ui/Toast';
import { InvestigationChat } from '../components/InvestigationChat';
import { FiveWhysAnalysis } from '../components/FiveWhysAnalysis';
import { InvestigationChecklist } from '../components/InvestigationChecklist';

export function TratativaPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [notification, setNotification] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rootCause, setRootCause] = useState('');
    const [actionPlan, setActionPlan] = useState('');
    const [hasEvidence, setHasEvidence] = useState(false);
    const [actionPlanDeadline, setActionPlanDeadline] = useState('');
    const rootCauseRef = useRef<HTMLDivElement>(null);
    const actionPlanRef = useRef<HTMLDivElement>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType; educational?: boolean } | null>(null);
    const [analysisMethod, setAnalysisMethod] = useState<'ishikawa' | '5whys'>('ishikawa');
    const [showDeadlineModal, setShowDeadlineModal] = useState(false);
    const [contactMessage, setContactMessage] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [investigationData, setInvestigationData] = useState<string | null>(null);
    const [isDeadlineRestriction, setIsDeadlineRestriction] = useState(false);
    const [isRejectionMode, setIsRejectionMode] = useState(false);

    // Deferral Mode State
    const [showDeferralModal, setShowDeferralModal] = useState(false);
    const [deferralDate, setDeferralDate] = useState('');
    const [deferralLoading, setDeferralLoading] = useState(false);
    const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const newFiles = Array.from(event.target.files);
            setEvidenceFiles(prev => [...prev, ...newFiles]);
            setHasEvidence(true);
            setToast({ message: 'Arquivo anexado com sucesso!', type: 'success' });
        }
    };

    const removeFile = (index: number) => {
        setEvidenceFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index);
            if (newFiles.length === 0) setHasEvidence(false);
            return newFiles;
        });
    };

    const handleContactRiskManager = async () => {
        console.log('Botão de contato clicado');
        if (!id) return;
        setSendingEmail(true);
        try {
            const defaultMessage = isDeadlineRestriction ? 'Solicitação de alteração de prazo.' : 'Contato geral sobre a tratativa.';
            await apiService.contactRiskManager(Number(id), contactMessage || defaultMessage);
            setToast({ message: 'Solicitação enviada ao Gestor de Risco com sucesso!', type: 'success' });
            setShowDeadlineModal(false);
            setContactMessage('');
        } catch (error) {
            console.error('Erro ao enviar solicitação:', error);
            setToast({ message: 'Erro ao enviar solicitação.', type: 'error' });
        } finally {
            setSendingEmail(false);
        }
    };

    const handleApproveDeadline = async () => {
        if (!id || !deferralDate) return;
        setDeferralLoading(true);
        try {
            // Adjust date to account for timezone if necessary, or just pass string
            // Here we pass Date object as expected by service
            const parts = deferralDate.split('-');
            const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

            await apiService.approveDeadline(Number(id), dateObj);
            setToast({ message: 'Prazo deferido e notificação enviada ao gestor!', type: 'success' });
            setShowDeferralModal(false);

            // Refresh data
            const updated = await apiService.getNotificationById(Number(id));
            setNotification(updated);

            // Clear URL params
            navigate(window.location.pathname, { replace: true });
        } catch (error) {
            console.error('Erro ao deferir prazo:', error);
            setToast({ message: 'Erro ao deferir prazo.', type: 'error' });
        } finally {
            setDeferralLoading(false);
        }
    };

    // Sync state to DOM for Root Cause (preserves native Undo)
    useEffect(() => {
        if (rootCauseRef.current && rootCauseRef.current.innerHTML !== rootCause) {
            rootCauseRef.current.innerHTML = rootCause;
        }
    }, [rootCause]);

    // Sync state to DOM for Action Plan (preserves native Undo)
    useEffect(() => {
        if (actionPlanRef.current && actionPlanRef.current.innerHTML !== actionPlan) {
            actionPlanRef.current.innerHTML = actionPlan;
        }
    }, [actionPlan]);

    // Handle Email Actions (Approve/Reject Deadline)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');

        if (action === 'approve_deadline') {
            setShowDeferralModal(true);
        } else if (action === 'reject_deadline') {
            setIsRejectionMode(true);
            setToast({
                message: 'Modo de Indeferimento: Confirme para notificar o gestor.',
                type: 'error'
            });
        }
    }, []);

    useEffect(() => {
        const fetchNotification = async () => {
            try {
                if (!id) return;
                const data = await apiService.getNotificationById(Number(id));
                if (data) {
                    setNotification(data);
                    if (data.rootCause) setRootCause(data.rootCause);
                    if (data.actionPlan) setActionPlan(data.actionPlan);
                    if (data.actionPlanDeadline) {
                        const [day, month, year] = data.actionPlanDeadline.split('/');
                        const isoDate = `${year}-${month}-${day}`;
                        setActionPlanDeadline(isoDate);
                        setActionPlanDeadline(isoDate);
                        // Also set initial deferral date
                        setDeferralDate(isoDate);
                    }
                    if (data.investigationList) {
                        setInvestigationData(data.investigationList);
                    }
                } else {
                    setError('Notificação não encontrada');
                }
            } catch (err) {
                setError('Erro ao carregar notificação');
            } finally {
                setLoading(false);
            }
        };

        fetchNotification();
    }, [id]);


    const generateRCA = async () => {
        if (!id) return;

        if (!investigationData) {
            setToast({ message: 'Conclua a etapa de Investigação antes de gerar a Análise.', type: 'error' });
            return;
        }

        setAnalyzing(true);
        try {
            const analysis = await apiService.analyzeRootCause(Number(id));
            setAnalysisData(analysis);
            setShowModal(true);
            setToast({ message: 'Análise gerada com sucesso!', type: 'success' });
        } catch (err) {
            console.error('Erro ao gerar análise:', err);
            setToast({ message: 'Erro ao gerar análise de causa raiz. Tente novamente.', type: 'error' });
        } finally {
            setAnalyzing(false);
        }
    };

    const handleInvestigationSave = async (data: string) => {
        if (!id) return;
        try {
            await apiService.updateNotification(Number(id), { investigationList: data });
            setInvestigationData(data);
            setToast({ message: 'Investigação salva com sucesso! Análise liberada.', type: 'success' });
        } catch (error) {
            console.error('Erro ao salvar investigação:', error);
            setToast({ message: 'Erro ao salvar investigação.', type: 'error' });
        }
    };

    const applyAnalysis = () => {
        if (!analysisData) return;

        // Format Ishikawa for Rich Text (HTML)
        const ishikawa = analysisData.ishikawa;
        const ishikawaHtml = `
            <div style="font-family: sans-serif; color: #333;">
                <h3 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 5px; margin-bottom: 10px;">DIAGRAMA DE ISHIKAWA (6M)</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px;">
                        <strong style="color: #2563eb; display: block; font-size: 0.75rem; text-transform: uppercase;">MÉTODO</strong>
                        <span style="font-size: 0.875rem;">${ishikawa.metodo || '-'}</span>
                    </div>
                    <div style="background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px;">
                        <strong style="color: #2563eb; display: block; font-size: 0.75rem; text-transform: uppercase;">MATERIAL</strong>
                        <span style="font-size: 0.875rem;">${ishikawa.material || '-'}</span>
                    </div>
                    <div style="background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px;">
                        <strong style="color: #2563eb; display: block; font-size: 0.75rem; text-transform: uppercase;">MÃO DE OBRA</strong>
                        <span style="font-size: 0.875rem;">${ishikawa.mao_de_obra || ishikawa.labor || '-'}</span>
                    </div>
                    <div style="background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px;">
                        <strong style="color: #2563eb; display: block; font-size: 0.75rem; text-transform: uppercase;">MÁQUINA</strong>
                        <span style="font-size: 0.875rem;">${ishikawa.maquina || ishikawa.machine || '-'}</span>
                    </div>
                    <div style="background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px;">
                        <strong style="color: #2563eb; display: block; font-size: 0.75rem; text-transform: uppercase;">MEIO AMBIENTE</strong>
                        <span style="font-size: 0.875rem;">${ishikawa.meio_ambiente || ishikawa.environment || '-'}</span>
                    </div>
                    <div style="background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px;">
                        <strong style="color: #2563eb; display: block; font-size: 0.75rem; text-transform: uppercase;">MEDIDA</strong>
                        <span style="font-size: 0.875rem;">${ishikawa.medida || ishikawa.measure || '-'}</span>
                    </div>
                </div>
                ${analysisData.rootCauseConclusion ? `
                <div style="margin-top: 15px; background: #eff6ff; border-left: 4px solid #2563eb; padding: 10px;">
                    <strong style="color: #1e3a8a; display: block; margin-bottom: 5px;">CONCLUSÃO DA CAUSA RAIZ:</strong>
                    <span style="color: #1e40af; font-size: 0.875rem;">${analysisData.rootCauseConclusion}</span>
                </div>` : ''}
            </div>
        `;

        setRootCause(ishikawaHtml);

        // Format Action Plan for Rich Text (HTML Table)
        const actionPlanList = Array.isArray(analysisData.actionPlan) ? analysisData.actionPlan : [];
        const actionPlanRows = actionPlanList.map((action: any) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${action.what || '-'}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${action.why || '-'}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${action.who || '-'}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${action.where || '-'}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${action.when || '-'}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${action.how || '-'}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${action.howMuch || '-'}</td>
            </tr>
        `).join('');

        const actionPlanHtml = `
            <div style="font-family: sans-serif; color: #333;">
                <h3 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 5px; margin-bottom: 10px;">PLANO DE AÇÃO (5W2H)</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                    <thead style="background: #f1f5f9; color: #334155; font-size: 0.75rem; text-transform: uppercase;">
                        <tr>
                            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">O que</th>
                            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Por que</th>
                            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Quem</th>
                            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Onde</th>
                            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Quando</th>
                            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Como</th>
                            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Quanto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${actionPlanRows}
                    </tbody>
                </table>
            </div>`;

        if (analysisData.suggestedDeadline) {
            const [day, month, year] = analysisData.suggestedDeadline.split('/');
            const isoDate = `${year}-${month}-${day}`;
            setActionPlanDeadline(isoDate);
        }

        setActionPlan(actionPlanHtml);
        setShowModal(false);
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const margin = 14;

        // Header
        doc.setFillColor(0, 51, 102);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('INMCEB INSTITUTO DE MEDICINA DO COMPORTAMENTO EURÍPEDES BARSANULFO', margin, 15);

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`Relatório de Tratativa de Evento #${notification.id}`, margin, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} `, margin, 33);

        let yPos = 50;

        // Event Details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Detalhes do Evento', margin, yPos);
        yPos += 8;

        autoTable(doc, {
            startY: yPos,
            head: [['Campo', 'Informação']],
            body: [
                ['Paciente', `${notification.paciente} ${notification.nascimento ? `(${notification.nascimento})` : ''}`],
                ['Data do Evento', notification.data_evento],
                ['Setor', notification.setor],
                ['Tipo de Evento', notification.tipo_evento],
                ['Classificação', notification.classificacao],
                ['Descrição', notification.descricao]
            ],
            theme: 'striped',
            headStyles: { fillColor: [0, 51, 102] },
            styles: { fontSize: 10 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Helper to parse HTML string to DOM
        const parseHtml = (html: string) => {
            const parser = new DOMParser();
            return parser.parseFromString(html, 'text/html');
        };

        // Ishikawa (Root Cause)
        if (rootCause) {
            const rootCauseDoc = parseHtml(rootCause);
            const items = rootCauseDoc.querySelectorAll('div[style*="background: #f8fafc"]');

            if (items.length > 0) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Análise de Causa Raiz (Ishikawa)', margin, yPos);
                yPos += 8;

                const ishikawaData: any[][] = [];
                items.forEach(item => {
                    const title = item.querySelector('strong')?.textContent || '';
                    const content = item.querySelector('span')?.textContent || '';
                    ishikawaData.push([title, content]);
                });

                autoTable(doc, {
                    startY: yPos,
                    head: [['Categoria', 'Causa Identificada']],
                    body: ishikawaData,
                    theme: 'grid',
                    headStyles: { fillColor: [37, 99, 235] }, // Blue-600
                    styles: { fontSize: 10, cellPadding: 4 },
                    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
                });

                yPos = (doc as any).lastAutoTable.finalY + 10;
            }

            // Conclusion
            const conclusionDiv = rootCauseDoc.querySelector('div[style*="background: #eff6ff"]');
            if (conclusionDiv) {
                const conclusionText = conclusionDiv.querySelector('span')?.textContent || '';
                if (conclusionText) {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(30, 58, 138); // Blue-900
                    doc.text('CONCLUSÃO DA CAUSA RAIZ:', margin, yPos);
                    yPos += 5;

                    autoTable(doc, {
                        startY: yPos,
                        body: [[conclusionText]],
                        theme: 'plain',
                        styles: {
                            fontSize: 10,
                            cellPadding: 0,
                            textColor: [0, 0, 0],
                            font: 'helvetica',
                        },
                        columnStyles: { 0: { cellWidth: pageWidth - (margin * 2) } },
                        didDrawCell: () => {
                            // Optional: Custom drawing if needed, but plain text is fine
                        }
                    });
                    yPos = (doc as any).lastAutoTable.finalY + 10;
                }
            }
        }

        // Action Plan (5W2H)
        if (actionPlan) {
            // Check if we need a new page
            if (yPos > pageHeight - 60) {
                doc.addPage();
                yPos = 20;
            }

            const actionPlanDoc = parseHtml(actionPlan);
            const rows = actionPlanDoc.querySelectorAll('tbody tr');

            if (rows.length > 0) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('Plano de Ação (5W2H)', margin, yPos);
                yPos += 8;

                const tableData: any[][] = [];
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    const rowData: string[] = [];
                    cells.forEach(cell => rowData.push(cell.textContent || ''));
                    tableData.push(rowData);
                });

                autoTable(doc, {
                    startY: yPos,
                    head: [['O que', 'Por que', 'Quem', 'Onde', 'Quando', 'Como', 'Quanto']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [0, 51, 102] },
                    styles: { fontSize: 8, cellPadding: 2 },
                });
            }
        }

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Página ${i} de ${pageCount} `, pageWidth - 20, pageHeight - 10, { align: 'right' });
        }

        doc.save(`Tratativa_Evento_${notification.id}.pdf`);
    };



    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-600">
                <AlertTriangle className="w-12 h-12 mb-2" />
                <p className="font-bold">{typeof error === 'object' ? (error as any).message || JSON.stringify(error) : error}</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-[#003366] underline">
                    Voltar
                </button>
            </div>
        );
    }

    if (!notification) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                <AlertTriangle className="w-12 h-12 mb-2" />
                <p className="font-bold">Notificação não encontrada</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-[#003366] underline">
                    Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 space-y-6">
            {toast && (
                <div className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${toast.educational ? 'bg-black/20 backdrop-blur-sm' : ''}`}>
                    <div className="pointer-events-auto">
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => setToast(null)}
                            duration={toast.educational ? 0 : 4000}
                        />
                        {toast.educational && (
                            <div className="mt-4 bg-white p-6 rounded-xl shadow-2xl border-l-4 border-green-500 max-w-md animate-in zoom-in duration-300">
                                <h4 className="text-lg font-bold text-green-800 mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Próximos Passos
                                </h4>
                                <p className="text-gray-600 mb-4">
                                    O Plano de Ação foi iniciado oficialmente! Agora, o foco é na execução e coleta de evidências.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                                        <span>Execute as ações conforme o cronograma definido.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                                        <span>Clique em <strong>"Adicionar Evidência"</strong> para anexar fotos ou documentos.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                                        <span>Após concluir, clique em <strong>"Finalizar Tratativa"</strong>.</span>
                                    </li>
                                </ul>
                                <button
                                    onClick={() => setToast(null)}
                                    className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors"
                                >
                                    Entendi, vamos lá!
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-[#003366] transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </button>
                <button
                    onClick={generatePDF}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
                    Gerar PDF
                </button>

            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-[#003366] text-white p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-bold text-blue-100 mb-1">INMCEB INSTITUTO DE MEDICINA DO COMPORTAMENTO EURÍPEDES BARSANULFO</h2>
                        <h1 className="text-xl font-bold">Tratativa de Evento #{notification.id}</h1>
                        <div className="flex gap-4 mt-2 text-blue-200 text-sm">
                            <p>Setor Notificado: <span className="font-semibold text-white">{notification.setor}</span></p>
                            <p>Data do Evento: <span className="font-semibold text-white">{notification.data_evento}</span></p>
                            <p>Prazo para Resposta: <span className="font-semibold text-white bg-red-500/20 px-2 py-0.5 rounded">{notification.prazo}</span></p>
                        </div>
                    </div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        {notification.status}
                    </span>
                </div>

                <div className="p-8 space-y-8">
                    {/* Event Details */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Descrição do Evento
                        </h3>
                        <p className="text-gray-800 text-base leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                            {notification.descricao}
                        </p>
                    </div>

                    {/* AI Analysis */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                        <div className="flex items-start gap-3 mb-4">
                            <Brain className="w-6 h-6 text-blue-600 mt-1" />
                            <div>
                                <h3 className="font-bold text-blue-900 text-lg">Análise Inteligente (IA)</h3>
                                <p className="text-blue-700 text-sm">Avaliação automática baseada na descrição do evento.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-white/60 p-3 rounded border border-blue-100">
                                <span className="text-xs font-bold text-blue-600 uppercase block mb-1">Tipo de Notificação</span>
                                <span className="font-medium text-blue-900">{notification.tipo_notificacao}</span>
                            </div>
                            <div className="bg-white/60 p-3 rounded border border-blue-100">
                                <span className="text-xs font-bold text-blue-600 uppercase block mb-1">Classificação de Risco</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${notification.classificacao === 'GRAVE' ? 'bg-red-100 text-red-700' :
                                    notification.classificacao === 'MODERADO' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                    {notification.classificacao}
                                </span>
                            </div>
                            <div className="bg-white/60 p-3 rounded border border-blue-100">
                                <span className="text-xs font-bold text-blue-600 uppercase block mb-1">Tipo Detectado</span>
                                <span className="font-medium text-blue-900">{notification.tipo_evento}</span>
                            </div>
                        </div>

                        <div className="mt-6 bg-white p-4 rounded-lg border-l-4 border-[#2E7D32] shadow-sm">
                            <h4 className="text-sm font-bold text-[#2E7D32] uppercase mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Recomendações da Qualidade
                            </h4>
                            <p className="text-gray-800 text-sm leading-relaxed font-medium">
                                {notification.recomendacao_ia}
                            </p>
                        </div>

                        {analysisData?.rootCauseConclusion && (
                            <div className="mt-4 bg-white p-4 rounded-lg border-l-4 border-blue-600 shadow-sm">
                                <h4 className="text-sm font-bold text-blue-900 uppercase mb-2 flex items-center gap-2">
                                    <Brain className="w-4 h-4" />
                                    Conclusão da Causa Raiz
                                </h4>
                                <p className="text-blue-800 text-sm leading-relaxed font-medium text-justify">
                                    {analysisData.rootCauseConclusion}
                                </p>
                            </div>
                        )}

                        {/* AI Investigation Chat */}
                        <div className="mt-6">
                            <InvestigationChat
                                notificationId={notification.id}
                                context={{
                                    description: notification.descricao,
                                    rootCause: rootCause
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Investigation Section */}
                <div>
                    <InvestigationChecklist
                        initialData={investigationData}
                        onSave={handleInvestigationSave}
                    // Lock if already has rootcause? Maybe not, allow editing investigation.
                    // But usually investigation comes first.
                    />
                </div>

                {/* Action Plan Form */}
                <div className="border-t pt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-[#003366] flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Plano de Ação
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={generateRCA}
                                disabled={analyzing}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {analyzing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Gerando Análise...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-4 h-4" />
                                        Gerar Análise IA
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Root Cause Analysis */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                    Análise de Causa Raiz
                                    <span className="text-xs font-normal text-gray-500">(Editável)</span>
                                </label>
                                <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                                    <button
                                        onClick={() => setAnalysisMethod('ishikawa')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-2 ${analysisMethod === 'ishikawa' ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <GitBranch className="w-3 h-3" />
                                        Ishikawa (6M)
                                    </button>
                                    <button
                                        onClick={() => setAnalysisMethod('5whys')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-2 ${analysisMethod === '5whys' ? 'bg-white text-[#003366] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <HelpCircle className="w-3 h-3" />
                                        5 Porquês
                                    </button>
                                </div>
                            </div>

                            {analysisMethod === 'ishikawa' ? (
                                <div
                                    ref={rootCauseRef}
                                    contentEditable
                                    onInput={(e) => setRootCause(e.currentTarget.innerHTML)}
                                    className="w-full min-h-[150px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none overflow-auto bg-white"
                                    style={{ maxHeight: '500px' }}
                                />
                            ) : (
                                <FiveWhysAnalysis
                                    notificationId={Number(id)}
                                    onSave={(data) => {
                                        // Format 5 Whys as HTML for the rootCause field
                                        const html = `
                                                <div style="font-family: sans-serif; color: #333;">
                                                    <h3 style="color: #003366; border-bottom: 2px solid #003366; padding-bottom: 5px; margin-bottom: 10px;">ANÁLISE DOS 5 PORQUÊS</h3>
                                                    <div style="background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
                                                        <div style="margin-bottom: 8px;"><strong>1. Por que?</strong> ${data.why1}</div>
                                                        <div style="margin-bottom: 8px;"><strong>2. Por que?</strong> ${data.why2}</div>
                                                        <div style="margin-bottom: 8px;"><strong>3. Por que?</strong> ${data.why3}</div>
                                                        <div style="margin-bottom: 8px;"><strong>4. Por que?</strong> ${data.why4}</div>
                                                        <div style="margin-bottom: 15px;"><strong>5. Por que (Causa Raiz)?</strong> ${data.why5}</div>
                                                        <div style="background: #eff6ff; padding: 10px; border-left: 4px solid #2563eb; border-radius: 4px;">
                                                            <strong style="color: #1e3a8a; display: block; font-size: 0.875rem; margin-bottom: 4px;">CONCLUSÃO:</strong>
                                                            <span>${data.rootCause}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            `;
                                        setRootCause(html);
                                    }}
                                />
                            )}
                        </div>

                        {/* Corrective Action */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                Ação Corretiva / Plano de Ação (5W2H)
                                <span className="text-xs font-normal text-gray-500">(Editável)</span>
                            </label>
                            <div
                                ref={actionPlanRef}
                                contentEditable
                                onInput={(e) => setActionPlan(e.currentTarget.innerHTML)}
                                className="w-full min-h-[150px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none overflow-auto bg-white"
                                style={{ maxHeight: '500px' }}
                            />
                        </div>

                        {/* Deadline Input */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                Prazo do Plano de Ação
                                <span className="text-xs font-normal text-gray-500">(Opcional - Define o prazo no Gantt)</span>
                            </label>
                            <input
                                type="date"
                                value={actionPlanDeadline}
                                onChange={(e) => setActionPlanDeadline(e.target.value)}
                                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
                            />
                        </div>

                        <div className="flex justify-end pt-4 gap-3">
                            <button
                                onClick={async () => {
                                    if (!id) return;
                                    if (!rootCause || !actionPlan) {
                                        setToast({ message: 'Preencha a Causa Raiz e o Plano de Ação antes de iniciar.', type: 'error' });
                                        return;
                                    }

                                    // Check if deadline is being modified after being set
                                    if (notification.actionPlanDeadline) {
                                        // Fix: Parse BR date format (dd/mm/yyyy) manually
                                        const [day, month, year] = notification.actionPlanDeadline.split('/');
                                        const originalDeadline = `${year}-${month}-${day}`;
                                        const params = new URLSearchParams(window.location.search);
                                        const isApprovalMode = params.get('action') === 'approve_deadline';

                                        if (isApprovalMode) {
                                            try {
                                                await apiService.approveDeadline(Number(id), new Date(actionPlanDeadline));
                                                setToast({ message: 'Prazo deferido e notificação enviada!', type: 'success' });
                                                const updated = await apiService.getNotificationById(Number(id));
                                                setNotification(updated);
                                                navigate(window.location.pathname, { replace: true });
                                                return;
                                            } catch (error) {
                                                console.error('Erro ao deferir prazo:', error);
                                                setToast({ message: 'Erro ao deferir prazo.', type: 'error' });
                                                return;
                                            }
                                        }

                                        if (actionPlanDeadline !== originalDeadline) {
                                            setIsDeadlineRestriction(true);
                                            setShowDeadlineModal(true);
                                            return;
                                        }
                                    }


                                    const createLocalDate = (dateString: string) => {
                                        const [y, m, d] = dateString.split('-').map(Number);
                                        return new Date(y, m - 1, d);
                                    };

                                    try {
                                        await apiService.updateNotification(Number(id), {
                                            rootCause,
                                            actionPlan,
                                            actionPlanDeadline: actionPlanDeadline ? createLocalDate(actionPlanDeadline) : undefined
                                        });
                                        await apiService.startActionPlan(Number(id), actionPlanDeadline ? createLocalDate(actionPlanDeadline) : undefined);
                                        setToast({
                                            message: 'Plano de Ação iniciado com sucesso!',
                                            type: 'success',
                                            educational: true
                                        });
                                        const updated = await apiService.getNotificationById(Number(id));
                                        setNotification(updated);
                                    } catch (error) {
                                        console.error('Erro ao iniciar plano de ação:', error);
                                        setToast({ message: 'Erro ao iniciar plano de ação.', type: 'error' });
                                    }
                                }}
                                disabled={!rootCause || !actionPlan}
                                className={`px-6 py-3 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2 ${!rootCause || !actionPlan
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#003366] hover:bg-[#002244] text-white'
                                    }`}
                            >
                                <Play className="w-5 h-5" />
                                {new URLSearchParams(window.location.search).get('action') === 'approve_deadline' ? 'SALVAR NOVO PRAZO' : 'INICIAR PLANO DE AÇÃO E SALVAR'}
                            </button>
                            {isRejectionMode && (
                                <button
                                    onClick={async () => {
                                        if (!id) return;
                                        try {
                                            await apiService.rejectDeadline(Number(id));
                                            setToast({ message: 'Indeferimento confirmado e e-mail enviado.', type: 'success' });
                                            setIsRejectionMode(false);
                                            navigate(window.location.pathname, { replace: true });
                                        } catch (error) {
                                            console.error('Erro ao indeferir:', error);
                                            setToast({ message: 'Erro ao confirmar indeferimento.', type: 'error' });
                                        }
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
                                >
                                    <AlertTriangle className="w-5 h-5" />
                                    CONFIRMAR INDEFERIMENTO
                                </button>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                onChange={handleFileUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-3 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
                            >
                                <Paperclip className="w-5 h-5" />
                                ADICIONAR EVIDÊNCIA
                            </button>
                            <button
                                onClick={async () => {
                                    if (!id) return;
                                    try {
                                        await apiService.updateNotification(Number(id), { status: 'Concluído' });
                                        setToast({ message: 'Tratativa finalizada com sucesso!', type: 'success' });
                                        const updated = await apiService.getNotificationById(Number(id));
                                        setNotification(updated);
                                    } catch (error) {
                                        console.error('Erro ao finalizar tratativa:', error);
                                        setToast({ message: 'Erro ao finalizar tratativa.', type: 'error' });
                                    }
                                }}
                                disabled={!rootCause || !hasEvidence}
                                className={`px-6 py-3 rounded-lg font-bold shadow-md transition-colors ${!rootCause || !hasEvidence
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white'
                                    }`}
                            >
                                FINALIZAR TRATATIVA
                            </button>
                        </div>

                        {/* Evidence File List */}
                        {evidenceFiles.length > 0 && (
                            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <Paperclip className="w-4 h-4" />
                                    Evidências Anexadas ({evidenceFiles.length})
                                </h4>
                                <ul className="space-y-2">
                                    {evidenceFiles.map((file, index) => {
                                        const fileUrl = URL.createObjectURL(file);
                                        const isImage = file.type.startsWith('image/');
                                        return (
                                            <li key={index} className="flex flex-col bg-white p-3 rounded border border-gray-100 shadow-sm text-sm gap-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="truncate max-w-[250px] text-gray-700 font-medium flex items-center gap-2">
                                                        <Paperclip className="w-3 h-3 text-gray-400" />
                                                        {file.name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 px-2 py-1 rounded"
                                                        >
                                                            VISUALIZAR
                                                        </a>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                removeFile(index);
                                                            }}
                                                            className="text-red-500 hover:text-red-700 bg-red-50 p-1 rounded transition-colors"
                                                            title="Remover arquivo"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {isImage && (
                                                    <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                                                        <img src={fileUrl} alt="Preview" className="w-full h-full object-contain" />
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* AI Analysis Modal */}
            {
                showModal && analysisData && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="bg-[#003366] text-white p-6 flex justify-between items-center sticky top-0">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Brain className="w-6 h-6" />
                                    Análise de Causa Raiz e Plano de Ação (IA)
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {
                                    /* Ishikawa */
                                }
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Diagrama de Ishikawa (Causa e Efeito)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                            <span className="text-xs font-bold text-blue-600 uppercase block mb-1">MÉTODO</span>
                                            <p className="text-sm text-gray-700">{analysisData.ishikawa.metodo || '-'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                            <span className="text-xs font-bold text-blue-600 uppercase block mb-1">MATERIAL</span>
                                            <p className="text-sm text-gray-700">{analysisData.ishikawa.material || '-'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                            <span className="text-xs font-bold text-blue-600 uppercase block mb-1">MÃO DE OBRA</span>
                                            <p className="text-sm text-gray-700">{analysisData.ishikawa.mao_de_obra || analysisData.ishikawa.labor || '-'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                            <span className="text-xs font-bold text-blue-600 uppercase block mb-1">MEIO AMBIENTE</span>
                                            <p className="text-sm text-gray-700">{analysisData.ishikawa.meio_ambiente || analysisData.ishikawa.environment || '-'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                            <span className="text-xs font-bold text-blue-600 uppercase block mb-1">MEDIDA</span>
                                            <p className="text-sm text-gray-700">{analysisData.ishikawa.medida || analysisData.ishikawa.measure || '-'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                            <span className="text-xs font-bold text-blue-600 uppercase block mb-1">MÁQUINA</span>
                                            <p className="text-sm text-gray-700">{analysisData.ishikawa.maquina || analysisData.ishikawa.machine || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {
                                    /* 5W2H Table */
                                }
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Plano de Ação (5W2H)</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-600 border-collapse min-w-[800px]">
                                            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-2 border w-1/6">O que (What)</th>
                                                    <th className="px-4 py-2 border w-1/6">Por que (Why)</th>
                                                    <th className="px-4 py-2 border w-1/12">Quem (Who)</th>
                                                    <th className="px-4 py-2 border w-1/12">Onde (Where)</th>
                                                    <th className="px-4 py-2 border w-1/12">Quando (When)</th>
                                                    <th className="px-4 py-2 border w-1/6">Como (How)</th>
                                                    <th className="px-4 py-2 border w-1/12">Quanto (How Much)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.isArray(analysisData.actionPlan) ? analysisData.actionPlan.map((action: any, idx: number) => (
                                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                                        <td className="px-4 py-2 border align-top">{action.what || '-'}</td>
                                                        <td className="px-4 py-2 border align-top">{action.why || '-'}</td>
                                                        <td className="px-4 py-2 border align-top">{action.who || '-'}</td>
                                                        <td className="px-4 py-2 border align-top">{action.where || '-'}</td>
                                                        <td className="px-4 py-2 border align-top">{action.when || '-'}</td>
                                                        <td className="px-4 py-2 border align-top">{action.how || '-'}</td>
                                                        <td className="px-4 py-2 border align-top">{action.howMuch || '-'}</td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-2 border text-center text-gray-500">
                                                            Nenhum plano de ação estruturado retornado.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Root Cause Conclusion */}
                                {analysisData.rootCauseConclusion && (
                                    <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                                        <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                                            <Brain className="w-5 h-5" />
                                            Conclusão da Causa Raiz (IA)
                                        </h3>
                                        <p className="text-blue-800 text-sm leading-relaxed font-medium text-justify">
                                            {analysisData.rootCauseConclusion}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3 sticky bottom-0">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={applyAnalysis}
                                    className="px-4 py-2 text-white bg-[#003366] hover:bg-[#002244] rounded-lg font-bold shadow-md flex items-center gap-2"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Usar esta Análise
                                </button>
                            </div>

                            {analysisData.suggestedDeadline && (
                                <div className="px-6 pb-4 text-xs text-gray-500 text-right">
                                    Prazo Sugerido: <strong>{analysisData.suggestedDeadline}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Deadline Restriction Modal */}
            {
                showDeadlineModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in duration-300">
                            {/* Header with Gradient */}
                            <div className={`p-6 ${isDeadlineRestriction ? 'bg-gradient-to-r from-red-50 to-white' : 'bg-gradient-to-r from-blue-50 to-white'} border-b border-gray-100`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className={`p-3 rounded-xl shadow-sm ${isDeadlineRestriction ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-[#003366]'}`}>
                                            {isDeadlineRestriction ? <AlertTriangle className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className={`text-xl font-bold ${isDeadlineRestriction ? 'text-red-900' : 'text-[#003366]'}`}>
                                                {isDeadlineRestriction ? 'Alteração de Prazo Restrita' : 'Fale com o Gestor'}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {isDeadlineRestriction
                                                    ? 'Esta ação requer aprovação do Gestor de Risco.'
                                                    : 'Envie uma mensagem direta para o responsável.'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDeadlineModal(false)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        Mensagem / Justificativa
                                    </label>
                                    <textarea
                                        value={contactMessage}
                                        onChange={(e) => setContactMessage(e.target.value)}
                                        placeholder={isDeadlineRestriction ? "Explique o motivo da solicitação de novo prazo..." : "Digite sua mensagem..."}
                                        className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none h-32 text-sm resize-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeadlineModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleContactRiskManager}
                                    disabled={sendingEmail}
                                    className={`px-6 py-2 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${isDeadlineRestriction
                                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                                        : 'bg-gradient-to-r from-[#003366] to-[#004488] hover:from-[#002244] hover:to-[#003366]'
                                        }`}
                                >
                                    {sendingEmail ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            {isDeadlineRestriction ? 'Solicitar Novo Prazo' : 'Enviar Mensagem'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Deferral Mode Modal */}
            {
                showDeferralModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white/90 backdrop-blur-md w-full max-w-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200 m-4">
                            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CheckCircle2 className="w-6 h-6" />
                                    Deferir Novo Prazo
                                </h2>
                                <p className="text-green-100 text-sm mt-1">Defina o novo prazo para o plano de ação.</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-green-600" />
                                        Novo Prazo
                                    </label>
                                    <input
                                        type="date"
                                        value={deferralDate}
                                        onChange={(e) => setDeferralDate(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all bg-white/50"
                                    />
                                </div>

                                <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-sm text-green-800 flex gap-3">
                                    <Clock className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <p>
                                        Ao confirmar, o prazo será atualizado e o gestor responsável será notificado automaticamente por e-mail.
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setShowDeferralModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                        disabled={deferralLoading}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleApproveDeadline}
                                        disabled={deferralLoading || !deferralDate}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {deferralLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                Confirmar Novo Prazo
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

