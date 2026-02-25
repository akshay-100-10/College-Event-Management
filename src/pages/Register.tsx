import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserPlus, Mail, Lock, User, GraduationCap, Building2, AlertCircle, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'student' | 'college'>('student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                    },
                },
            });

            if (authError) throw authError;

            navigate('/login', { state: { message: 'Registration successful! Please check your email for verification.', newUser: true } });
        } catch (err: any) {
            setError(err.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            {/* Left Side - Form */}
            <div className="w-full lg:w-[450px] flex flex-col justify-center p-8 sm:p-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 z-10 relative">
                {/* Theme Toggle Absolute */}
                <button
                    onClick={toggleTheme}
                    className="absolute top-8 left-8 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="max-w-md mx-auto w-full">
                    <div className="mb-10">
                        <Link to="/home" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl mb-8">
                            <div className="h-10 w-10 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <UserPlus className="text-white h-5 w-5" />
                            </div>
                            <span>CollegeEvents</span>
                        </Link>
                        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Create Account</h2>
                        <p className="mt-3 text-gray-500 dark:text-gray-400">
                            Join the ultimate college events platform and never miss an adventure.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleRegister}>
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm animate-shake">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 h-5 w-5 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 h-5 w-5 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        placeholder="you@college.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 h-5 w-5 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 ml-1">I am a...</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setRole('student')}
                                        className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${role === 'student'
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10'
                                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <GraduationCap size={22} />
                                        <span className="font-bold">Student</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('college')}
                                        className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${role === 'college'
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10'
                                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <Building2 size={22} />
                                        <span className="font-bold">College</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Creating Account...</span>
                                </div>
                            ) : 'Create Account'}
                        </button>

                        <div className="text-center text-sm pt-4">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Already have an account? </span>
                            <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors underline-offset-4 hover:underline">
                                Sign in here
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Side - Visual */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden bg-white dark:bg-gray-900">
                <img
                    src="/brain/d1a63289-5916-418f-911e-de0422a72db2/auth_background_image_1768369307551.png"
                    alt="College Events"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 dark:opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-white via-transparent to-indigo-50/20 dark:from-gray-900 dark:via-transparent dark:to-indigo-900/20" />

                <div className="relative z-10 flex flex-col justify-end p-20 w-full">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-1 w-8 bg-indigo-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-1000 ${i === 1 ? 'w-full' : 'w-0'}`} />
                                </div>
                            ))}
                        </div>
                        <h3 className="text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                            Discover the best <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                college experiences
                            </span>
                        </h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h4 className="text-gray-900 dark:text-white font-bold mb-1 text-lg">Verified Events</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">All events are approved by college administrators.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h4 className="text-gray-900 dark:text-white font-bold mb-1 text-lg">Instant Booking</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Get your tickets instantly and securely.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-20 right-20 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-pulse delay-700" />
            </div>
        </div>
    );
};

export default Register;
