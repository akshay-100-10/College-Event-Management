import { X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'warning',
    loading = false
}: ConfirmDialogProps) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            button: 'bg-red-600 hover:bg-red-700 text-white',
            icon: 'text-red-600 dark:text-red-400'
        },
        warning: {
            button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
            icon: 'text-yellow-600 dark:text-yellow-400'
        },
        info: {
            button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
            icon: 'text-indigo-600 dark:text-indigo-400'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    disabled={loading}
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/20' :
                            variant === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                                'bg-indigo-100 dark:bg-indigo-900/20'
                        }`}>
                        <svg className={`w-8 h-8 ${styles.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        {title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 ${styles.button}`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
