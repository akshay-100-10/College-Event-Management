import React, { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Mail, Check, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateICSFile, getGoogleCalendarUrl, getOutlookCalendarUrl } from '../utils/calendarUtils';

interface Event {
    id: string;
    title: string;
    description?: string;
    date: string;
    time: string;
    venue: string;
    location: string;
    category: string;
    price: number;
}

interface ShareEventButtonProps {
    event: Event;
}

export const ShareEventButton: React.FC<ShareEventButtonProps> = ({ event }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const eventUrl = `${window.location.origin}/event/${event.id}`;
    const shareText = `Check out this event: ${event.title}\n📅 ${event.date} at ${event.time}\n📍 ${event.venue}\n${eventUrl}`;

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(eventUrl);
            setCopied(true);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    const handleWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        setShowMenu(false);
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(`Event: ${event.title}`);
        const body = encodeURIComponent(shareText);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        setShowMenu(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-medium"
                aria-label="Share event"
                aria-expanded={showMenu}
            >
                <Share2 size={16} />
                <span className="hidden sm:inline">Share</span>
            </button>

            {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                        onClick={handleWhatsApp}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                        <span className="text-xl">💬</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp</span>
                    </button>

                    <button
                        onClick={handleEmail}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                        <Mail size={18} className="text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                    </button>

                    <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                        {copied ? (
                            <Check size={18} className="text-green-600 dark:text-green-400" />
                        ) : (
                            <Copy size={18} className="text-gray-600 dark:text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {copied ? 'Copied!' : 'Copy Link'}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};

interface AddToCalendarButtonProps {
    event: Event;
    bookingId?: string;
}

export const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({ event, bookingId }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const handleDownloadICS = () => {
        generateICSFile(event, bookingId);
        toast.success('Calendar file downloaded!');
        setShowMenu(false);
    };

    const handleGoogleCalendar = () => {
        window.open(getGoogleCalendarUrl(event), '_blank');
        setShowMenu(false);
    };

    const handleOutlookCalendar = () => {
        window.open(getOutlookCalendarUrl(event), '_blank');
        setShowMenu(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
                aria-label="Add to calendar"
                aria-expanded={showMenu}
            >
                <CalendarIcon size={16} />
                <span className="hidden sm:inline">Add to Calendar</span>
                <ChevronDown size={14} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                        onClick={handleGoogleCalendar}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                        <span className="text-xl">📅</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Google Calendar</span>
                    </button>

                    <button
                        onClick={handleOutlookCalendar}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                        <span className="text-xl">📧</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Outlook Calendar</span>
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                    <button
                        onClick={handleDownloadICS}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                        <CalendarIcon size={18} className="text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Download .ics file</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default { ShareEventButton, AddToCalendarButton };
