import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Plus,
    Calendar,
    Users,
    TrendingUp,
    XCircle,
    Home,
    Menu,
    Moon,
    Sun,
    QrCode
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const CollegeSidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
    const { profile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();

    if (profile?.role !== 'college') return null;

    return (
        <>
            {/* Hover Trigger Zone */}
            {/* Trigger Button */}
            <button
                className="fixed top-6 right-6 z-[60] p-3 bg-white dark:bg-gray-900 rounded-xl shadow-lg shadow-indigo-500/10 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:scale-110 active:scale-95"
                onClick={() => setIsOpen(true)}
                onMouseEnter={() => setIsOpen(true)}
            >
                <Menu size={24} />
            </button>

            {/* Hover Sidebar */}
            <aside
                className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col z-[70] transition-all duration-500 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} shadow-2xl shadow-black/5`}
                onMouseLeave={() => setIsOpen(false)}
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-black text-2xl">
                            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <LayoutDashboard className="text-white h-5 w-5" />
                            </div>
                            <span>Creator</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <nav className="space-y-2">
                        <Link
                            to="/college?action=create"
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-4 bg-indigo-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-indigo-500/20 mb-6 hover:bg-indigo-500"
                        >
                            <Plus size={20} />
                            Create Event
                        </Link>

                        <Link to="/college" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold transition-all border border-indigo-200 dark:border-gray-700">
                            <LayoutDashboard size={20} />
                            Dashboard
                        </Link>
                        <Link to="/college/scanner" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-all">
                            <QrCode size={20} />
                            Ticket Scanner
                        </Link>
                        <Link to="/college/events" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-all">
                            <Calendar size={20} />
                            My Events
                        </Link>
                        <Link to="/college/attendees" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-all">
                            <Users size={20} />
                            Attendees
                        </Link>
                        <Link to="/college/analytics" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-all">
                            <TrendingUp size={20} />
                            Analytics
                        </Link>
                        <Link to="/home" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-all">
                            <Home size={20} />
                            Exit to Home
                        </Link>

                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-gray-200 dark:border-gray-800 space-y-4">
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

                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white">
                            {profile?.full_name?.[0] || 'C'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold truncate text-gray-900 dark:text-white">{profile?.full_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 text-gray-500 dark:text-gray-400 rounded-xl font-bold transition-all border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
};

export default CollegeSidebar;
