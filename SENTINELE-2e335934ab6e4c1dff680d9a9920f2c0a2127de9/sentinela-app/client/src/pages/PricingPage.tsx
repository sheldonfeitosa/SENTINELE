import React from 'react';
// import { loadStripe } from '@stripe/stripe-js';
import { apiService } from '../services/ApiService';
import { Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Configure with your publishable key
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PricingPageProps {
    userId?: number; // Pass current user ID (Optional/Legacy)
}

export const PricingPage: React.FC<PricingPageProps> = ({ userId = 1 }) => {
    const [loading, setLoading] = React.useState(false);
    const navigate = useNavigate();

    // Get User ID from LocalStorage
    const getUserID = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return user.id;
            }
        } catch (e) {
            console.error('Failed to parse user from localstorage', e);
        }
        return userId; // Fallback to prop
    };

    const currentUserId = getUserID();

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            // Call backend via ApiService (handles Auth + Base URL)
            // Expecting { url: string }
            if (!currentUserId) throw new Error('User ID not found. Please log in again.');
            const data = await apiService.createCheckoutSession(currentUserId) as any;

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No redirect URL found');
            }

        } catch (err: any) {
            console.error('Subscription error:', err);

            if (err.response?.status === 401) {
                alert('Sua sessão expirou. Por favor, faça login novamente.');
                navigate('/login');
                return;
            }

            // Show detailed error for debugging
            alert(`Failed: ${err.message}\nStatus: ${err.response?.status}\nData: ${JSON.stringify(err.response?.data)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="text-center max-w-3xl mb-12">
                <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Preços</h2>
                <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Escolha o plano ideal para sua instituição
                </p>
                <p className="mt-4 text-xl text-gray-500">
                    Acesso completo a todas as funcionalidades de gestão de risco e notificações inteligentes.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-lg w-full transform transition-all hover:scale-105 border border-gray-100">
                <div className="px-6 py-8 sm:p-10 sm:pb-6">
                    <div className="flex justify-center">
                        <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-blue-100 text-blue-600">
                            Pro
                        </span>
                    </div>
                    <div className="mt-4 flex justify-center items-baseline text-6xl font-extrabold text-gray-900">
                        R$ 299
                        <span className="ml-1 text-2xl font-medium text-gray-500">/mês</span>
                    </div>
                    <p className="mt-5 text-lg text-gray-500 text-center">
                        Para hospitais e clínicas que buscam excelência em segurança do paciente.
                    </p>
                </div>
                <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10 sm:pt-6">
                    <ul className="space-y-4">
                        {[
                            'Notificações de Incidentes Ilimitadas',
                            'Análise de Risco com IA',
                            'Dashboard em Tempo Real',
                            'Gestão de Planos de Ação',
                            'Suporte Prioritário',
                            'Multi-usuários'
                        ].map((feature) => (
                            <li key={feature} className="flex items-start">
                                <div className="flex-shrink-0">
                                    <Check className="h-6 w-6 text-green-500" aria-hidden="true" />
                                </div>
                                <p className="ml-3 text-base text-gray-700">{feature}</p>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-10">
                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full flex justify-center items-center px-4 py-4 border border-transparent text-xl font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-2xl transition duration-150 ease-in-out disabled:opacity-75 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? <Loader2 className="animate-spin h-6 w-6" /> : 'Assinar Agora'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
