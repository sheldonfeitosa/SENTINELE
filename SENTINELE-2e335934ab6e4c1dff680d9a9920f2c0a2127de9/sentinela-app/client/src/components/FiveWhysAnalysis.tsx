import { useState } from 'react';
import { Brain, RefreshCw } from 'lucide-react';
import { apiService } from '../services/ApiService';

interface FiveWhysProps {
    notificationId: number;
    initialData?: any;
    onSave: (data: any) => void;
}

export function FiveWhysAnalysis({ notificationId, initialData, onSave }: FiveWhysProps) {
    const [whys, setWhys] = useState({
        why1: initialData?.why1 || '',
        why2: initialData?.why2 || '',
        why3: initialData?.why3 || '',
        why4: initialData?.why4 || '',
        why5: initialData?.why5 || '',
        rootCause: initialData?.rootCause || ''
    });
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await apiService.generateFiveWhys(notificationId);
            setWhys(result);
            onSave(result);
        } catch (error) {
            console.error('Failed to generate 5 Whys:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        const newData = { ...whys, [field]: value };
        setWhys(newData);
        onSave(newData);
    };

    return (
        <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-[#003366] flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Análise dos 5 Porquês
                </h3>
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    Gerar com IA
                </button>
            </div>

            <div className="space-y-3 relative">
                {/* Connecting Line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200 -z-10"></div>

                {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                            {num}
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                {num}º Porquê
                            </label>
                            <input
                                type="text"
                                value={whys[`why${num}` as keyof typeof whys]}
                                onChange={(e) => handleChange(`why${num}`, e.target.value)}
                                placeholder={`Por que isso aconteceu?`}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#003366] outline-none transition-all"
                            />
                        </div>
                    </div>
                ))}

                <div className="mt-6 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-[#003366] mb-2">
                        Conclusão da Causa Raiz
                    </label>
                    <textarea
                        value={whys.rootCause}
                        onChange={(e) => handleChange('rootCause', e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#003366] outline-none min-h-[80px]"
                        placeholder="Conclusão baseada na análise dos 5 porquês..."
                    />
                </div>
            </div>
        </div>
    );
}
