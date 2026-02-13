import React from 'react';
import { Link } from 'react-router-dom';
import {
    Shield,
    Activity,
    Lock,
    Zap,
    BarChart3,
    Users,
    CheckCircle,
    ArrowRight,
    Menu,
    X
} from 'lucide-react';

const HomePage = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flexjustify-between h-16 items-center">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-indigo-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">Sentinela AI</span>
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors">Recursos</a>
                            <a href="#solutions" className="text-gray-600 hover:text-indigo-600 transition-colors">Soluções</a>
                            <a href="#pricing" className="text-gray-600 hover:text-indigo-600 transition-colors">Preços</a>
                            <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">Login</Link>
                            <Link
                                to="/login" // Or signup if implemented
                                className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30"
                            >
                                Começar Agora
                            </Link>
                        </div>

                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600">
                                {isMenuOpen ? <X /> : <Menu />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 space-y-4">
                        <a href="#features" className="block text-gray-600 hover:text-indigo-600">Recursos</a>
                        <a href="#solutions" className="block text-gray-600 hover:text-indigo-600">Soluções</a>
                        <Link to="/login" className="block text-indigo-600 font-medium">Entrar</Link>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-8">
                        <Zap className="h-4 w-4 mr-2" />
                        Nova Geração de Gestão de Risco Hospitalar
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8">
                        Segurança do Paciente <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                            Impulsionada por IA
                        </span>
                    </h1>

                    <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                        O Sentinela AI transforma incidentes em insights acionáveis.
                        Identifique riscos, automatize análises e garanta compliance com a plataforma SaaS líder para hospitais modernos.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/login"
                            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-500/40 flex items-center justify-center"
                        >
                            Começar Teste Grátis <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                        <a
                            href="#demo"
                            className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center"
                        >
                            Ver Demonstração
                        </a>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-16 pt-8 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-6 uppercase tracking-wider">Confiado por instituições inovadoras</p>
                        <div className="flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Placeholders for logos */}
                            <div className="h-8 w-32 bg-gray-200 rounded"></div>
                            <div className="h-8 w-32 bg-gray-200 rounded"></div>
                            <div className="h-8 w-32 bg-gray-200 rounded"></div>
                            <div className="h-8 w-32 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div id="features" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Tudo que você precisa para Excelência em Saúde</h2>
                        <p className="mt-4 text-lg text-gray-600">Uma suíte completa de ferramentas para gestão de risco proativa.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Activity className="h-8 w-8 text-blue-500" />}
                            title="Análise em Tempo Real"
                            description="Nossa IA monitora e classifica incidentes instantaneamente, alertando sobre riscos críticos antes que escalem."
                        />
                        <FeatureCard
                            icon={<Lock className="h-8 w-8 text-indigo-500" />}
                            title="Segurança de Dados (LGPD/HIPAA)"
                            description="Arquitetura multi-tenant com isolamento total de dados. Seus registros estão seguros e criptografados."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="h-8 w-8 text-purple-500" />}
                            title="Dashboards Inteligentes"
                            description="Visualize tendências, mapas de calor e métricas de desempenho para tomar decisões baseadas em dados."
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8 text-green-500" />}
                            title="Gestão de Equipes"
                            description="Controle de acesso granular (RBAC) e fluxos de trabalho colaborativos para sua equipe de qualidade."
                        />
                        <FeatureCard
                            icon={<Shield className="h-8 w-8 text-orange-500" />}
                            title="Compliance Automatizado"
                            description="Gere relatórios de auditoria e mantenha-se em conformidade com as normas da ONA e JCI sem esforço."
                        />
                        <FeatureCard
                            icon={<Zap className="h-8 w-8 text-yellow-500" />}
                            title="Onboarding Rápido"
                            description="Implementation plug&play. Comece a usar em minutos, não meses. Sem custos de instalação complexos."
                        />
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-20 bg-indigo-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] opacity-10 bg-cover bg-center"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold mb-2">99.9%</div>
                            <div className="text-indigo-200">Uptime Garantido</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">50%</div>
                            <div className="text-indigo-200">Redução em Incidentes</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">10k+</div>
                            <div className="text-indigo-200">Profissionais</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">24/7</div>
                            <div className="text-indigo-200">Suporte Dedicado</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center text-white mb-4">
                                <Shield className="h-6 w-6 mr-2" />
                                <span className="text-xl font-bold">Sentinela AI</span>
                            </div>
                            <p className="max-w-xs">Elevando o padrão de segurança hospitalar com inteligência artificial.</p>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-4">Produto</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white">Recursos</a></li>
                                <li><a href="#" className="hover:text-white">Preços</a></li>
                                <li><a href="#" className="hover:text-white">API</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-4">Empresa</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white">Sobre</a></li>
                                <li><a href="#" className="hover:text-white">Blog</a></li>
                                <li><a href="#" className="hover:text-white">Contato</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
                        © {new Date().getFullYear()} Sentinela AI. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:-translate-y-1">
        <div className="mb-6 p-3 bg-gray-50 rounded-xl w-fit">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
);

export default HomePage;
