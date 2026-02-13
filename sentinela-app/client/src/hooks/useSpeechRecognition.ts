import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechRecognitionWarning {
    type: 'no-speech' | 'network' | 'not-allowed' | 'browser-unsupported' | 'unknown';
    message: string;
}

interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

export function useSpeechRecognition() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [warning, setWarning] = useState<UseSpeechRecognitionWarning | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startListening = useCallback((onResultCallback?: (text: string) => void) => {
        const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
        const SpeechRecognitionClass = SpeechRecognition || webkitSpeechRecognition;

        if (!SpeechRecognitionClass) {
            setWarning({
                type: 'browser-unsupported',
                message: 'Seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome.'
            });
            return;
        }

        try {
            const recognition = new SpeechRecognitionClass();
            recognitionRef.current = recognition;

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'pt-BR';

            recognition.onstart = () => {
                setIsListening(true);
                setWarning(null);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onresult = (event: any) => {
                let sessionTranscript = '';
                for (let i = 0; i < event.results.length; ++i) {
                    sessionTranscript += event.results[i][0].transcript;
                }

                setTranscript(sessionTranscript);
                if (onResultCallback) {
                    onResultCallback(sessionTranscript);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);

                switch (event.error) {
                    case 'not-allowed':
                        setWarning({
                            type: 'not-allowed',
                            message: 'Acesso ao microfone negado. Verifique as permissões do navegador.'
                        });
                        break;
                    case 'no-speech':
                        setWarning({
                            type: 'no-speech',
                            message: 'Nenhuma fala detectada. Tente falar mais perto do microfone.'
                        });
                        break;
                    case 'network':
                        setWarning({
                            type: 'network',
                            message: 'Erro de rede. Verifique sua conexão.'
                        });
                        break;
                    case 'audio-capture':
                        setWarning({
                            type: 'no-speech', // recycling type or adding new one isn't critical, message is key
                            message: 'Nenhum microfone encontrado ou erro na captura. Verifique se o microfone está conectado e funcionando.'
                        });
                        break;
                    case 'aborted':
                        // Ignorar aborts intencionais
                        break;
                    default:
                        setWarning({
                            type: 'unknown',
                            message: `Erro no reconhecimento de voz: ${event.error}`
                        });
                }
            };

            recognition.start();
        } catch (err) {
            console.error('Failed to start recognition:', err);
            setWarning({
                type: 'unknown',
                message: 'Falha ao iniciar o reconhecimento de voz.'
            });
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setWarning(null);
    }, []);

    return {
        isListening,
        transcript,
        warning,
        startListening,
        stopListening,
        resetTranscript
    };
}
