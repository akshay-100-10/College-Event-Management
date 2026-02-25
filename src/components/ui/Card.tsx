import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hover = false,
    padding = 'md',
    onClick,
}) => {
    const baseStyles = 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 transition-all duration-200';

    const hoverStyles = hover
        ? 'hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg cursor-pointer'
        : '';

    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={`${baseStyles} ${hoverStyles} ${paddingStyles[padding]} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
