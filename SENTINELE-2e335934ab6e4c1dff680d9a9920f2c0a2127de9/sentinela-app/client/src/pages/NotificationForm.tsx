import React from 'react';
import ReactDOM from 'react-dom';
import { useForm } from 'react-hook-form';
import { ShieldCheck, Brain, Scale, Activity, Mic, MicOff, CheckCircle } from 'lucide-react';
import { apiService } from '../services/ApiService';

import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

type FormData = {
    paciente: string;
    nome_mae: string;
    nascimento: string;
    sexo: string;
    data_internacao: string;
    data_evento: string;
    periodo: string;
    setor: string;
    descricao: string;
    tipo_notificacao: string;
};



import { useParams } from 'react-router-dom';

export function NotificationForm() {
    const { tenantSlug: slugFromUrl } = useParams<{ tenantSlug: string }>();

    // Se não há slug na URL (rota /notificacao), tenta usar o slug do usuário logado
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const tenantSlug = slugFromUrl || userFromStorage?.tenant?.slug;

    const [selectedType, setSelectedType] = React.useState<'EVENTO ADVERSO' | 'NÃO CONFORMIDADE'>('EVENTO ADVERSO');
    const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<FormData>();

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [sectors, setSectors] = React.useState<{ id: number; name: string }[]>([]);
    const [showSuccessModal, setShowSuccessModal] = React.useState(false);
    const [createdId, setCreatedId] = React.useState<number | null>(null);
    const [hospitalName, setHospitalName] = React.useState<string | null>(null);
    const [loadError, setLoadError] = React.useState<string | null>(null);

    // Use custom hook
    const { isListening, stopListening, startListening, warning } = useSpeechRecognition();

    // Store cursor position or base text logic if needed, but for simplicity
    // we'll append or replace. The original logic appended.
    // Let's keep a simplistic append approach for now or just append to end.

    const handleToggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            // Capture current text to append to
            const currentText = getValues('descricao') || '';
            const baseText = currentText + (currentText && !/\s$/.test(currentText) ? ' ' : '');

            startListening((newTranscript) => {
                // This callback runs on every result update from the hook
                setValue('descricao', baseText + newTranscript, {
                    shouldValidate: true,
                    shouldDirty: true
                });
            });
        }
    };

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const [sectorsData, tenantInfo] = await Promise.all([
                    apiService.getSectors(tenantSlug),
                    tenantSlug ? apiService.getTenantInfo(tenantSlug) : Promise.resolve(null)
                ]);
                if ((!sectorsData || sectorsData.length === 0) && !tenantInfo) {
                    setLoadError('Link inválido: Hospital não identificado ou sem configuração de setores.');
                }
                setSectors(sectorsData || []);
                if (tenantInfo?.name) setHospitalName(tenantInfo.name);
            } catch (error: any) {
                console.error('Failed to load data', error);
                const msg = error?.response?.data?.error || error.message || 'Erro de conexão';
                setLoadError(`Falha ao carregar dados: ${msg}`);
            }
        };
        loadData();
    }, []);

    React.useEffect(() => {
        setValue('tipo_notificacao', selectedType);
    }, [selectedType, setValue]);

    React.useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log('Form validation errors:', errors);
        }
    }, [errors]);

    const onSubmit = async (data: FormData) => {
        console.log('Submitting form data:', data);
        setIsSubmitting(true);
        try {
            // Pass tenantSlug found in URL to the API. 
            // If undefined, API will handle (fallback or error).
            const id = await apiService.createNotification({ ...data, tenantSlug });
            setCreatedId(id);
            setShowSuccessModal(true);
        } catch (error: any) {
            const errorMsg = error.response?.data?.details || error.response?.data?.error || 'Erro ao enviar notificação. Verifique sua conexão ou tente novamente.';
            alert(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadError) {
        return (
            <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-[#003366] mb-2">{loadError === 'Link inválido' ? 'Link inválido' : 'Erro de Conexão'}</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        {loadError === 'Link inválido'
                            ? 'Este link não está associado a nenhum hospital. Use o link específico da sua instituição:'
                            : `Ocorreu um problema ao carregar os dados: ${loadError}`}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <p className="text-xs text-blue-500 mb-1 font-medium uppercase tracking-wide">Formato correto</p>
                        <code className="text-sm font-bold text-blue-800">
                            sentinelaai.com.br/n/<span className="text-blue-500">seu-hospital</span>
                        </code>
                    </div>
                    <p className="text-xs text-gray-400">
                        Se você é gestor, <a href="/login" className="text-[#003366] font-bold underline">faça login aqui</a>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left Sidebar: Educational */}
            <aside className="w-full lg:w-1/4 space-y-4 animate-fade-in-left">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border-l-4 border-[#003366]">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-[#003366] mb-4 pb-2 border-b border-[#0ea5e9]">
                        <Brain className="w-5 h-5" />
                        Saúde Mental
                    </h2>

                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm hover:translate-x-1 transition-transform duration-300">
                            <h3 className="font-bold text-[#003366] text-sm mb-1">Comportamentais</h3>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Heteroagressão</li>
                                <li>• Autoagressão</li>
                                <li>• Tentativa de suicídio</li>
                            </ul>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm hover:translate-x-1 transition-transform duration-300">
                            <h3 className="font-bold text-[#003366] text-sm mb-1">Segurança</h3>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Evasão de Paciente</li>
                                <li>• Contrabando de itens</li>
                                <li>• Quedas</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Form */}
            <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
                <div className="bg-[#003366] text-white p-6 text-center">
                    <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Activity className="w-6 h-6 text-[#0ea5e9]" />
                        SENTINELA AI
                    </h1>
                    {hospitalName && (
                        <p className="text-[#0ea5e9] font-semibold text-base mt-1">{hospitalName}</p>
                    )}
                    <p className="text-blue-100 text-sm mt-1">Plataforma de Notificação de Eventos e Não Conformidades</p>
                </div>

                {/* Type Selection Buttons */}
                <div className="flex border-b border-gray-100">
                    <button
                        type="button"
                        onClick={() => {
                            console.log('Selected Evento Adverso');
                            setSelectedType('EVENTO ADVERSO');
                        }}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${selectedType === 'EVENTO ADVERSO'
                            ? 'bg-white text-[#003366] border-b-2 border-[#003366]'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                    >
                        Evento Adverso
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            console.log('Selected Não Conformidade');
                            setSelectedType('NÃO CONFORMIDADE');
                        }}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${selectedType === 'NÃO CONFORMIDADE'
                            ? 'bg-white text-[#003366] border-b-2 border-[#003366]'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                    >
                        Não Conformidade
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                    {/* Patient Info - Only for Adverse Events */}
                    {selectedType === 'EVENTO ADVERSO' && (
                        <div className="space-y-4 animate-fade-in-up">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Identificação do Paciente</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="group relative">
                                    <label className="block text-xs font-bold text-[#003366] mb-1 uppercase">Nome do Paciente *</label>
                                    <input
                                        {...register("paciente", { required: "Nome do paciente é obrigatório" })}
                                        className={`w-full p-3 border rounded-lg outline-none transition-all ${errors.paciente ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#003366]'}`}
                                        placeholder="Nome completo"
                                    />
                                    {errors.paciente && <span className="text-xs text-red-500 mt-1 block">{errors.paciente.message}</span>}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none text-center">
                                        Use o nome completo sem abreviações.
                                    </div>
                                </div>

                                <div className="group relative">
                                    <label className="block text-xs font-bold text-[#003366] mb-1 uppercase">Nome da Mãe</label>
                                    <input
                                        {...register("nome_mae")}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#003366] focus:ring-1 focus:ring-[#003366] outline-none transition-all"
                                        placeholder="Nome da mãe"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#003366] mb-1 uppercase">Nascimento</label>
                                    <input type="date" {...register("nascimento")} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#003366]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#003366] mb-1 uppercase">Sexo</label>
                                    <select {...register("sexo")} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#003366]">
                                        <option value="">Selecione</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Feminino</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-[#003366] mb-1 uppercase">Data Internação</label>
                                    <input type="date" {...register("data_internacao")} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#003366]" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Event Info */}
                    <div className="space-y-4 pt-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Dados do Evento</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#003366] mb-1 uppercase">Data do Evento *</label>
                                <input type="date" {...register("data_evento", { required: "Data do evento é obrigatória" })} className={`w-full p-3 border rounded-lg outline-none ${errors.data_evento ? 'border-red-500' : 'border-gray-200 focus:border-[#003366]'}`} />
                                {errors.data_evento && <span className="text-xs text-red-500 mt-1 block">{errors.data_evento.message}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#003366] mb-1 uppercase">Período</label>
                                <select {...register("periodo")} className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#003366]">
                                    <option value="">Selecione</option>
                                    <option value="Manhã">Manhã</option>
                                    <option value="Tarde">Tarde</option>
                                    <option value="Noite">Noite</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#003366] mb-1 uppercase">Setor do Evento *</label>
                                <select
                                    {...register("setor", { required: "Setor do evento é obrigatório" })}
                                    className={`w-full p-3 border rounded-lg outline-none bg-white ${errors.setor ? 'border-red-500' : 'border-gray-200 focus:border-[#003366]'}`}
                                >
                                    <option value="">Selecione...</option>
                                    {sectors.map(sector => (
                                        <option key={sector.id} value={sector.name}>{sector.name}</option>
                                    ))}
                                </select>
                                {errors.setor && <span className="text-xs text-red-500 mt-1 block">{errors.setor.message}</span>}
                            </div>
                        </div>

                        <div className="group relative">
                            <label className="block text-xs font-bold text-[#003366] mb-1 uppercase">Descrição Detalhada *</label>
                            <textarea
                                {...register("descricao", { required: "Descrição é obrigatória" })}
                                rows={5}
                                className={`w-full p-3 border rounded-lg outline-none resize-none ${errors.descricao ? 'border-red-500' : 'border-gray-200 focus:border-[#003366]'}`}
                                placeholder="Descreva O QUE, COMO e ONDE aconteceu..."
                            ></textarea>

                            <button
                                type="button"
                                onClick={handleToggleListening}
                                className={`absolute top-2 right-2 p-2 rounded-full transition-all ${isListening
                                    ? 'bg-red-100 text-red-600 animate-pulse'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                title={isListening ? "Parar transcrição" : "Transcrever fala"}
                            >
                                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </button>

                            {warning && (
                                <div className="absolute top-12 right-0 z-10 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 shadow-sm animate-fade-in max-w-xs">
                                    {warning.message}
                                </div>
                            )}


                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none text-center">
                                Seja objetivo. Relate fatos, não opiniões.
                            </div>
                            {errors.descricao && <span className="text-xs text-red-500 mt-1 block">{errors.descricao.message}</span>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-lg shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span>Enviando...</span>
                        ) : (
                            <>
                                <ShieldCheck className="w-5 h-5" />
                                ENVIAR NOTIFICAÇÃO
                            </>
                        )}
                    </button>

                </form>
            </div>

            {/* Right Sidebar: Culture */}
            <aside className="w-full lg:w-1/4 space-y-4 animate-fade-in-right">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border-l-4 border-[#003366]">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-[#003366] mb-4 pb-2 border-b border-[#0ea5e9]">
                        <Scale className="w-5 h-5" />
                        Cultura Justa
                    </h2>

                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="font-bold text-[#003366] text-sm mb-1">O que é?</h3>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Ambiente seguro para relatar erros. O foco não é punir, mas corrigir falhas do sistema.
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="font-bold text-[#003366] text-sm mb-1">Não Conformidades</h3>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Falhas nos processos definidos. Ex: Falta de checagem, não preenchimento de documentos.
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
            {/* Success Modal rendered via Portal to avoid removeChild DOM conflicts */}
            {showSuccessModal && ReactDOM.createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center transform transition-all animate-in zoom-in-95 duration-300">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                            <CheckCircle className="h-12 w-12 text-green-600 animate-in zoom-in spin-in-180 duration-500 delay-150" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#003366] mb-2">
                            NOTIFICAÇÃO ENVIADA!
                        </h3>
                        <p className="text-gray-600 mb-2">
                            Sua notificação foi registrada com sucesso.
                        </p>
                        <p className="text-sm text-gray-500 mb-8">
                            A equipe de gestão de risco foi alertada e tomará as providências necessárias.
                            Obrigado por contribuir com a segurança do paciente. 🛡️
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    window.location.reload();
                                }}
                                className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 bg-[#003366] text-base font-bold text-white hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366] transition-colors"
                            >
                                Fazer Nova Notificação
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

