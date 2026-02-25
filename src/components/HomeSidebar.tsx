import { Link } from 'react-router-dom';
import {
    X,
    User as UserIcon,
    LogOut,
    Ticket,
    LayoutDashboard,
    ShieldCheck,
    Moon,
    Sun,
    Heart,
    Trophy,
    Edit3
} from 'lucide-react';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '../types';

interface HomeSidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    user: SupabaseUser | null;
    profile: Profile | null;
    signOut: () => void;
    theme: string;
    toggleTheme: () => void;
}

const HomeSidebar = ({ isOpen, setIsOpen, user, profile, signOut, theme, toggleTheme }: HomeSidebarProps) => {
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col z-[70] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} shadow-2xl`}
            >
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">
                        {(profile?.full_name || user?.user_metadata?.full_name)
                            ? `Hi, ${(profile?.full_name || user?.user_metadata?.full_name).split(' ')[0]}`
                            : 'Welcome!'}
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {/* User Profile */}
                    {(user || profile) ? (
                        <Link
                            to="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
                        >
                            {/* Avatar */}
                            <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                {profile?.avatar_url && ['🎓', '🏆', '🎵', '💡', '🚀', '🎨', '⚡', '🌟', '🦁', '🐉', '🎭', '🔥'].includes(profile.avatar_url)
                                    ? <span className="text-2xl">{profile.avatar_url}</span>
                                    : profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || <UserIcon size={24} />}
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="font-bold text-gray-900 dark:text-white truncate">
                                    {profile?.full_name || user?.user_metadata?.full_name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {profile?.email || user?.email}
                                </p>
                            </div>
                            <Edit3 size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                        </Link>
                    ) : (
                        <div className="mb-8 space-y-3">
                            <Link
                                to="/login"
                                className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-center rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="block w-full py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-center rounded-xl font-bold transition-colors"
                            >
                                Register
                            </Link>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <nav className="space-y-2">
                        {profile?.role === 'college' && (
                            <Link
                                to="/college"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-900 dark:text-white font-bold"
                            >
                                <LayoutDashboard size={20} />
                                College Dashboard
                            </Link>
                        )}
                        {profile?.role === 'admin' && (
                            <Link
                                to="/admin/dashboard"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-900 dark:text-white font-bold"
                            >
                                <ShieldCheck size={20} />
                                Admin Dashboard
                            </Link>
                        )}
                        {profile && (
                            <>
                                <Link
                                    to="/profile"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    <Edit3 size={20} />
                                    Edit Profile
                                </Link>
                                <Link
                                    to="/my-bookings"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    <Ticket size={20} />
                                    My Bookings
                                </Link>
                                <Link
                                    to="/leaderboard"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    <Trophy size={20} />
                                    Leaderboard
                                </Link>
                                <Link
                                    to="/wishlist"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    <Heart size={20} />
                                    Liked Events
                                </Link>
                            </>
                        )}
                    </nav>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
                    >
                        <span className="flex items-center gap-3">
                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </span>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    {(user || profile) && (
                        <button
                            onClick={() => {
                                signOut();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors"
                        >
                            <LogOut size={20} />
                            Sign Out
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default HomeSidebar;
