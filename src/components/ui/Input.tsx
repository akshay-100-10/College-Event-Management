import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            icon: Icon,
            iconPosition = 'left',
            fullWidth = true,
            className = '',
            ...props
        },
        ref
    ) => {
        const baseStyles = 'bg-gray-50 dark:bg-gray-900 border rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all';

        const borderStyles = error
            ? 'border-red-500 dark:border-red-500'
            : 'border-gray-200 dark:border-gray-800';

        const iconPadding = Icon
            ? iconPosition === 'left'
                ? 'pl-10'
                : 'pr-10'
            : '';

        return (
            <div className={fullWidth ? 'w-full' : ''}>
                {label && (
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {Icon && iconPosition === 'left' && (
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )}
                    <input
                        ref={ref}
                        className={`${baseStyles} ${borderStyles} ${iconPadding} ${fullWidth ? 'w-full' : ''} ${className}`}
                        {...props}
                    />
                    {Icon && iconPosition === 'right' && (
                        <Icon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )}
                </div>
                {error && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
