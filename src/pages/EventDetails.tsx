import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import {
    Calendar,
    MapPin,
    Clock,
    ArrowLeft,
    ShieldCheck,
    Ticket,
    AlertCircle,

    CheckCircle2,
    Phone,
    Mail,
    ExternalLink,
    Share2,

    Heart,
    Menu
} from 'lucide-react';
import CollegeSidebar from '../components/college/Sidebar';
import { Button } from '../components/ui';
import { ShareEventButton, AddToCalendarButton } from '../components/ShareButtons';
import ReviewsSection from '../components/reviews/ReviewsSection';
import 'leaflet/dist/leaflet.css';


import type { Event, SubEvent } from '../types';
import EventMap from '../components/EventMap';

// Force Leaflet CSS import at component level to ensure it's present
import 'leaflet/dist/leaflet.css';

const EventDetails = () => {
    const { id } = useParams();
    const { user, profile } = useAuth();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
    const [userSubEventBookings, setUserSubEventBookings] = useState<Set<string>>(new Set());
    const [similarEvents, setSimilarEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [seatsToBook, setSeatsToBook] = useState(1);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    // External registration self-report
    const [clickedGoogleForm, setClickedGoogleForm] = useState(false);
    const [extRegStatus, setExtRegStatus] = useState<'none' | 'self_reported' | 'verified' | 'rejected'>('none');
    const [extRegLoading, setExtRegLoading] = useState(false);

    const fetchEventDetails = async () => {
        setLoading(true);
        try {
            // Fetch current event
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select(`
                    *,
                    profiles:organizer_id (full_name, email)
                `)
                .eq('id', id)
                .single();

            if (eventError) throw eventError;
            setEvent(eventData);

            // Fetch sub-events (Agenda)
            const { data: subEventsData } = await supabase
                .from('sub_events')
                .select('*')
                .eq('event_id', id)
                .order('start_time', { ascending: true });

            if (subEventsData) setSubEvents(subEventsData);

            // Fetch user's sub-event bookings
            if (user) {
                const { data: userSubBookings } = await supabase
                    .from('sub_event_bookings')
                    .select('sub_event_id')
                    .eq('user_id', user.id)
                    .in('sub_event_id', subEventsData?.map(se => se.id) || []);

                if (userSubBookings) {
                    setUserSubEventBookings(new Set(userSubBookings.map(b => b.sub_event_id)));
                }
            }

            // Fetch similar events
            if (eventData) {
                const { data: similarData } = await supabase
                    .from('events')
                    .select('*')
                    .eq('category', eventData.category)
                    .eq('status', 'approved')
                    .neq('id', id)
                    .limit(4);

                if (similarData) setSimilarEvents(similarData);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    // Check if user already self-reported for this event
    useEffect(() => {
        const checkExtReg = async () => {
            if (!user || !id) return;
            const { data } = await supabase
                .from('external_registrations')
                .select('status')
                .eq('user_id', user.id)
                .eq('event_id', id)
                .maybeSingle();
            if (data) setExtRegStatus(data.status as typeof extRegStatus);
        };
        checkExtReg();
    }, [user, id]);

    const [bookingLoadingSubEvent, setBookingLoadingSubEvent] = useState<string | null>(null);

    const handleSelfReport = async () => {
        if (!user || !id) return;
        setExtRegLoading(true);
        try {
            const { error: insErr } = await supabase
                .from('external_registrations')
                .upsert({ user_id: user.id, event_id: id, status: 'self_reported' }, { onConflict: 'user_id,event_id' });
            if (insErr) throw insErr;
            setExtRegStatus('self_reported');
        } catch (e: unknown) {
            console.error(e);
        } finally {
            setExtRegLoading(false);
        }
    };

    const handleSubEventBooking = async (subEventId: string) => {
        if (!user) {
            navigate('/login', { state: { from: { pathname: `/event/${id}` } } });
            return;
        }

        if (profile?.role !== 'student') {
            toast.error('Only students can book events.');
            return;
        }

        setBookingLoadingSubEvent(subEventId);
        try {
            const { data, error } = await supabase.rpc('book_sub_event', {
                p_sub_event_id: subEventId,
                p_user_id: user.id
            });

            if (error) throw error;
            if (data && !data.success) {
                throw new Error(data.message);
            }

            toast.success('Successfully registered for this session!');
            // Refresh to update booked_seats count
            fetchEventDetails();
        } catch (err: any) {
            toast.error(err.message || 'Failed to register for sub-event');
        } finally {
            setBookingLoadingSubEvent(null);
        }
    };



    const handleShare = async (platform?: 'whatsapp' | 'twitter' | 'copy') => {
        const shareUrl = window.location.href;
        const shareText = `Check out ${event?.title} on CollegeEvents!`;

        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        } else if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        } else if (navigator.share && !platform) {
            try {
                await navigator.share({
                    title: event?.title,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
        }
    };



    const handleBooking = async () => {
        if (!user) {
            navigate('/login', { state: { from: { pathname: `/event/${id}` } } });
            return;
        }

        if (profile?.role !== 'student') {
            alert('Only students can book events.');
            return;
        }

        // Check if event is in the past
        if (event) {
            const eventDateTime = new Date(`${event.date}T${event.time}`);
            const now = new Date();

            if (eventDateTime < now) {
                setError('This event has already occurred and cannot be booked.');
                return;
            }
        }

        setBookingLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.rpc('book_event', {
                p_event_id: id,
                p_user_id: user.id,
                p_seats: seatsToBook
            });

            if (error) throw error;

            if (data && !data.success) {
                throw new Error(data.message);
            }

            toast.success('🎉 Booking confirmed! Check your tickets in My Bookings.');
            setBookingSuccess(true);
            // Add a notification
            addNotification({
                type: 'booking',
                title: 'Booking Confirmed! 🎉',
                message: `Your ${seatsToBook} ticket(s) for "${event?.title}" are confirmed. Show your QR code at the entry.`,
            });
            fetchEventDetails(); // Refresh data
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event Not Found</h2>
                    <p className="text-gray-500 dark:text-gray-400">The event you're looking for doesn't exist.</p>
                    <Link to="/home" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const isSoldOut = event.booked_seats >= event.total_seats;
    const isPastEvent = new Date(`${event.date}T${event.time}`) < new Date();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 relative overflow-hidden transition-colors duration-300">
            <CollegeSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Navbar */}
            <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-50 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <Link to="/home" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            CollegeEvents
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare('copy')}
                            className="hidden sm:flex"
                            icon={Share2}
                        >
                            Share
                        </Button>
                        <Link to="/home" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                            <ArrowLeft size={16} />
                            Back
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Left Column: Event Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Image Card */}
                        <div className="relative h-64 sm:h-96 bg-gray-100 dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden group shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent z-10"></div>
                            {event.image_url ? (
                                <img
                                    src={event.image_url}
                                    alt={event.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-600">
                                    <Calendar size={120} strokeWidth={1} />
                                </div>
                            )}

                            <div className="absolute top-4 right-4 z-20 flex gap-2">
                                <button
                                    onClick={() => setIsLiked(!isLiked)}
                                    className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                                >
                                    <Heart size={20} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                                </button>
                            </div>

                            <div className="absolute bottom-0 left-0 p-6 sm:p-8 z-20 w-full">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <span className="bg-indigo-600 text-xs font-bold px-3 py-1 rounded-full text-white uppercase tracking-wider shadow-lg shadow-indigo-600/20">
                                        {event.category}
                                    </span>
                                    {event.created_at && (new Date().getTime() - new Date(event.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 7 && (
                                        <span className="bg-green-500 text-xs font-bold px-3 py-1 rounded-full text-white uppercase tracking-wider shadow-lg shadow-green-500/20">
                                            New
                                        </span>
                                    )}
                                    {isPastEvent && (
                                        <span className="bg-gray-500 text-xs font-bold px-3 py-1 rounded-full text-white uppercase tracking-wider shadow-lg">
                                            Event Ended
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-2 leading-tight">{event.title}</h1>
                                <div className="flex items-center gap-2 text-gray-300 text-sm sm:text-base">
                                    <MapPin size={16} className="text-indigo-400" />
                                    {event.venue}, {event.location}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Bar */}
                        <div className="flex flex-wrap gap-4">
                            <AddToCalendarButton event={event} />
                            <ShareEventButton event={event} />
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 hover:border-indigo-500/30 transition-colors">
                                <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Date</p>
                                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                                        {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 hover:border-indigo-500/30 transition-colors">
                                <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Time</p>
                                    <p className="text-base font-semibold text-gray-900 dark:text-white">{event.time}</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="prose prose-gray dark:prose-invert max-w-none">
                            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                About the Event
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
                                {event.description}
                            </p>
                        </div>

                        {/* Event Agenda / Schedule */}
                        {subEvents.length > 0 && (
                            <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                                    <Clock className="text-indigo-600 dark:text-indigo-400" size={24} />
                                    Event Schedule
                                </h2>
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-200 dark:before:via-indigo-900 before:to-transparent">
                                    {subEvents.map((subEvent, index) => (
                                        <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Icon/Dot */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-900 bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                                <span className="text-xs font-bold">{index + 1}</span>
                                            </div>

                                            {/* Card */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:border-indigo-500/30 hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg">
                                                        {(() => {
                                                            const fmt = (iso: string) => {
                                                                if (!iso) return '';
                                                                const d = new Date(iso);
                                                                return isNaN(d.getTime())
                                                                    ? iso
                                                                    : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                                                            };
                                                            return `${fmt(subEvent.start_time)}${subEvent.end_time ? ' – ' + fmt(subEvent.end_time) : ''}`;
                                                        })()}
                                                    </span>
                                                    {subEvent.price > 0 && (
                                                        <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                                            ₹{subEvent.price}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{subEvent.title}</h3>
                                                {subEvent.description && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{subEvent.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 font-medium">
                                                    {subEvent.venue && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin size={12} />
                                                            {subEvent.venue}
                                                        </div>
                                                    )}
                                                    {subEvent.requires_registration && (
                                                        <div className="flex items-center gap-1">
                                                            {userSubEventBookings.has(subEvent.id) ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                                                                    <CheckCircle2 size={14} />
                                                                    Registered
                                                                </span>
                                                            ) : (
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={() => handleSubEventBooking(subEvent.id)}
                                                                    disabled={bookingLoadingSubEvent === subEvent.id || (subEvent.total_seats > 0 && subEvent.booked_seats >= subEvent.total_seats)}
                                                                    className="h-8 text-xs font-bold gap-1.5 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 dark:border-orange-500/30 dark:text-orange-400 dark:hover:bg-orange-500/10 bg-transparent"
                                                                >
                                                                    {bookingLoadingSubEvent === subEvent.id ? (
                                                                        <div className="w-3.5 h-3.5 border-2 border-orange-600 dark:border-orange-400 border-t-transparent rounded-full animate-spin" />
                                                                    ) : (
                                                                        <Ticket size={14} />
                                                                    )}
                                                                    {subEvent.total_seats > 0 && subEvent.booked_seats >= subEvent.total_seats ? 'Full' : 'Register'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Map View Section */}
                        {event.location && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <MapPin className="text-indigo-600 dark:text-indigo-400" size={24} />
                                    Event Location
                                </h2>
                                <div className="h-80 w-full rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden relative shadow-inner bg-gray-100 dark:bg-gray-900">
                                    <EventMap
                                        location={event.location}
                                        venue={event.venue}
                                        title={event.title}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Organizer & Contact */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                                    <ShieldCheck className="text-green-600" size={20} />
                                    Organizer
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-indigo-600/10 dark:bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                                        {event.profiles?.full_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{event.profiles?.full_name || 'Unknown Organizer'}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{event.profiles?.email || ''}</p>
                                    </div>
                                </div>
                            </div>

                            {(event.contact_phone || event.contact_email) && (
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                                        <Phone className="text-indigo-600 dark:text-indigo-400" size={20} />
                                        Contact Info
                                    </h3>
                                    <div className="space-y-3">
                                        {event.contact_phone && (
                                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                                <Phone size={16} />
                                                <span>{event.contact_phone}</span>
                                            </div>
                                        )}
                                        {event.contact_email && (
                                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                                <Mail size={16} />
                                                <a href={`mailto:${event.contact_email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                    {event.contact_email}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reviews Section */}
                        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                            <ReviewsSection eventId={event.id} />
                        </div>

                        {/* Similar Events Section */}
                        {similarEvents.length > 0 && (
                            <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Similar Events</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {similarEvents.map(similar => (
                                        <Link
                                            key={similar.id}
                                            to={`/event/${similar.id}`}
                                            className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-lg"
                                        >
                                            <div className="h-32 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                                {similar.image_url ? (
                                                    <img src={similar.image_url} alt={similar.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                                        <Calendar size={32} />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                    {similar.price === 0 ? 'FREE' : `₹${similar.price}`}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-900 dark:text-white truncate mb-1">{similar.title}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(similar.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 sticky top-24 shadow-2xl shadow-indigo-500/5 dark:shadow-none">
                            {bookingSuccess ? (
                                <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
                                    <div className="mx-auto h-20 w-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-600">
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Confirmed!</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mt-2">Your seats have been reserved successfully.</p>
                                    </div>
                                    <Link
                                        to="/my-bookings"
                                        className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all text-center shadow-lg shadow-indigo-600/20"
                                    >
                                        View My Tickets
                                    </Link>
                                    <button
                                        onClick={() => setBookingSuccess(false)}
                                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        Book more seats
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Ticket Price</span>
                                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                            {event.price === 0 ? 'FREE' : `₹${event.price}`}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Availability</span>
                                            <span className={`${isSoldOut ? 'text-red-500' : isPastEvent ? 'text-gray-500' : 'text-green-600'} font-bold`}>
                                                {isPastEvent ? 'Event Ended' : isSoldOut ? 'Sold Out' : `${event.total_seats - event.booked_seats} seats left`}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${isSoldOut ? 'bg-red-500' : 'bg-indigo-600'}`}
                                                style={{ width: `${(event.booked_seats / event.total_seats) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {!isSoldOut && !isPastEvent && event.registration_type !== 'external' && (
                                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Select Seats</label>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => setSeatsToBook(Math.max(1, seatsToBook - 1))}
                                                    className="h-12 w-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl flex items-center justify-center text-xl font-bold transition-colors text-gray-900 dark:text-white"
                                                >
                                                    -
                                                </button>
                                                <div className="flex-1 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center font-bold text-xl text-gray-900 dark:text-white">
                                                    {seatsToBook}
                                                </div>
                                                <button
                                                    onClick={() => setSeatsToBook(Math.min(10, seatsToBook + 1))}
                                                    className="h-12 w-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl flex items-center justify-center text-xl font-bold transition-colors text-gray-900 dark:text-white"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest">Max 10 seats per booking</p>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                                            <AlertCircle size={16} />
                                            {error}
                                        </div>
                                    )}

                                    {event.registration_type === 'external' ? (
                                        isPastEvent ? (
                                            <button
                                                disabled
                                                className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                            >
                                                <Ticket size={20} />
                                                Event Ended
                                            </button>
                                        ) : extRegStatus === 'verified' ? (
                                            <div className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-2 border-green-200 dark:border-green-800">
                                                <CheckCircle2 size={20} />
                                                Registration Verified ✓
                                            </div>
                                        ) : extRegStatus === 'self_reported' ? (
                                            <div className="space-y-3">
                                                <div className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-2 border-amber-200 dark:border-amber-800">
                                                    <CheckCircle2 size={18} />
                                                    Registration Reported — Awaiting Verification
                                                </div>
                                                <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                                                    The organiser will verify your registration soon.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {/* Step 1: Open Google Form */}
                                                <a
                                                    href={event.external_registration_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => setClickedGoogleForm(true)}
                                                    className="w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
                                                >
                                                    <ExternalLink size={20} />
                                                    Register on Google Form
                                                </a>
                                                {/* Step 2: Confirm after filling form */}
                                                {clickedGoogleForm && (
                                                    <button
                                                        onClick={handleSelfReport}
                                                        disabled={extRegLoading}
                                                        className="w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 border-2 border-green-200 dark:border-green-800"
                                                    >
                                                        {extRegLoading ? (
                                                            <div className="h-4 w-4 border-2 border-green-400/30 border-t-green-500 rounded-full animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 size={16} />
                                                        )}
                                                        Done filling the form? Mark as Registered
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <button
                                            onClick={handleBooking}
                                            disabled={bookingLoading || isSoldOut || isPastEvent}
                                            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-2 ${isSoldOut || isPastEvent
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                                }`}
                                        >
                                            {bookingLoading ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                            ) : (
                                                <>
                                                    <Ticket size={20} />
                                                    {isPastEvent ? 'Event Ended' : isSoldOut ? 'Sold Out' : 'Book Now'}
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {event.registration_type !== 'external' && !isPastEvent && (
                                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                            {event.price === 0 ? 'Free event - No payment required' : 'Payment will be collected at the venue'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EventDetails;
