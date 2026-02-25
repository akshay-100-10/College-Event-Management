import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight, TrendingUp, Heart } from 'lucide-react';
import type { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

interface EventCardProps {
    event: Event;
    onLikeToggle?: (eventId: string, isLiked: boolean) => void;
}

const EventCard = ({ event, onLikeToggle }: EventCardProps) => {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(event.is_liked || false);

    // Calculate if event is new (created within last 7 days)
    const isNew = event.created_at &&
        (new Date().getTime() - new Date(event.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 7;

    // Calculate if event is trending (>50% booked and created within last 30 days)
    const bookingRate = event.booked_seats / event.total_seats;
    const isTrending = bookingRate > 0.5 && bookingRate < 0.8 &&
        event.created_at &&
        (new Date().getTime() - new Date(event.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 30;

    const isFillingFast = bookingRate > 0.8;

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) return;

        const newLikedState = !isLiked;
        setIsLiked(newLikedState); // Optimistic update

        try {
            if (newLikedState) {
                // Use upsert so if it already exists, it just silently succeeds
                const { error } = await supabase
                    .from('event_likes')
                    .upsert({ user_id: user.id, event_id: event.id }, { onConflict: 'user_id,event_id', ignoreDuplicates: true });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('event_likes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('event_id', event.id);
                if (error) throw error;
            }
            if (onLikeToggle) onLikeToggle(event.id, newLikedState);
        } catch (error) {
            console.error('Error toggling like:', error);
            setIsLiked(!newLikedState); // Revert on real error
        }
    };

    return (
        <Link
            to={`/event/${event.id}`}
            className="group flex-none w-[280px] sm:w-[300px] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 flex flex-col relative"
        >
            <div className="h-44 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                {event.image_url ? (
                    <img
                        src={event.image_url}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600">
                        <Calendar size={48} strokeWidth={1.5} />
                    </div>
                )}

                {/* Top badges - Status indicators */}
                <div className="absolute top-3 left-3 z-20 flex gap-2">
                    {isNew && (
                        <span className="bg-green-600/90 backdrop-blur-sm text-[10px] font-medium px-2.5 py-1 rounded-md uppercase tracking-wide text-white shadow-lg">
                            New
                        </span>
                    )}
                    {isTrending && (
                        <span className="bg-orange-600/90 backdrop-blur-sm text-[10px] font-medium px-2.5 py-1 rounded-md uppercase tracking-wide text-white shadow-lg flex items-center gap-1">
                            <TrendingUp size={12} />
                            Trending
                        </span>
                    )}
                </div>

                {/* Like Button */}
                {user && (
                    <button
                        onClick={handleLike}
                        className="absolute top-3 right-3 z-30 p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors"
                    >
                        <Heart
                            size={18}
                            className={`${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`}
                        />
                    </button>
                )}


                {/* Bottom badges - Category and availability */}
                <div className="absolute bottom-3 left-3 z-20 flex gap-2">
                    <span className="bg-indigo-600/90 backdrop-blur-sm text-[10px] font-medium px-2.5 py-1 rounded-md uppercase tracking-wide text-white">
                        {event.category}
                    </span>
                    {isFillingFast && (
                        <span className="bg-red-600/90 backdrop-blur-sm text-[10px] font-medium px-2.5 py-1 rounded-md uppercase tracking-wide text-white animate-pulse">
                            Filling Fast
                        </span>
                    )}
                </div>

                {/* Price badge moved to avoid conflict with like button if needed, or keep it but adjust position */}
                {!user && (
                    <div className="absolute top-3 right-3 z-20">
                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {event.price === 0 ? 'FREE' : `₹${event.price}`}
                        </div>
                    </div>
                )}
                {user && (
                    <div className="absolute bottom-3 right-3 z-20">
                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {event.price === 0 ? 'FREE' : `₹${event.price}`}
                        </div>
                    </div>
                )}

            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    <Clock size={14} className="text-indigo-500" />
                    {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {event.time}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {event.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 flex-1 leading-relaxed">
                    {event.description}
                </p>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                        <MapPin size={14} className="text-indigo-500 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold text-sm group-hover:gap-2 transition-all">
                        View
                        <ArrowRight size={16} />
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default EventCard;
