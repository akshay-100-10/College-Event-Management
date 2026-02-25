import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: number;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
    className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
    rating,
    maxRating = 5,
    size = 20,
    interactive = false,
    onRatingChange,
    className
}) => {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {Array.from({ length: maxRating }).map((_, index) => {
                const starValue = index + 1;
                const isFilled = (hoverRating !== null ? hoverRating : rating) >= starValue;

                return (
                    <button
                        key={index}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && onRatingChange?.(starValue)}
                        onMouseEnter={() => interactive && setHoverRating(starValue)}
                        onMouseLeave={() => interactive && setHoverRating(null)}
                        className={cn(
                            "transition-all duration-200",
                            interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
                        )}
                    >
                        <Star
                            size={size}
                            className={cn(
                                "transition-colors",
                                isFilled
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-transparent text-gray-300 dark:text-gray-600"
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
};
