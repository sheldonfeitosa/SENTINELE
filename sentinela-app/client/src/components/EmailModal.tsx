import { X, Send, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (email: string) => void;
    isLoading: boolean;
    defaultEmail?: string;
    sectorName?: string;
}

export function EmailModal({ isOpen, onClose, onSend, isLoading, defaultEmail = '', sectorName }: EmailModalProps) {
    const [email, setEmail] = useState(defaultEmail);

    useEffect(() => {
        setEmail(defaultEmail);
    }, [defaultEmail]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#003366]">Notificar Gestor</h2>
                            {sectorName && <p className="text-xs text-gray-500">Setor: {sectorName}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email do Gestor</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="gestor@hospital.com"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Um email será enviado solicitando a elaboração do plano de ação.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => onSend(email)}
                            disabled={isLoading || !email}
                            className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Enviando...' : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Enviar Notificação
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
