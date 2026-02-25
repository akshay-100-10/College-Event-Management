import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, BookOpen, Trophy, Info, Clock } from 'lucide-react';
import { useNotifications, type Notification } from '../context/NotificationContext';
import { Link } from 'react-router-dom';

const getIcon = (type: Notification['type']) => {
    switch (type) {
        case 'booking': return <BookOpen size={16} className="text-indigo-500" />;
        case 'achievement': return <Trophy size={16} className="text-yellow-500" />;
        case 'reminder': return <Clock size={16} className="text-orange-500" />;
        default: return <Info size={16} className="text-gray-500" />;
    }
};

const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

const NotificationDropdown = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className="relative p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                    <CheckCheck size={14} />
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                        {notifications.length === 0 ? (
                            <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
                                <Bell size={32} className="opacity-30" />
                                <p className="text-sm font-medium">All caught up!</p>
                                <p className="text-xs">No notifications yet.</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.read && markAsRead(n.id)}
                                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                                >
                                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-sm font-semibold truncate ${!n.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {n.title}
                                            </p>
                                            {!n.read && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500" />}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="py-2 px-4 border-t border-gray-100 dark:border-gray-800 text-center">
                            <Link
                                to="/notifications"
                                onClick={() => setOpen(false)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                            >
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
