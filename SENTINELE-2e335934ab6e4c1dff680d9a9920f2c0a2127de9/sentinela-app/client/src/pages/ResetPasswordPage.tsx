import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../services/ApiService';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<string>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStatus('invalid');
                return;
            }
            try {
                await axios.get(`${API_BASE}/auth/verify-reset-token?token=${token}`);
                setStatus('valid');
            } catch (err: any) {
                setStatus('invalid');
            }
        };
        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setErrorMessage('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setStatus('loading');
        try {
            await axios.post(`${API_BASE}/auth/update-password-with-token`, {
                token,
                newPassword: password
            });
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.response?.data?.error || 'Erro ao atualizar senha.');
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="mt-4 text-slate-600 font-medium">Verificando link...</p>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Link Inválido</h2>
                    <p className="text-slate-600 mb-8">Este link de recuperação expirou ou é inválido. Por favor, solicite uma nova recuperação de senha.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all"
                    >
                        Voltar para o Login
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Senha Atualizada!</h2>
                    <p className="text-slate-600 mb-4">Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <div className="flex items-center gap-2 mb-8 justify-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-slate-900">Sentinela AI</span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Definir Nova Senha</h2>
                <p className="text-slate-500 mb-8 text-center">Escolha uma senha forte e segura para sua conta.</p>

                {errorMessage && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{errorMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                                required
                            />
                            <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                                required
                            />
                            <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        {status === 'loading' ? 'Processando...' : 'Atualizar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
}
