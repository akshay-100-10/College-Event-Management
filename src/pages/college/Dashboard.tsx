import { useEffect, useState, useRef } from 'react';
import { Routes, Route, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { compressImage, validateImage } from '../../utils/imageOptimization';

// Fix for default marker icons in React Leaflet (common issue)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import {
    Plus,
    Calendar,
    MapPin,
    Users,
    Clock,
    XCircle,
    LayoutDashboard,
    TrendingUp,
    Download,
    Eye,
    MoreVertical,
    Map,
    Trash,
    LogOut,
    Search,
    Upload,
    Image as ImageIcon,
    X,
    Edit,
    ExternalLink,
    CheckCircle2,
    Sparkles
} from 'lucide-react';

const createIcon = () => {
    return L.icon({
        iconUrl: icon,
        shadowUrl: iconShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
    });
};
import CollegeSidebar from '../../components/college/Sidebar';
import type { Event, SubEvent, Booking } from '../../types';

const CollegeDashboard = () => {
    const { profile, signOut } = useAuth();
    const [searchParams] = useSearchParams();
    const [events, setEvents] = useState<Event[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false); // Start false, only true when fetching
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (searchParams.get('action') === 'create') {
            resetForm();
            setShowCreateModal(true);
        }
    }, [searchParams]);

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showAttendeesModal, setShowAttendeesModal] = useState(false);
    const [attendees, setAttendees] = useState<Booking[]>([]);
    const [fetchingAttendees, setFetchingAttendees] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // External registrations for verification
    interface ExtReg {
        id: string;
        status: string;
        created_at: string;
        user_id: string;
        event_id: string;
        profiles: { full_name: string; email: string };
        events: { title: string };
    }
    const [extRegs, setExtRegs] = useState<ExtReg[]>([]);

    // AI description generator (synchronous template-based, no network call)

    const generateDescription = () => {
        const title = formData.title.trim();
        if (!title) { alert('Please enter an Event Title first.'); return; }

        const d = formData.date ? new Date(formData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'an upcoming date';
        const v = formData.venue || 'our campus';
        const cat = (formData.category || 'General').toLowerCase();

        const templates: Record<string, string[]> = {
            technical: [
                `Get ready to dive deep into innovation at ${title}! This exciting technical event is your gateway to cutting-edge technologies, hands-on workshops, and live demonstrations that will expand your knowledge and skills. Join us at ${v} on ${d} and connect with fellow tech enthusiasts, industry experts, and future innovators. Don't miss your chance to be part of something extraordinary!`,
                `${title} is the ultimate destination for curious minds and aspiring technologists! Explore the latest trends in technology through engaging sessions, competitions, and networking opportunities at ${v} on ${d}. Whether you're a beginner or a seasoned coder, this event has something incredible in store for you. Register now and fuel your passion for technology!`,
                `Mark your calendars for ${title} — a premier technical showcase happening at ${v} on ${d}! Experience inspiring talks, challenging hackathons, and interactive demos that will push the limits of your imagination. This is the event that every tech-driven student has been waiting for. Come, learn, build, and conquer!`,
            ],
            cultural: [
                `Experience the magic of culture and creativity at ${title}! Held at ${v} on ${d}, this vibrant celebration brings together talented performers, artists, and culture enthusiasts from across the campus. From mesmerizing dance performances to electrifying music, every moment promises to be unforgettable. Come celebrate the rich tapestry of our college's cultural spirit!`,
                `${title} is where art, music, and tradition come alive! Join us at ${v} on ${d} for an exhilarating cultural extravaganza featuring performances, competitions, and showcases that will leave you spellbound. This is your opportunity to witness extraordinary talent and be part of a celebration that truly brings our campus community together.`,
                `Unleash your creativity and celebrate the spirit of culture at ${title}, happening on ${d} at ${v}! From dazzling performances to stunning art exhibitions, this event is a testament to the incredible talent within our college. Immerse yourself in an evening of joy, colour, and shared heritage — an experience you'll cherish forever!`,
            ],
            sports: [
                `The competition heats up at ${title}! Join us at ${v} on ${d} for an adrenaline-packed sporting event that celebrates teamwork, determination, and athletic excellence. Cheer for your favourite teams, witness breathtaking moments, and feel the electrifying energy that only great sports can deliver. Gear up — it's going to be epic!`,
                `${title} is the ultimate sporting showdown you've been waiting for! Taking place at ${v} on ${d}, this event promises fierce competition, jaw-dropping performances, and unforgettable highlights. Whether you're competing or cheering from the stands, the passion and spirit of sportsmanship will inspire you. Come be part of the action!`,
                `Step onto the field and feel the thrill at ${title}! On ${d} at ${v}, athletes and sports lovers will come together for a high-energy event filled with competitive spirit, camaraderie, and moments of pure brilliance. This is your chance to witness the best of college sports live — come out, cheer loud, and make memories that last!`,
            ],
            workshop: [
                `Level up your skills at ${title} — a focused, hands-on workshop at ${v} on ${d}! Guided by experts and industry professionals, you'll gain practical knowledge and techniques you can apply immediately. Limited seats are available, so register early and take the next step in your learning journey with this immersive experience.`,
                `${title} is the workshop you can't afford to miss! Join us at ${v} on ${d} for an interactive, skill-building session designed to help you grow academically and professionally. Engage with real-world scenarios, receive expert feedback, and walk away with new capabilities that set you apart. Your future self will thank you!`,
                `Transform your potential at ${title} — a power-packed workshop happening at ${v} on ${d}! Dive into practical demonstrations, collaborative exercises, and expert-led discussions that will sharpen your skills and boost your confidence. Space is limited, so secure your spot today and invest in yourself!`,
            ],
            seminar: [
                `Gain deep insights and fresh perspectives at ${title}, a thought-provoking seminar at ${v} on ${d}! Industry leaders and academic experts will share ground-breaking ideas, research findings, and real-world experiences that will challenge and inspire you. Attend, engage, and walk away with knowledge that will shape your thinking and career.`,
                `${title} brings the brightest minds together for an enriching seminar experience at ${v} on ${d}! Explore cutting-edge topics through keynote addresses, panel discussions, and interactive Q&A sessions that encourage critical thinking and collaboration. This is a golden opportunity to learn from the best — don't let it pass!`,
                `Expand your horizons at ${title} — an inspiring seminar designed for curious and ambitious minds! Held at ${v} on ${d}, this event features expert speakers, enlightening discussions, and invaluable networking opportunities. Whether you're looking to deepen your expertise or explore a new field, this seminar is the perfect platform for you.`,
            ],
        };

        const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        const key = Object.keys(templates).find(k => cat.includes(k)) ?? 'general';
        const general = [
            `${title} is shaping up to be one of the most exciting events of the semester! Happening at ${v} on ${d}, this event is packed with engaging activities, interactive experiences, and incredible moments that you won't want to miss. Bring your friends, bring your enthusiasm, and get ready for a day that will be talked about long after it's over!`,
            `We're thrilled to invite you to ${title} — a special event taking place at ${v} on ${d}! This is a wonderful opportunity to come together as a college community, celebrate shared passions, and create lasting memories. With something for everyone, it promises to be a truly remarkable experience. Reserve your spot today!`,
            `${title} is the event of the season and you're invited! Join us at ${v} on ${d} for an unforgettable experience filled with energy, excitement, and incredible moments. Whether you come to participate, watch, or simply soak in the atmosphere, you're guaranteed to leave with a smile. We can't wait to see you there!`,
        ];

        const desc = templates[key] ? pick(templates[key]) : pick(general);
        setFormData(prev => ({ ...prev, description: desc }));
    };

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editEventId, setEditEventId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        location: '',
        category: 'Technical',
        total_seats: 100,
        price: 0,
        contact_phone: '',
        contact_email: '',
        brochure_url: '',
        registration_type: 'internal',
        external_registration_url: '',
        image_url: '',
        sub_events: [] as SubEvent[]
    });

    // Image upload state
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploadingImage, setUploadingImage] = useState(false);

    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    const detectLocation = () => {
        setIsDetectingLocation(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    setFormData({ ...formData, location: data.display_name });
                } catch (error) {
                    console.error("Error fetching address:", error);
                    setFormData({ ...formData, location: `${latitude}, ${longitude}` });
                } finally {
                    setIsDetectingLocation(false);
                }
            }, async (error) => {
                console.warn("Native geolocation failed, trying IP fallback...", error.message);

                // Fallback to IP-based location
                try {
                    const response = await fetch('https://ipapi.co/json/');
                    const data = await response.json();
                    if (data.city && data.country_name) {
                        setFormData(prev => ({
                            ...prev,
                            location: `${data.city}, ${data.region}, ${data.country_name}`
                        }));
                    } else {
                        throw new Error("Invalid IP location data");
                    }
                    setIsDetectingLocation(false);
                } catch (fallbackError) {
                    console.error("Fallback location also failed:", fallbackError);
                    setIsDetectingLocation(false);
                    alert("Could not detect location automatically. Please use the 'Pick on Map' button.");
                }
            }, {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 0
            });
        } else {
            setIsDetectingLocation(false);
            alert("Geolocation is not supported by your browser.");
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            date: '',
            time: '',
            venue: '',
            location: '',
            category: 'Technical',
            total_seats: 100,
            price: 0,
            contact_phone: '',
            contact_email: '',
            brochure_url: '',
            registration_type: 'internal',
            external_registration_url: '',
            image_url: '',
            sub_events: []
        });
        setSelectedImage(null);
        setImagePreview('');
        setIsEditing(false);
        setEditEventId(null);
    };

    const handleEditEvent = async (event: Event) => {
        setIsEditing(true);
        setEditEventId(event.id);

        // Fetch sub-events
        const { data: subEvents } = await supabase
            .from('sub_events')
            .select('*')
            .eq('event_id', event.id);

        setFormData({
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            venue: event.venue,
            location: event.location,
            category: event.category,
            total_seats: event.total_seats,
            price: event.price,
            contact_phone: event.contact_phone || '',
            contact_email: event.contact_email || '',
            brochure_url: event.brochure_url || '',
            registration_type: event.registration_type || 'internal',
            external_registration_url: event.external_registration_url || '',
            image_url: event.image_url || '',
            sub_events: (subEvents as SubEvent[]) || []
        });

        setImagePreview(event.image_url || '');
        setShowCreateModal(true);
    };


    // Handle image selection with automatic compression
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate image
        const validation = validateImage(file);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        try {
            // Show preview immediately
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Compress image (this happens in background)
            const compressed = await compressImage(file, {
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 0.8,
                format: 'webp'
            });

            setSelectedImage(compressed);
            console.log(`Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressed.size / 1024).toFixed(2)}KB`);
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Failed to process image. Please try another file.');
        }
    };

    // Remove selected image
    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview('');
    };



    const LocationPicker = ({ onLocationSelect, initialLocation }: { onLocationSelect: (address: string) => void, initialLocation?: string }) => {
        const mapRef = useRef<HTMLDivElement>(null);
        const mapInstance = useRef<any>(null);
        const markerRef = useRef<any>(null);
        const [searchQuery, setSearchQuery] = useState('');
        const [isSearching, setIsSearching] = useState(false);
        const [suggestions, setSuggestions] = useState<any[]>([]);
        const [showSuggestions, setShowSuggestions] = useState(false);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (showSuggestions && !(event.target as HTMLElement).closest('.location-search-container')) {
                    setShowSuggestions(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [showSuggestions]);

        useEffect(() => {
            if (mapRef.current && !mapInstance.current) {
                mapInstance.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(mapInstance.current);

                mapInstance.current.on('click', async (e: any) => {
                    const { lat, lng } = e.latlng;
                    updateMarkerAndLocation(lat, lng);
                });

                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition((position) => {
                        const { latitude, longitude } = position.coords;
                        // Guard: component may have unmounted by the time callback fires
                        if (mapInstance.current) {
                            mapInstance.current.setView([latitude, longitude], 13);
                        }
                    });
                }

                setTimeout(() => {
                    mapInstance.current?.invalidateSize();
                }, 100);
            }
            return () => {
                if (mapInstance.current) {
                    mapInstance.current.remove();
                    mapInstance.current = null;
                }
            };
        }, []);

        // Track the last geocoded location to avoid duplicate Nominatim calls
        // (React StrictMode double-invokes effects in dev, causing 429 spam)
        const lastSyncedLocation = useRef('');

        useEffect(() => {
            if (initialLocation && initialLocation.length > 5 && mapInstance.current) {
                // Skip if we already queried for this exact location string
                if (lastSyncedLocation.current === initialLocation) return;
                lastSyncedLocation.current = initialLocation;

                const syncMap = async () => {
                    try {
                        const response = await fetch(
                            `/nominatim/search?format=json&q=${encodeURIComponent(initialLocation)}&limit=1`,
                            { headers: { 'Accept': 'application/json' } }
                        );
                        if (!response.ok) return;
                        const data = await response.json();
                        if (!mapInstance.current) return;
                        if (data && data.length > 0) {
                            const { lat, lon } = data[0];
                            const newLat = parseFloat(lat);
                            const newLng = parseFloat(lon);
                            const currentCenter = mapInstance.current.getCenter();
                            const dist = Math.sqrt(Math.pow(currentCenter.lat - newLat, 2) + Math.pow(currentCenter.lng - newLng, 2));
                            if (dist > 0.01) {
                                mapInstance.current.setView([newLat, newLng], 15);
                                if (markerRef.current) {
                                    markerRef.current.setLatLng([newLat, newLng]);
                                } else {
                                    markerRef.current = L.marker([newLat, newLng], { icon: createIcon() }).addTo(mapInstance.current);
                                }
                            }
                        }
                    } catch {
                        // Nominatim may fail — map stays at default
                    }
                };
                syncMap();
            }
        }, [initialLocation]);

        useEffect(() => {
            const timer = setTimeout(async () => {
                if (searchQuery.length > 2 && showSuggestions) {
                    try {
                        const response = await fetch(`/nominatim/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
                        const data = await response.json();
                        setSuggestions(data);
                    } catch (error) {
                        console.error("Error fetching suggestions:", error);
                    }
                } else {
                    setSuggestions([]);
                }
            }, 500);
            return () => clearTimeout(timer);
        }, [searchQuery, showSuggestions]);

        const updateMarkerAndLocation = async (lat: number, lng: number) => {
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                markerRef.current = L.marker([lat, lng], { icon: createIcon() }).addTo(mapInstance.current);
            }
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                onLocationSelect(data.display_name || `${lat}, ${lng}`);
            } catch (error) {
                console.error("Error reverse geocoding:", error);
                onLocationSelect(`${lat}, ${lng}`);
            }
        };

        const selectLocation = (location: any) => {
            const { lat, lon, display_name } = location;
            const newLat = parseFloat(lat);
            const newLng = parseFloat(lon);
            mapInstance.current.setView([newLat, newLng], 15);
            if (markerRef.current) {
                markerRef.current.setLatLng([newLat, newLng]);
            } else {
                markerRef.current = L.marker([newLat, newLng], { icon: createIcon() }).addTo(mapInstance.current);
            }
            onLocationSelect(display_name);
            setSearchQuery(display_name);
            setShowSuggestions(false);
        };

        const handleSearch = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!searchQuery.trim()) return;
            setIsSearching(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
                const data = await response.json();
                if (data && data.length > 0) {
                    selectLocation(data[0]);
                } else {
                    alert("Location not found");
                }
            } catch (error) {
                console.error("Error searching location:", error);
                alert("Error searching location");
            } finally {
                setIsSearching(false);
            }
        };

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center relative">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest ml-1">Pick Location</p>
                    <div className="flex gap-2 w-full max-w-xs relative location-search-container">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search city, place..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearch(e);
                                    }
                                }}
                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[1000] max-h-48 overflow-y-auto">
                                    {suggestions.map((loc, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => selectLocation(loc)}
                                            className="w-full text-left px-3 py-2 text-[10px] hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                        >
                                            {loc.display_name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 h-fit"
                        >
                            <Search size={14} />
                        </button>
                    </div>
                </div>
                <div ref={mapRef} className="h-64 w-full rounded-2xl border border-gray-200 overflow-hidden z-0 shadow-inner" />
            </div>
        );
    };

    const [showMapPicker, setShowMapPicker] = useState(false);

    useEffect(() => {
        if (profile) {
            fetchDashboardData();
        }
    }, [profile]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*')
                .eq('organizer_id', profile?.id)
                .order('created_at', { ascending: false });

            if (eventsError) throw eventsError;
            setEvents(eventsData || []);

            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select(`
                    id,
                    event_id,
                    user_id,
                    profiles:user_id (full_name, email),
                    events!inner (title, organizer_id)
                `)
                .eq('events.organizer_id', profile?.id);

            if (bookingsError) throw bookingsError;
            setBookings((bookingsData as any) || []);

            // Fetch external (Google Form) self-reported registrations
            const myEventIds = (eventsData || []).map(e => e.id);
            if (myEventIds.length > 0) {
                const { data: extData, error: extError } = await supabase
                    .from('external_registrations')
                    .select(`
                        id, status, created_at, user_id, event_id,
                        profiles!external_registrations_profile_fk (full_name, email),
                        events (title)
                    `)
                    .in('event_id', myEventIds)
                    .order('created_at', { ascending: false });
                if (!extError) setExtRegs((extData as unknown as ExtReg[]) || []);
            }
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendees = async (eventId: string) => {
        setFetchingAttendees(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    created_at,
                    profiles:user_id (full_name, email)
                `)
                .eq('event_id', eventId);

            if (error) throw error;
            setAttendees((data as any) || []);
        } catch (err: any) {
            console.error('Error fetching attendees:', err.message);
        } finally {
            setFetchingAttendees(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let imageUrl = formData.image_url; // Use existing URL by default

            // 1. Upload image if selected (compressed image is already ready!)
            if (selectedImage) {
                setUploadingImage(true);
                const fileExt = 'webp'; // We always convert to webp
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `event-images/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('event-images')
                    .upload(filePath, selectedImage);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw new Error('Failed to upload image');
                }

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('event-images')
                    .getPublicUrl(filePath);

                imageUrl = urlData.publicUrl;
                setUploadingImage(false);
            }

            let eventId = editEventId;

            if (isEditing && eventId) {
                // Update Event
                const { error: updateError } = await supabase
                    .from('events')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        date: formData.date,
                        time: formData.time,
                        venue: formData.venue,
                        location: formData.location,
                        category: formData.category,
                        total_seats: formData.total_seats,
                        price: formData.price,
                        contact_phone: formData.contact_phone,
                        contact_email: formData.contact_email,
                        brochure_url: formData.brochure_url,
                        registration_type: formData.registration_type,
                        external_registration_url: formData.external_registration_url,
                        image_url: imageUrl,
                    })
                    .eq('id', eventId);

                if (updateError) throw updateError;

                // Delete existing sub-events to replace with new ones
                const { error: deleteSubError } = await supabase
                    .from('sub_events')
                    .delete()
                    .eq('event_id', eventId);

                if (deleteSubError) {
                    console.error("Error deleting old sub-events:", deleteSubError);
                }

            } else {
                // Create Main Event
                const { data: newEvent, error: eventError } = await supabase
                    .from('events')
                    .insert([
                        {
                            title: formData.title,
                            description: formData.description,
                            date: formData.date,
                            time: formData.time,
                            venue: formData.venue,
                            location: formData.location,
                            category: formData.category,
                            total_seats: formData.total_seats,
                            price: formData.price,
                            contact_phone: formData.contact_phone,
                            contact_email: formData.contact_email,
                            brochure_url: formData.brochure_url,
                            registration_type: formData.registration_type,
                            external_registration_url: formData.external_registration_url,
                            image_url: imageUrl,
                            organizer_id: profile?.id,
                            status: 'pending'
                        }
                    ])
                    .select()
                    .single();

                if (eventError) throw eventError;
                eventId = newEvent.id;
            }

            // 3. Create Sub Events if any
            if (formData.sub_events.length > 0 && eventId) {
                // Helper: combine an event date with a HH:MM time string → full ISO timestamp
                const toISO = (date: string, time: string) => {
                    if (!date || !time) return time || null;
                    // "17:00" → "2025-03-15T17:00:00" (no tz offset → Postgres stores as UTC)
                    return `${date}T${time}:00`;
                };

                const subEventsData = formData.sub_events.map(se => ({
                    event_id: eventId,
                    title: se.title,
                    description: se.description,
                    start_time: toISO(formData.date, se.start_time),
                    end_time: toISO(formData.date, se.end_time),
                    venue: se.venue || formData.venue,
                    price: se.price,
                    total_seats: se.total_seats,
                    requires_registration: se.requires_registration
                }));

                const { error: subError } = await supabase
                    .from('sub_events')
                    .insert(subEventsData);

                if (subError) {
                    console.error("Error creating/updating sub-events:", subError);
                    alert("Event saved but failed to save sub-events.");
                }
            }

            setShowCreateModal(false);
            fetchDashboardData();
            resetForm();

        } catch (err: any) {
            setUploadingImage(false);
            alert(err.message);
        }
    };

    const openAttendeesModal = (event: Event) => {
        setSelectedEvent(event);
        fetchAttendees(event.id);
        setShowAttendeesModal(true);
    };

    const exportAttendeesCSV = () => {
        if (!attendees.length || !selectedEvent) return;

        const headers = ['Student Name', 'Email', 'Booking Date'];
        const csvData = attendees.map((a: any) => [
            `"${a.profiles?.full_name || 'Unknown'}"`,
            `"${a.profiles?.email || 'N/A'}"`,
            `"${a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}"`
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedEvent.title.replace(/\s+/g, '_')}_attendees.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="relative">
                    <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-indigo-600 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full border-r-4 border-l-4 border-purple-600 animate-spin-slow"></div>
                    </div>
                </div>
            </div>
        );
    }


    const totalRevenue = events.reduce((acc, curr) => acc + (curr.booked_seats * curr.price), 0);
    const totalBookings = events.reduce((acc, curr) => acc + curr.booked_seats, 0);
    const pendingApprovals = events.filter(e => e.status === 'pending').length;

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">We couldn't load your profile information. Please try signing in again.</p>
                    <button onClick={signOut} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-colors">
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row relative overflow-hidden transition-colors duration-300">
            <CollegeSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Header - Mobile */}
                <header className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between sticky top-0 z-40 transition-colors">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xl">
                        <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <LayoutDashboard className="text-white h-4 w-4" />
                        </div>
                        <span>Creator</span>
                    </div>
                    <button onClick={signOut} className="text-xs font-bold text-gray-500 dark:text-gray-400">Sign Out</button>
                </header>

                <div className="p-6 sm:p-10 max-w-6xl mx-auto">
                    <Routes>
                        <Route path="*" element={
                            <>
                                {/* Welcome & Quick Action */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                    <div>
                                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
                                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Welcome back, {profile?.full_name?.split(' ')[0]}!</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                        <Link
                                            to="/home"
                                            className="w-full sm:w-auto bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 font-black hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600"
                                        >
                                            <LogOut size={20} />
                                            Exit Dashboard
                                        </Link>
                                        <button
                                            onClick={() => {
                                                resetForm();
                                                setShowCreateModal(true);
                                            }}
                                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 font-black shadow-2xl shadow-indigo-500/40 transform hover:-translate-y-1 active:translate-y-0"
                                        >
                                            <Plus size={24} />
                                            Create New Event
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all group">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                                            <Calendar size={24} />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest">Total Events</p>
                                        <h3 className="text-3xl font-black mt-1 text-gray-900 dark:text-white">{events.length}</h3>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-700 hover:border-green-500/30 dark:hover:border-green-500/30 transition-all group">
                                        <div className="h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 mb-4 group-hover:scale-110 transition-transform">
                                            <Users size={24} />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest">Total Bookings</p>
                                        <h3 className="text-3xl font-black mt-1 text-gray-900 dark:text-white">{totalBookings}</h3>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-700 hover:border-yellow-500/30 dark:hover:border-yellow-500/30 transition-all group">
                                        <div className="h-12 w-12 rounded-2xl bg-yellow-50 dark:bg-yellow-500/20 flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-4 group-hover:scale-110 transition-transform">
                                            <Clock size={24} />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest">Pending</p>
                                        <h3 className="text-3xl font-black mt-1 text-gray-900 dark:text-white">{pendingApprovals}</h3>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-700 hover:border-purple-500/30 dark:hover:border-purple-500/30 transition-all group">
                                        <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                                            <TrendingUp size={24} />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest">Revenue</p>
                                        <h3 className="text-3xl font-black mt-1 text-gray-900">₹{totalRevenue.toLocaleString()}</h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    {/* Events List */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="text-2xl font-black flex items-center gap-3 text-gray-900 dark:text-gray-100">
                                                <Calendar className="text-indigo-600 dark:text-indigo-400" />
                                                Your Events
                                            </h2>
                                            <Link to="/college/events" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">View All</Link>
                                        </div>

                                        {events.length === 0 ? (
                                            <div className="bg-white/30 dark:bg-gray-800/30 rounded-3xl border border-gray-200 dark:border-gray-700 border-dashed p-20 text-center">
                                                <Calendar size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-6" />
                                                <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500">No events found</h3>
                                                <p className="text-gray-500 dark:text-gray-400 mt-2">Start by creating your first event!</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {events.slice(0, 3).map((event) => (
                                                    <div key={event.id} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-all group">
                                                        <div className="flex flex-col sm:flex-row justify-between gap-6">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${event.status === 'approved'
                                                                        ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20'
                                                                        : event.status === 'pending'
                                                                            ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20'
                                                                            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                                                                        }`}>
                                                                        {event.status}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">{event.category}</span>
                                                                </div>
                                                                <h3 className="text-xl font-black mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{event.title}</h3>
                                                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                                        {new Date(event.date).toLocaleDateString()}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <MapPin size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                                        {event.venue}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                                        {event.booked_seats} / {event.total_seats}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex sm:flex-col justify-between items-end gap-4">
                                                                <div className="text-right">
                                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Price</p>
                                                                    <p className="text-lg font-black text-gray-900 dark:text-white">{event.price === 0 ? 'FREE' : `₹${event.price}`}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => openAttendeesModal(event)}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl text-xs font-bold transition-all border border-gray-200 dark:border-gray-600"
                                                                >
                                                                    <Eye size={14} />
                                                                    Attendees
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditEvent(event)}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-500/20"
                                                                >
                                                                    <Edit size={14} />
                                                                    Edit
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-black flex items-center gap-3 text-gray-900 dark:text-white">
                                            <TrendingUp className="text-indigo-600 dark:text-indigo-400" />
                                            Recent Bookings
                                        </h2>

                                        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            {bookings.length === 0 ? (
                                                <div className="p-10 text-center">
                                                    <Users size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No recent bookings</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {bookings.map((booking: any) => (
                                                        <div key={booking.id} className="p-5 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                                                                    {booking.profiles?.full_name?.[0] || '?'}
                                                                </div>
                                                                <div className="flex-1 overflow-hidden">
                                                                    <p className="font-bold text-sm truncate text-gray-900 dark:text-white">{booking.profiles?.full_name || 'Unknown'}</p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">booked {booking.events?.title}</p>
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold whitespace-nowrap">
                                                                    {new Date(booking.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <Link to="/college/attendees" className="w-full py-4 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 bg-white/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 transition-colors text-center block">
                                                VIEW ALL ACTIVITY
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* ── External Registration Verification Panel ─────── */}
                                {extRegs.length > 0 && (
                                    <div className="mt-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <ExternalLink size={20} className="text-indigo-600 dark:text-indigo-400" />
                                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">External Registrations</h2>
                                            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                                {extRegs.filter(r => r.status === 'self_reported').length} Pending
                                            </span>
                                        </div>
                                        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {extRegs.map((reg) => (
                                                    <div key={reg.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                                                            {reg.profiles?.full_name?.[0] || '?'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{reg.profiles?.full_name || 'Unknown'}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{reg.profiles?.email}</p>
                                                            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5 font-medium truncate">📅 {reg.events?.title}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {reg.status === 'self_reported' ? (
                                                                <>
                                                                    <button
                                                                        onClick={async () => {
                                                                            await supabase.from('external_registrations').update({ status: 'verified' }).eq('id', reg.id);
                                                                            setExtRegs(prev => prev.map(r => r.id === reg.id ? { ...r, status: 'verified' } : r));
                                                                        }}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl text-xs font-bold transition-colors"
                                                                    >
                                                                        <CheckCircle2 size={13} /> Verify
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            await supabase.from('external_registrations').update({ status: 'rejected' }).eq('id', reg.id);
                                                                            setExtRegs(prev => prev.map(r => r.id === reg.id ? { ...r, status: 'rejected' } : r));
                                                                        }}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold transition-colors"
                                                                    >
                                                                        <XCircle size={13} /> Reject
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${reg.status === 'verified'
                                                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                                                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                                                    }`}>
                                                                    {reg.status === 'verified' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                                                    {reg.status === 'verified' ? 'Verified' : 'Rejected'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        } />
                        <Route path="/events" element={
                            <div className="space-y-8">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">My Events</h2>
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            setShowCreateModal(true);
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-bold shadow-lg shadow-indigo-500/30"
                                    >
                                        <Plus size={20} />
                                        Create Event
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    {events.map((event) => (
                                        <div key={event.id} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-all group">
                                            <div className="flex flex-col sm:flex-row justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${event.status === 'approved'
                                                            ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20'
                                                            : event.status === 'pending'
                                                                ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20'
                                                                : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                                                            }`}>
                                                            {event.status}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">{event.category}</span>
                                                    </div>
                                                    <h3 className="text-xl font-black mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{event.title}</h3>
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                            {new Date(event.date).toLocaleDateString()}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                            {event.venue}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                            {event.booked_seats} / {event.total_seats}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => openAttendeesModal(event)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl text-xs font-bold transition-all border border-gray-200 dark:border-gray-600"
                                                    >
                                                        <Eye size={14} />
                                                        Attendees
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditEvent(event)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-500/20"
                                                    >
                                                        <Edit size={14} />
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        } />
                        <Route path="/attendees" element={
                            <div className="space-y-8">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">All Attendees</h2>
                                    <Link to="/college" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition-all shadow-sm">
                                        <LogOut size={18} />
                                        Exit
                                    </Link>
                                </div>
                                <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">
                                                <th className="p-6">Student</th>
                                                <th className="p-6">Event</th>
                                                <th className="p-6">Booking Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {bookings.map((booking: any) => (
                                                <tr key={booking.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                                {booking.profiles?.full_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 dark:text-white">{booking.profiles?.full_name}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{booking.profiles?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 font-medium text-gray-700 dark:text-gray-300">{booking.events?.title}</td>
                                                    <td className="p-6 text-gray-500 dark:text-gray-400">{booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        } />
                        <Route path="/analytics" element={
                            <div className="space-y-8">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white">Analytics</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Revenue Overview</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 dark:text-gray-400">Total Revenue</span>
                                                <span className="text-2xl font-black text-green-600 dark:text-green-400">₹{totalRevenue.toLocaleString()}</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 w-[75%]"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Booking Rate</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 dark:text-gray-400">Total Bookings</span>
                                                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalBookings}</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 w-[60%]"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        } />

                    </Routes>
                </div>
            </main>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="min-h-screen w-full max-w-4xl mx-auto flex flex-col">
                        <div className="p-8 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{isEditing ? 'Edit Event' : 'Create New Event'}</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{isEditing ? 'Update event details.' : 'Fill in the details to submit for approval.'}</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="p-8 space-y-6 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Event Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        placeholder="e.g. Annual Tech Fest 2024"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Description</label>
                                        <button
                                            type="button"
                                            onClick={generateDescription}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border
                                                bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20
                                                text-violet-700 dark:text-violet-300
                                                border-violet-200 dark:border-violet-700
                                                hover:from-violet-100 hover:to-indigo-100 dark:hover:from-violet-900/40 dark:hover:to-indigo-900/40
                                                shadow-sm"
                                        >
                                            <Sparkles size={13} className="text-violet-500" />
                                            ✨ Generate with AI
                                        </button>
                                    </div>
                                    <textarea
                                        required
                                        rows={3}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        placeholder="Describe your event... or click ✨ Generate with AI above!"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                {/* Image Upload Section */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Event Image (Optional)
                                    </label>

                                    {!imagePreview ? (
                                        <label className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                                className="hidden"
                                            />
                                            <Upload className="w-12 h-12 text-gray-400 group-hover:text-indigo-500 mb-3 transition-colors" />
                                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                PNG, JPG, WebP up to 10MB (will be auto-compressed)
                                            </p>
                                        </label>
                                    ) : (
                                        <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                                            <img
                                                src={imagePreview}
                                                alt="Event preview"
                                                className="w-full h-64 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                                            >
                                                <X size={18} />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-white text-xs">
                                                    <ImageIcon size={16} />
                                                    <span>Image ready (compressed)</span>
                                                </div>
                                                <label className="cursor-pointer text-white text-xs font-bold hover:text-indigo-300 transition-colors">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageSelect}
                                                        className="hidden"
                                                    />
                                                    Change Image
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Venue (Specific Place)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        placeholder="e.g. Main Auditorium, Room 302"
                                        value={formData.venue}
                                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2 ml-1">
                                        <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Location (General Area)</label>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowMapPicker(!showMapPicker)}
                                                className={`text-[10px] font-black flex items-center gap-1 transition-colors uppercase tracking-widest ${showMapPicker ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                                            >
                                                <Map size={10} />
                                                {showMapPicker ? 'Hide Map' : 'Pick on Map'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={detectLocation}
                                                disabled={isDetectingLocation}
                                                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors uppercase tracking-widest disabled:opacity-50"
                                            >
                                                {isDetectingLocation ? (
                                                    <div className="h-2 w-2 border border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <MapPin size={10} />
                                                )}
                                                Detect
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        placeholder="City, College Campus, etc."
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                    {showMapPicker && (
                                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <LocationPicker
                                                onLocationSelect={(address) => setFormData({ ...formData, location: address })}
                                                initialLocation={formData.location}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700 appearance-none"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Technical">Technical</option>
                                        <option value="Cultural">Cultural</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Total Seats</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        value={formData.total_seats || ''}
                                        onChange={(e) => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        value={formData.price || ''}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Registration Type</label>
                                    <div className="flex gap-4 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, registration_type: 'internal' })}
                                            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${formData.registration_type === 'internal'
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            Book on Site
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, registration_type: 'external' })}
                                            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${formData.registration_type === 'external'
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            External Link (Google Form)
                                        </button>
                                    </div>

                                    {formData.registration_type === 'external' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <input
                                                type="url"
                                                required={formData.registration_type === 'external'}
                                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                                placeholder="https://forms.google.com/..."
                                                value={formData.external_registration_url}
                                                onChange={(e) => setFormData({ ...formData, external_registration_url: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2 border-t border-gray-100 dark:border-gray-800 pt-6 mt-2">
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4">Additional Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Contact Phone</label>
                                            <input
                                                type="tel"
                                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                                placeholder="+91 98765 43210"
                                                value={formData.contact_phone}
                                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Contact Email</label>
                                            <input
                                                type="email"
                                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                                placeholder="event@college.edu"
                                                value={formData.contact_email}
                                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Brochure URL</label>
                                            <input
                                                type="url"
                                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                                placeholder="https://example.com/brochure.pdf"
                                                value={formData.brochure_url}
                                                onChange={(e) => setFormData({ ...formData, brochure_url: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sub Events Section */}
                                <div className="md:col-span-2 pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Sub-Events</label>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({
                                                ...formData,
                                                sub_events: [...formData.sub_events, {
                                                    id: crypto.randomUUID(), event_id: '', booked_seats: 0,
                                                    title: '', description: '', start_time: '', end_time: '',
                                                    venue: '', price: 0, total_seats: 50, requires_registration: false
                                                }]
                                            })}
                                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-500/20"
                                        >
                                            <Plus size={14} /> Add Sub-event
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.sub_events.map((subEvent, index) => (
                                            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 relative group transition-all hover:bg-white dark:hover:bg-gray-700 hover:shadow-md">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newSubEvents = [...formData.sub_events];
                                                        newSubEvents.splice(index, 1);
                                                        setFormData({ ...formData, sub_events: newSubEvents });
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-900 text-gray-400 hover:text-red-500 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm transition-colors z-10"
                                                >
                                                    <Trash size={14} />
                                                </button>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="md:col-span-2">
                                                        <input
                                                            placeholder="Sub-event Title"
                                                            value={subEvent.title}
                                                            onChange={(e) => {
                                                                const newSubEvents = [...formData.sub_events];
                                                                newSubEvents[index].title = e.target.value;
                                                                setFormData({ ...formData, sub_events: newSubEvents });
                                                            }}
                                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block ml-1">Start Time</label>
                                                        <input
                                                            type="time"
                                                            value={subEvent.start_time}
                                                            onChange={(e) => {
                                                                const newSubEvents = [...formData.sub_events];
                                                                newSubEvents[index].start_time = e.target.value;
                                                                setFormData({ ...formData, sub_events: newSubEvents });
                                                            }}
                                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block ml-1">End Time</label>
                                                        <input
                                                            type="time"
                                                            value={subEvent.end_time}
                                                            onChange={(e) => {
                                                                const newSubEvents = [...formData.sub_events];
                                                                newSubEvents[index].end_time = e.target.value;
                                                                setFormData({ ...formData, sub_events: newSubEvents });
                                                            }}
                                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <input
                                                            placeholder="Venue (Leave blank if same as main)"
                                                            value={subEvent.venue}
                                                            onChange={(e) => {
                                                                const newSubEvents = [...formData.sub_events];
                                                                newSubEvents[index].venue = e.target.value;
                                                                setFormData({ ...formData, sub_events: newSubEvents });
                                                            }}
                                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block ml-1">Seats</label>
                                                        <input
                                                            type="number"
                                                            placeholder="Seats"
                                                            value={subEvent.total_seats}
                                                            onChange={(e) => {
                                                                const newSubEvents = [...formData.sub_events];
                                                                newSubEvents[index].total_seats = parseInt(e.target.value) || 0;
                                                                setFormData({ ...formData, sub_events: newSubEvents });
                                                            }}
                                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block ml-1">Price</label>
                                                        <input
                                                            type="number"
                                                            placeholder="Price"
                                                            value={subEvent.price}
                                                            onChange={(e) => {
                                                                const newSubEvents = [...formData.sub_events];
                                                                newSubEvents[index].price = parseFloat(e.target.value) || 0;
                                                                setFormData({ ...formData, sub_events: newSubEvents });
                                                            }}
                                                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 flex items-center gap-2 mt-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`reg-${index}`}
                                                            checked={subEvent.requires_registration}
                                                            onChange={(e) => {
                                                                const newSubEvents = [...formData.sub_events];
                                                                newSubEvents[index].requires_registration = e.target.checked;
                                                                setFormData({ ...formData, sub_events: newSubEvents });
                                                            }}
                                                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                        />
                                                        <label htmlFor={`reg-${index}`} className="text-sm font-bold text-gray-600 dark:text-gray-300 cursor-pointer">Requires Separate Registration</label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {formData.sub_events.length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                                                <p className="text-gray-400 dark:text-gray-500 text-sm font-bold">No sub-events added</p>
                                                <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Add workshops, competitions, etc.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-black py-4 rounded-2xl transition-all border border-gray-200 dark:border-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadingImage}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-2xl shadow-indigo-500/40 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {uploadingImage ? 'Uploading Image...' : (isEditing ? 'Update Event' : 'Submit for Approval')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attendees Modal */}
            {showAttendeesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Event Attendees</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{selectedEvent?.title}</p>
                            </div>
                            <button
                                onClick={() => setShowAttendeesModal(false)}
                                className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            {fetchingAttendees ? (
                                <div className="py-20 text-center">
                                    <div className="h-12 w-12 border-t-2 border-indigo-600 rounded-full animate-spin mx-auto"></div>
                                    <p className="mt-4 text-gray-500 font-bold">Loading attendees...</p>
                                </div>
                            ) : attendees.length === 0 ? (
                                <div className="py-20 text-center">
                                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-bold">No attendees yet for this event.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">
                                                <th className="pb-4 pl-2">Student</th>
                                                <th className="pb-4">Email</th>
                                                <th className="pb-4">Booking Date</th>
                                                <th className="pb-4 text-right pr-2">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {attendees.map((attendee: any) => (
                                                <tr key={attendee.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="py-4 pl-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                                                {attendee.profiles?.full_name?.[0] || '?'}
                                                            </div>
                                                            <span className="font-bold text-sm text-gray-900 dark:text-white">{attendee.profiles?.full_name || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-sm text-gray-500 dark:text-gray-400">{attendee.profiles?.email || 'N/A'}</td>
                                                    <td className="py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(attendee.created_at).toLocaleDateString()}</td>
                                                    <td className="py-4 text-right pr-2">
                                                        <button className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-4">
                            <button
                                onClick={exportAttendeesCSV}
                                disabled={attendees.length === 0}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-xl text-sm font-bold transition-all border border-gray-200 dark:border-gray-700"
                            >
                                <Download size={18} />
                                Export CSV
                            </button>
                            <button
                                onClick={() => setShowAttendeesModal(false)}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollegeDashboard;
