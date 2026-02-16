import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../services/ApiService';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isValidating, setIsValidating] = useState(true);
    const [isValidToken, setIsValidToken] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsValidating(false);
                setIsValidToken(false);
                return;
            }
            try {
                const response = await axios.get(`${API_BASE}/auth/validate-token?token=${token}`);
                setIsValidToken(response.data.valid);
            } catch (err) {
                setIsValidToken(false);
            } finally {
                setIsValidating(false);
            }
        };
        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await axios.post(`${API_BASE}/auth/reset-password`, {
                token,
                newPassword: password
            });
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao redefinir senha. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isValidating) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!isValidToken && !isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Link Inválido</h2>
                    <p className="text-slate-600 mb-8">Este link de recuperação expirou ou é inválido. Por favor, solicite um novo link.</p>
                    <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:underline">
                        <ArrowLeft className="w-4 h-4" /> Voltar para o Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <div className="flex items-center gap-2 mb-8 justify-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-slate-900">Sentinela AI</span>
                </div>

                {isSuccess ? (
                    <div className="text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Senha Alterada!</h2>
                        <p className="text-slate-600">Sua senha foi redefinida com sucesso. Você será redirecionado para o login em instantes.</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Nova Senha</h2>
                            <p className="text-slate-500 mt-2">Escolha uma senha segura para sua conta.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
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
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Alterando...' : 'Redefinir Senha'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
