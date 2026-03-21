import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { apiService } from '../services/ApiService';

export function MagicLoginPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const publicToken = searchParams.get('public_token');
        const redirect = searchParams.get('redirect') || '/dashboard';

        if (!token && !publicToken) {
            setErrorMsg('Link inválido. Nenhum token encontrado.');
            setStatus('error');
            return;
        }

        (async () => {
            try {
                let result;
                if (token) {
                    // Gestor COM conta no sistema: usa magic login normal
                    result = await apiService.magicLogin(token);
                } else {
                    // Gestor SEM conta no sistema: usa token público de notificação
                    result = await apiService.publicTokenLogin(publicToken!);
                }
                // Salva sessão igual ao login normal
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                // Redireciona para a tratativa
                navigate(redirect, { replace: true });
            } catch (err: any) {
                const msg = err?.response?.data?.error || 'Link expirado ou inválido. Faça login normalmente.';
                setErrorMsg(msg);
                setStatus('error');
            }
        })();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-[#003366]" />
                    </div>
                </div>

                <h1 className="text-xl font-bold text-[#003366] mb-2">Sentinela AI</h1>

                {status === 'loading' ? (
                    <>
                        <p className="text-gray-500 text-sm mb-6">Autenticando acesso seguro...</p>
                        <div className="flex justify-center">
                            <Loader2 className="w-8 h-8 text-[#003366] animate-spin" />
                        </div>
                        <p className="text-xs text-gray-400 mt-4">Você será redirecionado automaticamente.</p>
                    </>
                ) : (
                    <>
                        <div className="flex justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-sm text-red-600 font-medium mb-2">{errorMsg}</p>
                        <p className="text-xs text-gray-400 mb-6">
                            O link pode ter expirado ou já foi utilizado. Links de acesso são válidos por 7 dias.
                        </p>
                        <button
                            onClick={() => navigate('/login', { replace: true })}
                            className="w-full bg-[#003366] text-white py-3 rounded-xl font-medium hover:bg-[#004080] transition-colors"
                        >
                            Ir para o Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
