import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    loading?: boolean;
    children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            icon: Icon,
            iconPosition = 'left',
            fullWidth = false,
            loading = false,
            disabled,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
            secondary: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700',
            ghost: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
            danger: 'bg-red-600 hover:bg-red-700 text-white',
        };

        const sizes = {
            sm: 'px-4 py-2 text-sm',
            md: 'px-6 py-3 text-sm',
            lg: 'px-8 py-4 text-base',
        };

        const iconSizes = {
            sm: 16,
            md: 18,
            lg: 20,
        };

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
                {...props}
            >
                {loading ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        {Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} />}
                        {children}
                        {Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} />}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
