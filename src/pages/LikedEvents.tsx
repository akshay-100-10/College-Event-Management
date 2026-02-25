import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Event } from '../types';
import EventCard from '../components/EventCard';
import { EmptyState, Skeleton } from '../components/ui';
import { Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const LikedEvents = () => {
    const { user } = useAuth();
    const [likedEvents, setLikedEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchLikedEvents();
        }
    }, [user]);

    const fetchLikedEvents = async () => {
        setLoading(true);
        try {
            // Fetch liked event IDs first
            const { data: likedData, error: likeError } = await supabase
                .from('event_likes')
                .select('event_id')
                .eq('user_id', user!.id);

            if (likeError) throw likeError;

            if (!likedData || likedData.length === 0) {
                setLikedEvents([]);
                setLoading(false);
                return;
            }

            const eventIds = likedData.map(l => l.event_id);

            // Fetch actual event details
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select(`
                    *,
                    profiles:organizer_id (full_name)
                `)
                .in('id', eventIds)
                .order('date', { ascending: true });

            if (eventsError) throw eventsError;

            // Map and add is_liked: true
            const events = (eventsData || []).map(event => ({
                ...event,
                is_liked: true
            }));

            setLikedEvents(events);
        } catch (error) {
            console.error('Error fetching liked events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLikeToggle = (eventId: string, isLiked: boolean) => {
        if (!isLiked) {
            // Remove from list if unliked
            setLikedEvents(prev => prev.filter(e => e.id !== eventId));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        to="/home"
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Heart className="text-red-500 fill-red-500" />
                            My Wishlist
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Events you have saved for later
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex-none bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
                                <Skeleton className="h-44 w-full" />
                                <div className="p-5 flex flex-col flex-1">
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-2/3 mb-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : likedEvents.length === 0 ? (
                    <EmptyState
                        icon={Heart}
                        title="Your wishlist is empty"
                        description="Browse events and click the heart icon to save them to your wishlist."
                        action={{
                            label: "Browse Events",
                            onClick: () => window.location.href = '/home' // Simple redirect
                        }}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {likedEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onLikeToggle={handleLikeToggle}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LikedEvents;
