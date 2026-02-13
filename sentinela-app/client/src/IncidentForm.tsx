import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Bell, Send, X, Mic, StopCircle, Upload, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { apiService, API_BASE } from './services/ApiService';
import axios from 'axios';

type FormData = {
    patientName: string;
    motherName: string;
    birthDate: string;
    sex: string;
    admissionDate: string;
    eventDate: string;
    period: string;
    sector: string;
    sectorOther?: string;
    notifySector: string;
    notifySectorOther?: string;
    description: string;
};

const IncidentForm = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
    const { register, handleSubmit: rhfHandleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>();
    const sector = watch('sector');
    const notifySector = watch('notifySector');

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // ... (rest of state)

    const onSubmit = async (data: FormData) => {
        setLoading(true); // Set loading state when submission starts
        try {
            // Handle "Outros" logic
            const finalData = {
                ...data,
                sector: data.sector === 'Outros' ? data.sectorOther : data.sector,
                notifySector: data.notifySector === 'Outros' ? data.notifySectorOther : data.notifySector,
            };

            await axios.post(`${API_BASE}/notifications`, finalData);
            alert('Notificação enviada com sucesso!');
            onSuccess(); // Call onSuccess if provided
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar notificação.');
        } finally {
            setLoading(false); // Reset loading state after submission (success or failure)
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans">
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#003366] text-white p-6 text-center">
                    <div className="flex justify-center mb-2">
                        <Bell className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h1 className="text-2xl font-bold">SENTINELA AI</h1>
                    <p className="text-sm opacity-90">Sistema de Notificação de Eventos</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* Patient Name */}
                        <div>
                            <label className="block text-xs font-bold text-[#003366] uppercase mb-1">Nome do Paciente *</label>
                            <input
                                {...register('patientName', { required: true })}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] outline-none"
                                placeholder="Nome completo do paciente"
                            />
                            {errors.patientName && <span className="text-red-500 text-xs">Campo obrigatório</span>}
                        </div>

                        {/* Mother Name */}
                        <div>
                            <label className="block text-xs font-bold text-[#003366] uppercase mb-1">Nome da Mãe</label>
                            <input
                                {...register('motherName')}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] outline-none"
                                placeholder="Nome completo da mãe"
                            />
                        </div>

                        {/* Row 1 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#003366] uppercase mb-1">Data de Nascimento</label>
                                <input
                                    type="date"
                                    {...register('birthDate')}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#003366] uppercase mb-1">Sexo</label>
                                <select {...register('sex')} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] outline-none bg-white">
                                    <option value="">Selecione</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                </select>
                            </div>
                        </div>

                        {/* Admission Date */}
                        <div>
                            <label className="block text-xs font-bold text-[#003366] uppercase mb-1">Data de Internação</label>
                            <input
                                type="date"
                                {...register('admissionDate')}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] outline-none"
                            />
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#003366] uppercase mb-1">Data do Evento *</label>
                                <input
                                    type="date"
                                    {...register('eventDate', { required: true })}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#003366] uppercase mb-1">Período</label>
                                <select {...register('period')} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] outline-none bg-white">
                                    <option value="">Selecione</option>
                                    <option value="Manhã">Manhã</option>
                                    <option value="Tarde">Tarde</option>
                                    <option value="Noite">Noite</option>
                                    <option value="Madrugada">Madrugada</option>
                                </select>
                            </div>
                        </div>

                        {/* Sector */}
                        <div>
                            <label className="block text-xs font-bold text-[#003366] uppercase mb-1">Setor do Evento *</label>
                            <select {...register('sector', { required: true })} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] outline-none bg-white">
                                <option value="">Selecione</option>
                                <option value="UTI">UTI</option>
                                <option value="Emergência">Emergência</option>
                                <option value="Enfermaria">Enfermaria</option>
                                <option value="Outros">Outros</option>
                            </select>
                            {sector === 'Outros' && (
                                <input
                                    {...register('sectorOther', { required: true })}
                                    className="mt-2 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] outline-none"
                                    placeholder="Especifique o setor"
                                />
                            )}
                        </div>

                        {/* Notify Sector */}
                        <div>
                            <label className="block text-xs font-bold text-red-700 uppercase mb-1">Setor a Notificar *</label>
                            <select {...register('notifySector', { required: true })} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] outline-none bg-white">
                                <option value="">Selecione</option>
                                <option value="Qualidade">Qualidade</option>
                                <option value="Diretoria">Diretoria</option>
                                <option value="Farmácia">Farmácia</option>
                                <option value="Outros">Outros</option>
                            </select>
                            {notifySector === 'Outros' && (
                                <input
                                    {...register('notifySectorOther', { required: true })}
                                    className="mt-2 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] outline-none"
                                    placeholder="Especifique o setor a notificar"
                                />
                            )}
                            <p className="text-xs text-gray-500 mt-1">Este setor receberá a notificação</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold text-[#003366] uppercase mb-1">Descrição Detalhada do Evento *</label>
                            <textarea
                                {...register('description', { required: true })}
                                rows={5}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003366] outline-none resize-none"
                                placeholder="Descreva com detalhes o que aconteceu..."
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#003366] text-white p-4 rounded-md font-bold text-lg hover:bg-[#002244] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Send size={20} />
                            {isSubmitting ? 'ENVIANDO...' : 'ENVIAR NOTIFICAÇÃO'}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}
