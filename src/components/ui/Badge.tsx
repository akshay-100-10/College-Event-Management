import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    className = '',
}) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-md border';

    const variants = {
        default: 'bg-gray-50 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/20',
        success: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
        warning: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
        danger: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
        info: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
    };

    return (
        <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
