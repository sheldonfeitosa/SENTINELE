import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiService, API_BASE } from '../services/ApiService'; // Import API_BASE
import axios from 'axios';
import {
    LayoutDashboard, AlertCircle, CheckCircle2, ArrowRight, Star, ShieldCheck, Zap, Mail, Lock
} from 'lucide-react';

const LoginPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'login' | 'prospect'>('login');
    const [email, setEmail] = useState('sheldonfeitosa@gmail.com');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');

    // Prospect Form State
    const [prospectName, setProspectName] = useState('');
    const [prospectPhone, setProspectPhone] = useState('');
    const [prospectHospital, setProspectHospital] = useState('');
    // const [prospectEmail, setProspectEmail] = useState('sheldonfeitosa@gmail.com'); // Removed unused state
    const [ctaSent, setCtaSent] = useState(false);


    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_BASE}/auth/login`, {
                email,
                password
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Login failed', err);
            setError(err.response?.data?.error || 'Falha no login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    const handleProspectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Use local/prod URL dynamically ideally, but keeping it simple for now or use relative path if proxied
            // But since Vercel has separate domains, better use the relative path '/api/...' if proxy is set up, 
            // OR use the full URL. Let's use the full production URL if on prod, or localhost.
            // For now, let's just use the relative path which Vercel rewrites handle.
            // But wait, axios needs full URL usually unless base URL set.
            // The previous code had http://localhost:3001. I should probably use a relative path '/api/auth/trial-request' 
            // verifying vite proxy or vercel rewrites. 
            // Vercel rewrites /api/(.*) to server/src/server.ts. 
            // So '/api/auth/trial-request' should work ON PRODUCTION.
            // LOCALHOST might need the full URL if not proxied. 
            // Let's stick to what was working for the other calls or try relative.
            // The other call `handleLogin` uses `http://localhost:3001/api/auth/login`. 
            // I should change BOTH to be dynamic or relative.

            const apiUrl = import.meta.env.PROD
                ? `${API_BASE}/auth/trial-request`
                : `${API_BASE}/auth/trial-request`;

            const response = await axios.post(apiUrl, {
                name: prospectName,
                hospital: prospectHospital,
                email: email,
                phone: prospectPhone
            });

            if (response.data.tempPassword) {
                setGeneratedPassword(response.data.tempPassword);
            }
            setCtaSent(true);
        } catch (error: any) {
            console.error('Failed to submit trial request', error);
            setError(error.response?.data?.error || 'Falha ao criar ambiente. Tente novamente.');
            // Better UI handling would be nice, but reusing error state for simplicity
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans relative">
            <div className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold z-50 shadow-lg animate-pulse">
                v2.0 CHECK
            </div>
            {/* Left Side - Marketing (Persuasive) */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-center p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px] -top-20 -left-20"></div>
                    <div className="absolute w-[400px] h-[400px] bg-indigo-500 rounded-full blur-[100px] bottom-0 right-0"></div>
                </div>

                <div className="relative z-10 max-w-lg mx-auto">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Sentinela AI</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                        Inteligência que cuida de quem cuida.
                    </h1>

                    <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                        Transforme a gestão de riscos do seu hospital. Deixe a burocracia para trás e use a IA para prever e prevenir eventos adversos antes que aconteçam.
                    </p>

                    <div className="space-y-4 mb-12">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-green-500/20 p-1 rounded-full">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Zero Burocracia</h3>
                                <p className="text-sm text-slate-400">Relate incidentes por voz ou texto livre. Nossa IA estrutura tudo.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-green-500/20 p-1 rounded-full">
                                <Zap className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Análise em Tempo Real</h3>
                                <p className="text-sm text-slate-400">Identificação imediata de severidade e sugestão de planos de ação.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-green-500/20 p-1 rounded-full">
                                <Star className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Cultura Justa</h3>
                                <p className="text-sm text-slate-400">Fomente a notificação sem punição, focando na melhoria contínua.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 backdrop-blur-sm">
                        <p className="italic text-slate-300 mb-4">"O Sentinela AI mudou nossa visão. Antes reagíamos a crises, hoje prevenimos riscos. A equipe de enfermagem adora a simplicidade."</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold">DR</div>
                            <div>
                                <p className="font-semibold text-white">Dra. Roberta Santos</p>
                                <p className="text-xs text-slate-400">Diretora Clínica - Santa Casa</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Forms */}
            <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-6 lg:p-12 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`flex - 1 py - 2.5 text - sm font - medium rounded - lg transition - all ${activeTab === 'login'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                } `}
                        >
                            Acesso Cliente
                        </button>
                        <button
                            onClick={() => setActiveTab('prospect')}
                            className={`flex - 1 py - 2.5 text - sm font - medium rounded - lg transition - all flex items - center justify - center gap - 2 ${activeTab === 'prospect'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-blue-600 hover:bg-blue-50'
                                } `}
                        >
                            Teste Grátis 30 Dias
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                        </button>
                    </div>

                    {activeTab === 'login' ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-left mb-8">
                                <h2 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h2>
                                <p className="text-slate-500 mt-2">Acesse seu painel de gestão de riscos.</p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>{typeof error === 'object' ? (error as any).message || JSON.stringify(error) : error}</p>
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Corporativo</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="nome@hospital.com"
                                            required
                                        />
                                        <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center text-slate-600">
                                        <input type="checkbox" className="mr-2 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                        Lembrar-me
                                    </label>
                                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Esqueceu a senha?</a>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {loading ? 'Entrando...' : 'Acessar Painel'}
                                    {!loading && <ArrowRight className="w-4 h-4" />}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            {!ctaSent ? (
                                <>
                                    <div className="text-left mb-6">
                                        <h2 className="text-2xl font-bold text-slate-900">Comece Gratuitamente</h2>
                                        <p className="text-slate-500 mt-2">Teste o poder da IA na sua gestão por 30 dias. Sem compromisso.</p>
                                    </div>

                                    <form onSubmit={handleProspectSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                                            <input
                                                type="text"
                                                value={prospectName}
                                                onChange={(e) => setProspectName(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Seu nome"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Hospital / Clínica</label>
                                            <input
                                                type="text"
                                                value={prospectHospital}
                                                onChange={(e) => setProspectHospital(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Nome da instituição"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Corporativo</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="nome@hospital.com"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                                            <input
                                                type="tel"
                                                value={prospectPhone}
                                                onChange={(e) => setProspectPhone(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="(XX) 9XXXX-XXXX"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-all transform hover:scale-[1.01] shadow-lg shadow-blue-200 mt-2"
                                        >
                                            Solicitar Acesso Grátis
                                        </button>
                                        <p className="text-xs text-center text-slate-400 mt-4">
                                            Ao clicar, você concorda em receber contato da nossa equipe de vendas. Seus dados estão seguros.
                                        </p>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center py-12 animate-in zoom-in duration-300">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Ambiente Criado!</h3>
                                    <p className="text-slate-600 mb-6">Seu acesso de teste foi liberado para <strong>{prospectName}</strong>.</p>

                                    {generatedPassword && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                            <p className="text-sm text-yellow-800 font-semibold mb-1">Sua Senha Provisória:</p>
                                            <code className="text-xl font-mono bg-white px-2 py-1 rounded border border-yellow-100 block w-fit mx-auto mt-2 select-all">
                                                {generatedPassword}
                                            </code>
                                            <p className="text-xs text-yellow-600 mt-2">Anote esta senha agora. Enviamos também por e-mail.</p>
                                        </div>
                                    )}

                                    {!generatedPassword && (
                                        <p className="text-slate-500 max-w-xs mx-auto">
                                            Enviamos um e-mail com seu login e senha provisória. Verifique sua caixa de entrada (e spam).
                                        </p>
                                    )}

                                    <button
                                        onClick={() => {
                                            setCtaSent(false);
                                            setActiveTab('login');
                                            setPassword(generatedPassword); // Pre-fill password for convenience
                                        }}
                                        className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800"
                                    >
                                        Fazer Login Agora
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
