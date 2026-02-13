import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';
import { API_BASE } from '../services/ApiService'; // Import API_BASE

export const LinkedinCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            console.error('LinkedIn Auth Error:', error);
            setStatus('error');
            return;
        }

        if (code) {
            // Exchange code for token
            axios.post('http://localhost:3001/api/linkedin/callback', { code })
                .then(() => {
                    setStatus('success');
                    // Close popup if opened as popup, or redirect back
                    setTimeout(() => {
                        // If opened in a popup (best practice for OAuth), close it
                        if (window.opener) {
                            window.opener.postMessage({ type: 'LINKEDIN_CONNECTED' }, '*');
                            window.close();
                        } else {
                            navigate('/insights/novo');
                        }
                    }, 2000);
                })
                .catch((err) => {
                    console.error('Backend Exchange Error:', err);
                    setStatus('error');
                });
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="animate-pulse">
                        <div className="h-12 w-12 bg-blue-100 rounded-full mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-900">Conectando ao LinkedIn...</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div>
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conectado!</h2>
                        <p className="text-gray-600">Sua conta do LinkedIn foi vinculada com sucesso.</p>
                        <p className="text-xs text-gray-400 mt-4">Redirecionando...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div>
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro na Conexão</h2>
                        <p className="text-gray-600">Não foi possível conectar ao LinkedIn. Tente novamente.</p>
                        <button onClick={() => navigate('/insights/novo')} className="mt-6 text-blue-600 hover:text-blue-800 font-medium">
                            Voltar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
