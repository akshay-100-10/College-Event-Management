import React from 'react';
import { cn } from '../../lib/utils';
import Button from './Button';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    className
}) => {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center text-center p-12 rounded-3xl bg-gray-50/50 dark:bg-gray-900/50 border-2 border-dashed border-gray-200 dark:border-gray-800",
            className
        )}>
            {Icon && (
                <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                    <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
            )}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
                {description}
            </p>
            {action && (
                <Button
                    variant="secondary"
                    onClick={action.onClick}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
};
