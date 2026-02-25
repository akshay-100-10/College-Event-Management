import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Calendar,
    MapPin,
    Search,
    Filter,
    Ticket,
    TrendingUp,
    Moon,
    Sun,
    Menu,
    ArrowRight,
    ChevronDown,
    Heart,
    X,
    History
} from 'lucide-react';
import HomeSidebar from '../components/HomeSidebar';
import LocationModal from '../components/LocationModal';
import FilterModal, { type FilterState } from '../components/FilterModal';
import NotificationDropdown from '../components/NotificationDropdown';
import { useTheme } from '../context/ThemeContext';
import { Skeleton, EmptyState } from '../components/ui';
import EventCard from '../components/EventCard';
import type { Event } from '../types';

const Home = () => {
    const { user, profile, signOut } = useAuth();
    const { selectedLocation, setIsLocationModalOpen } = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter State
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        date: 'all',
        priceRange: 'all',
        categories: [],
        sortBy: 'date'
    });

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [categories, setCategories] = useState<{
        upcoming: Event[];
        free: Event[];
        topRated: Event[];
        all: Event[];
        past: Event[];
    }>({ upcoming: [], free: [], topRated: [], all: [], past: [] });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    profiles:organizer_id (full_name)
                `)
                .eq('status', 'approved')
                .order('date', { ascending: true });

            if (error) throw error;
            let allEvents: Event[] = data || [];

            // If user is logged in, fetch their likes
            if (user) {
                const { data: likedData } = await supabase
                    .from('event_likes')
                    .select('event_id')
                    .eq('user_id', user.id);

                const likedEventIds = new Set(likedData?.map(l => l.event_id));
                allEvents = allEvents.map(event => ({
                    ...event,
                    is_liked: likedEventIds.has(event.id)
                }));
            }
            setEvents(allEvents);

            // Categorize events
            const now = new Date();
            const upcoming = allEvents.filter(e => new Date(e.date) > now).slice(0, 8);
            const past = allEvents.filter(e => new Date(e.date) <= now)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // most recent ended first
                .slice(0, 12);
            const free = allEvents.filter(e => e.price === 0 && new Date(e.date) > now).slice(0, 8);
            const topRated = [...allEvents.filter(e => new Date(e.date) > now)]
                .sort((a, b) => (b.booked_seats / b.total_seats) - (a.booked_seats / a.total_seats))
                .slice(0, 8);

            setCategories({ upcoming, free, topRated, all: allEvents, past });
        } catch (err: any) {
            console.error('Error fetching events:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = (event.title?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
            (event.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
            (event.venue?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
            (event.location?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());

        // Category Filter — case-insensitive match
        const matchesCategory = filters.categories.length === 0 ||
            filters.categories.includes('All') ||
            filters.categories.some(cat => cat.toLowerCase() === (event.category || '').toLowerCase());

        // Date Filter
        let matchesDate = true;
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0); // normalize to midnight for accurate day diff
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filters.date === 'today') {
            matchesDate = eventDate.getTime() === today.getTime();
        } else if (filters.date === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            matchesDate = eventDate.getTime() === tomorrow.getTime();
        } else if (filters.date === 'weekend') {
            const day = eventDate.getDay(); // 0=Sun, 6=Sat
            const isWeekend = day === 0 || day === 6;
            const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            matchesDate = isWeekend && diffDays >= 0 && diffDays <= 7;
        }

        // Price Filter — treat null as 0 (free)
        let matchesPrice = true;
        const price = event.price ?? 0;
        if (filters.priceRange === 'free') {
            matchesPrice = price === 0;
        } else if (filters.priceRange === 'paid') {
            matchesPrice = price > 0;
        } else if (filters.priceRange === 'under-500') {
            matchesPrice = price < 500;
        } else if (filters.priceRange === '500-1000') {
            matchesPrice = price >= 500 && price <= 1000;
        } else if (filters.priceRange === '1000+') {
            matchesPrice = price > 1000;
        }

        // Location Filter
        const matchesLocation = !selectedLocation || selectedLocation === 'All Locations' ||
            (event.location && event.location.toLowerCase().includes(selectedLocation.toLowerCase()));

        return matchesSearch && matchesCategory && matchesDate && matchesPrice && matchesLocation;
    }).sort((a, b) => {
        // Null-safe sort comparisons
        const priceA = a.price ?? 0;
        const priceB = b.price ?? 0;
        const seatsA = a.booked_seats ?? 0;
        const seatsB = b.booked_seats ?? 0;

        if (filters.sortBy === 'price-low') return priceA - priceB;
        if (filters.sortBy === 'price-high') return priceB - priceA;
        if (filters.sortBy === 'popularity') return seatsB - seatsA;
        return new Date(a.date).getTime() - new Date(b.date).getTime(); // Default: Date Soonest
    });

    // EventCard component extracted to src/components/EventCard.tsx


    const EventSection = ({ title, events, icon: Icon }: { title: string, events: Event[], icon: React.ElementType }) => {
        const scrollContainerRef = useRef<HTMLDivElement>(null);

        const scroll = (direction: 'left' | 'right') => {
            if (scrollContainerRef.current) {
                const scrollAmount = 320; // Card width + gap
                const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
                scrollContainerRef.current.scrollTo({
                    left: newScrollLeft,
                    behavior: 'smooth'
                });
            }
        };

        if (events.length === 0) return null;

        return (
            <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Icon size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{events.length} events</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                            aria-label="Scroll left"
                        >
                            <ArrowRight size={18} className="rotate-180" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                            aria-label="Scroll right"
                        >
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Horizontal Scrolling Container */}
                <div className="relative group">
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                    >
                        {events.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </div>
            </section>
        );
    };



    return (
        <div className={`min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300 ${isSidebarOpen ? 'overflow-hidden' : ''}`}>
            <LocationModal />
            <HomeSidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                user={user}
                profile={profile}
                signOut={signOut}
                theme={theme}
                toggleTheme={toggleTheme}
            />

            {/* Navbar */}
            <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between">
                        <Link to="/home" className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mr-8">
                            CollegeEvents
                        </Link>

                        {/* Location Selector */}
                        <div className="flex flex-col cursor-pointer mr-auto" onClick={() => setIsLocationModalOpen(true)}>
                            <div className="flex items-center gap-1 text-gray-900 dark:text-white font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                <span className="text-sm">{selectedLocation || 'Select Location'}</span>
                                <ChevronDown size={14} className="text-indigo-600" />
                            </div>
                        </div>

                        {/* Search Bar - Desktop */}
                        <div className="hidden md:flex flex-1 max-w-md mx-8">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex items-center gap-6">
                                {/* Advanced Filter Button */}
                                <button
                                    onClick={() => setIsFilterModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                                >
                                    <Filter size={18} />
                                    Filters
                                    {(filters.categories.length > 0 || filters.date !== 'all' || filters.priceRange !== 'all') && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                    )}
                                </button>

                                <NotificationDropdown />
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                                    aria-label="Toggle Dark Mode"
                                >
                                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                </button>
                                {user ? (
                                    <>
                                        {profile?.role === 'admin' && (
                                            <Link to="/admin" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Admin Panel</Link>
                                        )}
                                        {profile?.role === 'college' && (
                                            <Link to="/college" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Organizer Dashboard</Link>
                                        )}
                                        {profile?.role === 'student' && (
                                            <Link to="/my-bookings" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                                                <Ticket size={16} />
                                                My Bookings
                                            </Link>
                                        )}
                                        <Link to="/wishlist" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                                            <Heart size={16} />
                                            Wishlist
                                        </Link>
                                        <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-none">{profile?.full_name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">{profile?.role}</p>
                                            </div>
                                            <button
                                                onClick={signOut}
                                                className="text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <Link to="/login" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Sign In</Link>
                                        <Link
                                            to="/register"
                                            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                                        >
                                            Register
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Hamburger Menu Button */}
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <Menu size={28} />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Search */}
                    <div className="md:hidden pb-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <button
                                onClick={() => setIsFilterModalOpen(true)}
                                className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                            >
                                <Filter size={18} />
                                Advanced Filters
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden py-12 lg:py-16">

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
                            Book Your Next College Adventure
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                            The ultimate platform for discovering and booking technical workshops, cultural fests, and sports tournaments in your college.
                        </p>
                    </div>
                </div>
            </div>

            {/* Events Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <FilterModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    filters={filters}
                    setFilters={setFilters}
                    onApply={() => setIsFilterModalOpen(false)}
                    onClear={() => setFilters({
                        date: 'all',
                        priceRange: 'all',
                        categories: [],
                        sortBy: 'date'
                    })}
                />

                {/* Active Filters Display */}
                {(searchTerm || filters.categories.length > 0 || filters.date !== 'all' || filters.priceRange !== 'all') && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {filters.categories.map(cat => (
                            <span key={cat} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold flex items-center gap-1">
                                {cat}
                                <X
                                    size={12}
                                    className="cursor-pointer"
                                    onClick={() => setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }))}
                                />
                            </span>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="space-y-12">
                        {[1, 2].map((section) => (
                            <div key={section} className="mb-12">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-lg" />
                                        <div>
                                            <Skeleton className="h-6 w-48 mb-1" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <div className="hidden md:flex gap-2">
                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                    </div>
                                </div>
                                <div className="flex gap-6 overflow-hidden">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex-none w-[280px] sm:w-[300px] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
                                            <Skeleton className="h-44 w-full" />
                                            <div className="p-5 flex flex-col flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Skeleton className="h-3 w-3 rounded-full" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                                <Skeleton className="h-6 w-3/4 mb-2" />
                                                <Skeleton className="h-4 w-full mb-2" />
                                                <Skeleton className="h-4 w-2/3 mb-4" />
                                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between mt-auto">
                                                    <div className="flex items-center gap-2">
                                                        <Skeleton className="h-3 w-3 rounded-full" />
                                                        <Skeleton className="h-3 w-20" />
                                                    </div>
                                                    <Skeleton className="h-4 w-12" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : searchTerm || filters.categories.length > 0 || filters.date !== 'all' || filters.priceRange !== 'all' || filters.sortBy !== 'date' ? (
                    <>
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-2xl font-black flex items-center gap-3 text-gray-900 dark:text-white">
                                <Search className="text-indigo-500" />
                                Search Results
                            </h2>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-bold">
                                {filteredEvents.length} events found
                            </div>
                        </div>
                        {filteredEvents.length === 0 ? (
                            <EmptyState
                                icon={Search}
                                title="No events found"
                                description="We couldn't find any events matching your search. Try adjusting your filters or search terms."
                                action={{
                                    label: "Clear Filters",
                                    onClick: () => {
                                        setSearchTerm('');
                                        setFilters({
                                            date: 'all',
                                            priceRange: 'all',
                                            categories: [],
                                            sortBy: 'date'
                                        });
                                    }
                                }}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredEvents.map((event) => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                        )}
                    </>
                ) : events.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="No events available"
                        description="There are currently no upcoming events. Please check back later."
                        className="mt-12"
                    />
                ) : (
                    <>
                        <EventSection title="Upcoming Events" events={categories.upcoming} icon={Calendar} />
                        <EventSection title="Free Events" events={categories.free} icon={Ticket} />
                        <EventSection title="Top Rated Events" events={categories.topRated} icon={TrendingUp} />

                        {/* Nearest College Events - Mocked as Recommended for now */}
                        <EventSection title="Nearest College Events" events={categories.all.filter(e => new Date(e.date) > new Date()).slice(0, 4)} icon={MapPin} />

                        {/* Past Events */}
                        {categories.past.length > 0 && (
                            <section className="mb-12">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                        <History size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-400 dark:text-gray-500">Past Events</h2>
                                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{categories.past.length} events · Registration closed</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <div
                                        className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {categories.past.map(event => (
                                            <div key={event.id} className="flex-none w-[280px] sm:w-[300px] opacity-60 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-300">
                                                <EventCard event={event} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 py-12 transition-colors">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">© 2024 CollegeEvents Platform. Built for Students, by Students.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
