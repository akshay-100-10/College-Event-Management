import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const message = (location.state as any)?.message;
    const newUser = (location.state as any)?.newUser as boolean | undefined;

    if (user) {
        return <Navigate to="/home" replace />;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            if (user) {
                // Fetch profile to check role
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, profile_complete')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile:', profileError);
                    // Fallback to home if profile fetch fails, but logged in
                    navigate('/home', { replace: true });
                    return;
                }

                // Role-based redirection
                if (newUser || profile?.profile_complete === false) {
                    navigate('/profile-setup', { replace: true });
                } else if (profile?.role === 'college') {
                    navigate('/college', { replace: true });
                } else if (profile?.role === 'admin') {
                    navigate('/admin', { replace: true });
                } else if (profile?.role === 'student') {
                    navigate('/home', { replace: true });
                } else {
                    navigate('/home', { replace: true });
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden bg-white dark:bg-gray-900">
                <img
                    src="/brain/d1a63289-5916-418f-911e-de0422a72db2/auth_background_image_1768369307551.png"
                    alt="College Events"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 dark:opacity-40 scale-110 animate-slow-zoom"
                />
                <div className="absolute inset-0 bg-gradient-to-bl from-white/80 via-white/50 to-indigo-50/30 dark:from-gray-900/80 dark:via-gray-900/50 dark:to-indigo-950/30" />

                <div className="relative z-10 flex flex-col justify-center p-20 w-full h-full">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-bold mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-400"></span>
                            </span>
                            Live College Events
                        </div>
                        <h3 className="text-6xl font-black text-gray-900 dark:text-white leading-tight mb-8">
                            Your gateway to <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                                campus life
                            </span>
                        </h3>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
                            Join thousands of students and organizers in creating unforgettable college memories.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                    <CheckCircle2 size={16} />
                                </div>
                                <span className="font-medium">500+ Active Events Monthly</span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                                <div className="h-6 w-6 rounded-full bg-green-500/20 dark:bg-green-500/10 flex items-center justify-center text-green-400">
                                    <CheckCircle2 size={16} />
                                </div>
                                <span className="font-medium">100+ Partner Colleges</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-[500px] flex flex-col justify-center p-8 sm:p-16 bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl border-l border-gray-200 dark:border-gray-800 z-10 relative">
                {/* Theme Toggle Absolute */}
                <button
                    onClick={toggleTheme}
                    className="absolute top-8 right-8 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="max-w-md mx-auto w-full">
                    <div className="mb-12">
                        <Link to="/home" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-2xl mb-10 group">
                            <div className="h-12 w-12 bg-indigo-600 dark:bg-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                <LogIn className="text-white h-6 w-6" />
                            </div>
                            <span>CollegeEvents</span>
                        </Link>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Welcome Back</h2>
                        <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">
                            Sign in to your account to continue your journey.
                        </p>
                    </div>

                    {message && (
                        <div className="mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4">
                            <CheckCircle2 size={20} />
                            {message}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm animate-shake">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 h-5 w-5 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        placeholder="you@college.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2 ml-1">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Password</label>
                                    <a href="#" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">Forgot Password?</a>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 h-5 w-5 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-2xl text-lg font-black text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:translate-y-0"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span>Sign In</span>
                                    <ArrowRight size={20} />
                                </div>
                            )}
                        </button>

                        <div className="text-center text-base pt-6">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Don't have an account? </span>
                            <Link to="/register" className="font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors underline-offset-4 hover:underline">
                                Register here
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
