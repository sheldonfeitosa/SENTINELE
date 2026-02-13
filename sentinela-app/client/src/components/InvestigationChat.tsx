import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';
import { apiService } from '../services/ApiService';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface InvestigationChatProps {
    notificationId: number;
    context?: {
        description: string;
        rootCause?: string;
    };
}

export function InvestigationChat({ notificationId, context }: InvestigationChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Olá! Sou seu assistente de investigação. Posso ajudar a analisar este evento, sugerir causas raízes ou refinar o plano de ação. Como posso ajudar?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await apiService.chatWithAI(notificationId, input, context);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.message,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-[#003366] text-white p-4 rounded-full shadow-lg hover:bg-[#002244] transition-all hover:scale-110 z-50 flex items-center gap-2"
            >
                <Bot className="w-6 h-6" />
                <span className="font-bold pr-2 hidden md:inline">Assistente IA</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-xl border border-gray-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="p-4 border-b border-gray-200 bg-[#003366] text-white rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    <h3 className="font-bold">Assistente de Investigação</h3>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-blue-100'
                            }`}>
                            {msg.role === 'user' ? (
                                <User className="w-5 h-5 text-gray-600" />
                            ) : (
                                <Bot className="w-5 h-5 text-blue-600" />
                            )}
                        </div>
                        <div className={`max-w-[80%] p-3 rounded-lg text-sm shadow-sm ${msg.role === 'user'
                            ? 'bg-[#003366] text-white rounded-tr-none'
                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="bg-white p-3 rounded-lg rounded-tl-none border border-gray-200 flex items-center shadow-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="p-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
