
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { PlusCircle, Activity, Users, BarChart2, ClipboardList, CreditCard, LogOut, ShieldCheck } from 'lucide-react';

export function Layout() {
    const navigate = useNavigate();
    const location = useLocation();

    // If we are on the landing page, don't show the app layout/header
    if (location.pathname === '/') {
        return <Outlet />;
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    let user: any = {};
    try {
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined') {
            user = JSON.parse(userStr);
        }
    } catch (e) {
        user = {};
    }

    // Golden Rule: Always treat sheldonfeitosa@gmail.com as SUPER_ADMIN
    const rawUser = localStorage.getItem('user');
    if (user?.email?.toLowerCase() === 'sheldonfeitosa@gmail.com' || (rawUser && rawUser.includes('sheldonfeitosa@gmail.com'))) {
        user.role = 'SUPER_ADMIN';
        if (!user.email) user.email = 'sheldonfeitosa@gmail.com';
    }

    return (
        <div className="min-h-screen bg-[#F4F6F9] font-sans text-gray-800">
            <header className="bg-[#003366] text-white shadow-md">
                <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 text-[#0ea5e9] font-bold text-2xl">S</div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">SENTINELA AI</h1>
                                <p className="text-xs text-gray-300">
                                    {user.role === 'SUPER_ADMIN' ? 'Painel Administrativo SaaS' : 'Sistema de Gestão de Risco Hospitalar'}
                                </p>
                            </div>
                        </div>

                        {user.name && (
                            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-white/20">
                                <div className="text-left">
                                    <p className="text-sm font-bold leading-none">{user.name}</p>
                                    <p className="text-[10px] text-blue-300 uppercase tracking-wider">
                                        {user.role === 'SUPER_ADMIN' ? 'ADMINISTRAÇÃO' : (user.tenant?.name || 'Hospital')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <nav className="hidden md:flex gap-4 text-sm font-medium items-center">
                        {/* Protected Links */}
                        {localStorage.getItem('token') && (
                            <>
                                {location.pathname.startsWith('/admin') ? (
                                    <>
                                        <span className="flex items-center gap-2 text-orange-400 font-bold">
                                            <ShieldCheck className="w-4 h-4" />
                                            Painel Administrativo SaaS
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        {user.role !== 'SUPER_ADMIN' && (
                                            <>
                                                <Link to="/notificacao" className="flex items-center gap-2 hover:text-[#0ea5e9] transition-colors">
                                                    <PlusCircle className="w-4 h-4" />
                                                    Nova Notificação
                                                </Link>
                                                <Link to="/gestao-risco" className="flex items-center gap-2 hover:text-[#0ea5e9] transition-colors">
                                                    <Activity className="w-4 h-4" />
                                                    Gestão de Risco
                                                </Link>
                                                <Link to="/gestores" className="flex items-center gap-2 hover:text-[#0ea5e9] transition-colors">
                                                    <Users className="w-4 h-4" />
                                                    Painel dos Gestores
                                                </Link>
                                                <Link to="/estatisticas" className="flex items-center gap-2 hover:text-[#0ea5e9] transition-colors">
                                                    <BarChart2 className="w-4 h-4" />
                                                    Estatísticas
                                                </Link>
                                                <Link to="/tratativa" className="flex items-center gap-2 hover:text-[#0ea5e9] transition-colors">
                                                    <ClipboardList className="w-4 h-4" />
                                                    Tratativa
                                                </Link>
                                                <Link to="/planos" className="flex items-center gap-2 hover:text-[#0ea5e9] transition-colors">
                                                    <CreditCard className="w-4 h-4" />
                                                    Planos
                                                </Link>
                                            </>
                                        )}
                                        {user.role === 'SUPER_ADMIN' && (
                                            <Link to="/admin" className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-bold">
                                                <ShieldCheck className="w-4 h-4" />
                                                Painel SaaS
                                            </Link>
                                        )}
                                    </>
                                )}
                                <div className="h-6 w-px bg-white/20 mx-2"></div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 hover:text-red-400 transition-colors"
                                    title="Sair do sistema"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sair
                                </button>
                            </>
                        )}

                        {!localStorage.getItem('token') && (
                            <Link to="/login" className="flex items-center gap-2 hover:text-[#0ea5e9] transition-colors font-bold">
                                Entrar
                            </Link>
                        )}
                    </nav>
                </div>
            </header >

            <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div >
    );
}
