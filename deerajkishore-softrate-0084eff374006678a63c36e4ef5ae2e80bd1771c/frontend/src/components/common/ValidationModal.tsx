import React from 'react';

interface ValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: 'error' | 'warning' | 'success';
    onConfirm?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    showCancel?: boolean;
}

const ValidationModal: React.FC<ValidationModalProps> = ({
    isOpen,
    onClose,
    title = 'Validation Error',
    message,
    type = 'error',
    onConfirm,
    confirmLabel,
    cancelLabel = 'Abandon',
    showCancel
}) => {
    if (!isOpen) return null;

    const getColors = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-teal-50',
                    border: 'border-teal-100',
                    text: 'text-teal-600',
                    icon: 'fa-check-circle',
                    accent: 'bg-pastel-mint',
                    button: 'bg-teal-600 shadow-teal-200/50 hover:bg-teal-700'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-50',
                    border: 'border-amber-100',
                    text: 'text-amber-600',
                    icon: 'fa-triangle-exclamation',
                    accent: 'bg-pastel-orange',
                    button: 'bg-amber-600 shadow-amber-200/50 hover:bg-amber-700'
                };
            case 'error':
            default:
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-100',
                    text: 'text-red-500',
                    icon: 'fa-circle-exclamation',
                    accent: 'bg-red-50',
                    button: 'bg-red-600 shadow-red-200/50 hover:bg-red-700'
                };
        }
    };

    const theme = getColors();

    const finalConfirmLabel = confirmLabel || (onConfirm ? 'Confirm Action' : 'Acknowledge');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl animate-fade-in">
            <div className="bg-white max-w-lg w-full p-14 rounded-[3.5rem] border border-white shadow-3xl relative overflow-hidden animate-slide-up">
                {/* Decorative Shape */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} rounded-bl-[4rem]`}></div>

                <div className="relative z-10 text-center">
                    <div className={`w-24 h-24 ${theme.bg} rounded-full flex items-center justify-center mx-auto mb-10 border ${theme.border} shadow-sm transition-transform hover:scale-110 duration-500`}>
                        <i className={`fas ${theme.icon} text-4xl ${theme.text} ${type === 'error' ? 'animate-pulse' : ''}`}></i>
                    </div>

                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 uppercase leading-none">
                        {title}
                    </h3>

                    <div className="space-y-4 mb-12">
                        <p className="text-slate-700 text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed px-4">
                            {message}
                        </p>
                        {type === 'warning' && (
                            <p className="text-red-600 text-[10px] font-black uppercase tracking-[0.3em] pt-4 border-t border-slate-50 mt-4 underline decoration-2 underline-offset-4">
                                This operation is irreversible.
                            </p>
                        )}
                    </div>

                    <div className="flex gap-6">
                        {showCancel && (
                            <button
                                onClick={onClose}
                                className="flex-1 py-6 rounded-[2rem] bg-slate-50 border border-slate-200 text-slate-700 font-black uppercase tracking-[0.4em] text-[10px] shadow-sm hover:bg-slate-100 transition-all active:scale-95"
                            >
                                {cancelLabel}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (onConfirm) onConfirm();
                                else onClose();
                            }}
                            className={`${showCancel ? 'flex-1' : 'w-full'} py-6 rounded-[2rem] ${theme.button} text-white font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all active:scale-95`}
                        >
                            {finalConfirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ValidationModal;
