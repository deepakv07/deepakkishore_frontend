import React from 'react';

interface ValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: 'error' | 'warning' | 'success';
}

const ValidationModal: React.FC<ValidationModalProps> = ({
    isOpen,
    onClose,
    title = 'Validation Error',
    message,
    type = 'error'
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <i className="fas fa-check-circle text-emerald-500 text-5xl mb-4"></i>;
            case 'warning':
                return <i className="fas fa-exclamation-triangle text-orange-500 text-5xl mb-4"></i>;
            case 'error':
            default:
                return <i className="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>;
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case 'success': return 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-200';
            case 'warning': return 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-200';
            case 'error': default: return 'bg-red-500 hover:bg-red-600 focus:ring-red-200';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 text-center transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100"
                role="dialog"
                aria-modal="true"
            >
                <div className="mb-2">
                    {getIcon()}
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                    {title}
                </h3>

                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                    {message}
                </p>

                <button
                    onClick={onClose}
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all active:scale-95 focus:outline-none focus:ring-4 ${getButtonColor()}`}
                >
                    Okay, Got it
                </button>
            </div>
        </div>
    );
};

export default ValidationModal;
