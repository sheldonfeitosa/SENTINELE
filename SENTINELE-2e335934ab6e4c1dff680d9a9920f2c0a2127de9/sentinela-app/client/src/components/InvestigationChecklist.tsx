import { useState, useEffect } from 'react';
import { Search, Save, CheckCircle2 } from 'lucide-react';

interface InvestigationChecklistProps {
    initialData?: string | null;
    onSave: (data: string) => void;
    isLocked?: boolean;
}

export function InvestigationChecklist({ initialData, onSave, isLocked = false }: InvestigationChecklistProps) {
    const questions = [
        "O protocolo institucional foi seguido corretamente?",
        "Havia barreiras de segurança implementadas (físicas ou processos)?",
        "O ambiente contribuiu para o evento (iluminação, ruído, layout)?",
        "A equipe estava adequadamente treinada?", // Updated from "dimensionada" as per request
        "Houve falha de comunicação entre a equipe?",
        "Os equipamentos necessários estavam disponíveis e funcionais?",
        "O paciente apresentava fatores de risco prévios identificados?",
        "Houve supervisão adequada no momento do evento?"
    ];

    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [comments, setComments] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (initialData) {
            try {
                const parsed = JSON.parse(initialData);
                setAnswers(parsed.answers || {});
                setComments(parsed.comments || {});
                setIsSaved(true);
            } catch (e) {
                console.error("Failed to parse investigation data", e);
            }
        }
    }, [initialData]);

    const handleAnswerChange = (questionIndex: number, value: string) => {
        if (isSaved && !isLocked) setIsSaved(false);
        setAnswers(prev => ({ ...prev, [questionIndex]: value }));
    };

    const handleCommentChange = (questionIndex: number, value: string) => {
        if (isSaved && !isLocked) setIsSaved(false);
        setComments(prev => ({ ...prev, [questionIndex]: value }));
    };

    const handleSave = () => {
        setSaving(true);
        const data = JSON.stringify({ answers, comments, completed: allAnswered });

        // Format for AI consumption (readable string)
        // Format for AI consumption (readable string) - logic preserved but unused variable removed to fix build
        // const readableData = questions.map((q, idx) => {
        //     const ans = answers[idx] || "Não respondido";
        //     const comm = comments[idx] ? ` (Obs: ${comments[idx]})` : "";
        //     return `- ${q}: ${ans}${comm}`;
        // }).join('\n');

        // We save the raw JSON to the DB properly, but we might pass the readable string up if desired.
        // For simpler implementation, let's pass the JSON string to parent, parent sends to API.
        // Wait, the API stores a string. The AI needs a string. 
        // Let's store the READABLE format in the DB for simplicity with the AI logic and PDF?
        // OR store JSON and format it on the backend?
        // The plan said "JSON string of checklist data".
        // Let's stick to JSON for the field `investigationList`.
        // BUT the backend `generateRCA` takes `investigationData` which is passed to AI prompt.
        // If I pass JSON to AI, it might be messy.
        // Let's format it in the backend? NO, I edited `notification.service` to just pass `notification.investigationList` to AI.
        // So `notification.investigationList` SHOULD be readable text OR the backend needs to parse it.
        // Checking `notification.service.ts`: `const investigationData = notification.investigationList;` -> `generateRootCauseAnalysis(..., investigationData)`.
        // So if I save JSON, the AI gets JSON. That's actually fine, Gemini handles JSON well.
        // Let's stick to saving the JSON string.

        onSave(data);
        setTimeout(() => {
            setSaving(false);
            setIsSaved(true);
        }, 1000);
    };

    const allAnswered = questions.every((_, idx) => answers[idx]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-orange-50 p-4 border-b border-orange-100 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Investigação do Evento
                    </h3>
                    <p className="text-orange-700 text-sm">
                        Esta etapa é obrigatória para liberar a Análise de Causa Raiz.
                    </p>
                </div>
                {isSaved && (
                    <span className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        Investigação Concluída
                    </span>
                )}
            </div>

            <div className="p-6 space-y-6">
                {questions.map((q, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="font-semibold text-gray-800 mb-3">{idx + 1}. {q}</p>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`q-${idx}`}
                                        value="Sim"
                                        checked={answers[idx] === 'Sim'}
                                        onChange={() => handleAnswerChange(idx, 'Sim')}
                                        disabled={isLocked}
                                        className="w-4 h-4 text-[#003366] accent-[#003366]"
                                    />
                                    <span className="text-sm">Sim</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`q-${idx}`}
                                        value="Não"
                                        checked={answers[idx] === 'Não'}
                                        onChange={() => handleAnswerChange(idx, 'Não')}
                                        disabled={isLocked}
                                        className="w-4 h-4 text-[#003366] accent-[#003366]"
                                    />
                                    <span className="text-sm">Não</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`q-${idx}`}
                                        value="Parcialmente"
                                        checked={answers[idx] === 'Parcialmente'}
                                        onChange={() => handleAnswerChange(idx, 'Parcialmente')}
                                        disabled={isLocked}
                                        className="w-4 h-4 text-[#003366] accent-[#003366]"
                                    />
                                    <span className="text-sm">Parcialmente</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`q-${idx}`}
                                        value="Não se aplica"
                                        checked={answers[idx] === 'Não se aplica'}
                                        onChange={() => handleAnswerChange(idx, 'Não se aplica')}
                                        disabled={isLocked}
                                        className="w-4 h-4 text-[#003366] accent-[#003366]"
                                    />
                                    <span className="text-sm">Não se aplica</span>
                                </label>
                            </div>
                            <input
                                type="text"
                                placeholder="Detalhes ou observações (opcional)..."
                                value={comments[idx] || ''}
                                onChange={(e) => handleCommentChange(idx, e.target.value)}
                                disabled={isLocked}
                                className="w-full text-sm p-2 border border-gray-200 rounded md:w-2/3"
                            />
                        </div>
                    </div>
                ))}

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-3 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                SALVAR INVESTIGAÇÃO
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
