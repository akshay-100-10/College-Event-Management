import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Profile } from '../../types';
import { supabase } from '../../lib/supabase';
import {
    CheckCircle,
    XCircle,
    Clock,
    Users,
    Calendar,
    TrendingUp,
    ShieldCheck,
    Search,
    Trash2
} from 'lucide-react';

interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    location: string;
    category: string;
    total_seats: number;
    price: number;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    organizer_id: string;
    profiles: {
        full_name: string;
        email: string;
    };
}

interface Stats {
    totalEvents: number;
    pendingEvents: number;
    totalUsers: number;
    totalBookings: number;
}



const AdminDashboard = () => {
    const { profile, signOut } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [activeTab, setActiveTab] = useState<'events' | 'users'>('events');
    const [stats, setStats] = useState<Stats>({
        totalEvents: 0,
        pendingEvents: 0,
        totalUsers: 0,
        totalBookings: 0
    });
    const [loading, setLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*, profiles:organizer_id (full_name, email)')
                .order('created_at', { ascending: false });

            if (eventsError) throw eventsError;
            setEvents(eventsData || []);

            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;
            setUsers(usersData || []);

            const [
                { count: eventsCount },
                { count: pendingCount },
                { count: usersCount },
                { count: bookingsCount }
            ] = await Promise.all([
                supabase.from('events').select('*', { count: 'exact', head: true }),
                supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('bookings').select('*', { count: 'exact', head: true })
            ]);

            setStats({
                totalEvents: eventsCount || 0,
                pendingEvents: pendingCount || 0,
                totalUsers: usersCount || 0,
                totalBookings: bookingsCount || 0
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (eventId: string, newStatus: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('events')
                .update({ status: newStatus })
                .eq('id', eventId);

            if (error) throw error;

            setEvents(events.map(e => e.id === eventId ? { ...e, status: newStatus } : e));
            setStats(prev => ({
                ...prev,
                pendingEvents: prev.pendingEvents - 1
            }));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: 'admin' | 'college' | 'student') => {
        if (userId === profile?.id) {
            alert("You cannot change your own role.");
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (userId === profile?.id) {
            alert("You cannot delete yourself.");
            return;
        }

        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            // Note: In a real app, you'd also need to delete the user from auth.users via an edge function or admin API
            // For now, we just delete the profile which is what RLS allows
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.filter(u => u.id !== userId));
            setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <ShieldCheck className="text-indigo-600 dark:text-indigo-400" />
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {profile?.full_name}</p>
                    </div>
                    <button
                        onClick={signOut}
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-2 rounded-xl transition-all border border-gray-200 dark:border-gray-700 font-medium"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard
                        title="Total Events"
                        value={stats.totalEvents}
                        icon={<Calendar className="text-blue-400" />}
                        color="blue"
                    />
                    <StatCard
                        title="Pending Approval"
                        value={stats.pendingEvents}
                        icon={<Clock className="text-yellow-400" />}
                        color="yellow"
                    />
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={<Users className="text-purple-400" />}
                        color="purple"
                    />
                    <StatCard
                        title="Total Bookings"
                        value={stats.totalBookings}
                        icon={<TrendingUp className="text-green-400" />}
                        color="green"
                    />
                </div>

                {/* Tabs & Search */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`flex-1 md:flex-none px-8 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'events' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Events
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex-1 md:flex-none px-8 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Users
                        </button>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-12 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {activeTab === 'events' ? (
                    <div className="space-y-12">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Clock className="text-yellow-600 dark:text-yellow-500" size={20} />
                                    Pending Approvals
                                </h2>
                                <span className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200 dark:border-yellow-800">
                                    {events.filter(e => e.status === 'pending').length} Actions Required
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                                            <th className="px-6 py-4 font-semibold">Event Details</th>
                                            <th className="px-6 py-4 font-semibold">Organizer</th>
                                            <th className="px-6 py-4 font-semibold">Venue & Date</th>
                                            <th className="px-6 py-4 font-semibold">Status</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {events.filter(e => e.status === 'pending').length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <CheckCircle size={40} className="text-gray-400 dark:text-gray-600" />
                                                        <p>No pending events to approve</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            events.filter(e => e.status === 'pending').map((event) => (
                                                <tr key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-900 dark:text-white">{event.title}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{event.category}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-700 dark:text-gray-300">{event.profiles.full_name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{event.profiles.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-700 dark:text-gray-300 font-bold">{event.venue}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{event.location}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{event.date} at {event.time}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold px-2 py-1 rounded uppercase border border-yellow-200 dark:border-yellow-800">
                                                            Pending
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleUpdateStatus(event.id, 'approved')}
                                                                className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-700 dark:hover:text-green-300 rounded-lg transition-all border border-green-200 dark:border-green-800"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(event.id, 'rejected')}
                                                                className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-all border border-red-200 dark:border-red-800"
                                                                title="Reject"
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                                <Calendar className="text-indigo-600 dark:text-indigo-400" size={20} />
                                All Events
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredEvents.filter(e => e.status !== 'pending').map((event) => (
                                    <div key={event.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${event.status === 'approved'
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                                                }`}>
                                                {event.status}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{event.date}</span>
                                        </div>
                                        <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">{event.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{event.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Users size={14} />
                                            <span>{event.total_seats} Seats</span>
                                            <span className="mx-1"></span>
                                            <span>{event.category}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                <Users className="text-purple-600 dark:text-purple-400" size={20} />
                                User Management
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-6 py-4 font-semibold">User</th>
                                        <th className="px-6 py-4 font-semibold">Role</th>
                                        <th className="px-6 py-4 font-semibold">Joined</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                        {user.full_name?.charAt(0) || user.email.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">{user.full_name || 'No Name'}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleUpdateRole(user.id, e.target.value as any)}
                                                    disabled={user.id === profile?.id}
                                                    className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="college">College</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(user.created_at || new Date().toISOString()).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        disabled={user.id === profile?.id}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-0"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: ReactNode, color: string }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <h3 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-800`}>
                {icon}
            </div>
        </div>
    </div>
);

export default AdminDashboard;