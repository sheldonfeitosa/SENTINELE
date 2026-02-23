import { useEffect, useState } from 'react';
import { X, AlertTriangle, Building2, CheckCircle2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
    type?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading = false,
    type = 'warning',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
}: ConfirmationModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle className="w-6 h-6 text-red-600" />;
            case 'warning': return <Building2 className="w-6 h-6 text-amber-600" />;
            case 'success': return <CheckCircle2 className="w-6 h-6 text-green-600" />;
            case 'info': return <Building2 className="w-6 h-6 text-blue-600" />;
            default: return <AlertTriangle className="w-6 h-6 text-amber-600" />;
        }
    };

    const getHeaderColor = () => {
        switch (type) {
            case 'danger': return 'bg-red-50';
            case 'warning': return 'bg-amber-50';
            case 'success': return 'bg-green-50';
            case 'info': return 'bg-blue-50';
            default: return 'bg-amber-50';
        }
    };

    const getButtonStyles = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'success':
                return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
            case 'info':
                return 'bg-[#003366] hover:bg-[#002244] focus:ring-blue-500';
            default:
                return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
        }
    };

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={isLoading ? undefined : onClose}
            />

            {/* Modal Content */}
            <div className={`
                relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all duration-300
                ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
                overflow-hidden border border-white/20
            `}>
                {/* Decorative top bar */}
                <div className={`h-1.5 w-full ${type === 'warning' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                    type === 'danger' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                        type === 'info' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                            'bg-gradient-to-r from-green-400 to-green-600'}`} />

                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${getHeaderColor()} ring-1 ring-black/5`}>
                            {getIcon()}
                        </div>
                        <div className="flex-1 pt-1">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all shadow-sm"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`
                                px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md
                                focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all
                                flex items-center gap-2
                                ${getButtonStyles()}
                                ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-0.5'}
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
