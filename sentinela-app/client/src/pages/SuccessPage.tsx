import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const SuccessPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        if (sessionId) {
            // Optional: Verify session with backend if needed
            console.log('Payment successful for session:', sessionId);
        }
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center bg-white p-10 rounded-xl shadow-lg">
                <div className="flex justify-center">
                    <CheckCircle className="h-20 w-20 text-green-500" />
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                    Pagamento Confirmado!
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Obrigado por assinar o Sentinela AI. Sua conta foi atualizada com sucesso.
                </p>
                <div className="mt-8">
                    <Link
                        to="/gestao-risco"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Voltar ao Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SuccessPage;
