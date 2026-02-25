import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    Trophy,
    Medal,
    Award,
    Crown,
    Star,
    TrendingUp,
    ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface LeaderboardEntry {
    student_id: string;
    full_name: string;
    email: string;
    total_points: number;
    events_booked: number;
    events_attended: number;
    rank?: number;
}

const Leaderboard = () => {
    const { user } = useAuth();
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from('student_leaderboard')
                .select('*')
                .order('total_points', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (data) {
                // Add rank
                const rankedData = data.map((entry, index) => ({
                    ...entry,
                    rank: index + 1
                }));
                setLeaders(rankedData);

                // Find current user
                if (user) {
                    const currentUser = rankedData.find(entry => entry.student_id === user.id);
                    setUserRank(currentUser || null);
                }
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBadge = (rank: number) => {
        if (rank === 1) return <Crown className="text-yellow-500 fill-yellow-500" size={24} />;
        if (rank === 2) return <Medal className="text-gray-400 fill-gray-400" size={24} />;
        if (rank === 3) return <Medal className="text-amber-700 fill-amber-700" size={24} />;
        return <span className="text-gray-500 font-bold">#{rank}</span>;
    };

    const getRowStyle = (rank: number) => {
        if (rank === 1) return "bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/50";
        if (rank === 2) return "bg-gray-50/50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800";
        if (rank === 3) return "bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/50";
        return "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800";
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 transition-colors">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/home" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                        </Link>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Trophy className="text-yellow-500" size={24} />
                            Student Leaderboard
                        </h1>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* User Stats Card */}
                {userRank && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl transform transition-all hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-indigo-100 font-medium tracking-wide text-sm uppercase">Your Current Rank</span>
                            <Award className="text-yellow-300" size={24} />
                        </div>
                        <div className="flex items-end gap-3 mb-6">
                            <h2 className="text-5xl font-black">#{userRank.rank}</h2>
                            <span className="text-2xl font-bold text-indigo-200 mb-1">/ {leaders.length}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                            <div>
                                <p className="text-indigo-200 text-xs uppercase font-bold">Points</p>
                                <p className="text-xl font-bold">{userRank.total_points}</p>
                            </div>
                            <div>
                                <p className="text-indigo-200 text-xs uppercase font-bold">Bookings</p>
                                <p className="text-xl font-bold">{userRank.events_booked}</p>
                            </div>
                            <div>
                                <p className="text-indigo-200 text-xs uppercase font-bold">Attended</p>
                                <p className="text-xl font-bold">{userRank.events_attended}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leaderboard List */}
                <div className="space-y-4">
                    {loading ? (
                        // Skeletons
                        [1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
                        ))
                    ) : (
                        leaders.map((student) => (
                            <div
                                key={student.student_id}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${getRowStyle(student.rank || 0)} ${user?.id === student.student_id ? 'ring-2 ring-indigo-500 shadow-indigo-500/20 shadow-lg' : 'hover:shadow-md'}`}
                            >
                                {/* Rank & Badge */}
                                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center font-black text-xl">
                                    {getBadge(student.rank || 0)}
                                </div>

                                {/* Avatar */}
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                                    {student.full_name[0]}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                        {student.full_name}
                                        {user?.id === student.student_id && <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">You</span>}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Star size={12} /> {student.events_booked} Booked
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <TrendingUp size={12} /> {student.events_attended} Attended
                                        </span>
                                    </div>
                                </div>

                                {/* Points */}
                                <div className="text-right">
                                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{student.total_points}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Points</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default Leaderboard;
