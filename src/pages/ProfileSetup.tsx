import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import {
    User, Phone, BookOpen, Building2, Globe, ChevronRight, ChevronLeft,
    Check, Sparkles, Music, Cpu, Trophy, Palette, Utensils, BookOpenCheck,
    Users, Flame, ArrowRight, SkipForward
} from 'lucide-react';

// ─── Interest chips config ────────────────────────────────────────────────────
const INTERESTS = [
    { id: 'music', label: 'Music', icon: Music },
    { id: 'tech', label: 'Tech', icon: Cpu },
    { id: 'sports', label: 'Sports', icon: Trophy },
    { id: 'arts', label: 'Arts', icon: Palette },
    { id: 'food', label: 'Food', icon: Utensils },
    { id: 'academic', label: 'Academic', icon: BookOpenCheck },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'culture', label: 'Culture', icon: Flame },
];

// ─── Avatar emoji options ─────────────────────────────────────────────────────
const AVATARS = ['🎓', '🏆', '🎵', '💡', '🚀', '🎨', '⚡', '🌟', '🦁', '🐉', '🎭', '🔥'];

// ─── Step progress bar ────────────────────────────────────────────────────────
const StepBar = ({ current, total }: { current: number; total: number }) => (
    <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
                <div
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < current ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                />
                {i < total - 1 && (
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-300 ${i + 1 < current
                            ? 'bg-indigo-600 dark:bg-indigo-400 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                        }`}>
                        {i + 1 < current ? <Check size={10} /> : i + 2}
                    </div>
                )}
            </div>
        ))}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ProfileSetup = () => {
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [direction, setDirection] = useState<'forward' | 'back'>('forward');

    // Form state
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [department, setDepartment] = useState(profile?.department || '');
    const [collegeName, setCollegeName] = useState(profile?.college_name || '');
    const [collegeWebsite, setCollegeWebsite] = useState(profile?.college_website || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [interests, setInterests] = useState<string[]>(profile?.interests || []);
    const [avatar, setAvatar] = useState(profile?.avatar_url || '🎓');

    const isCollege = profile?.role === 'college';
    const TOTAL_STEPS = 3;

    // ── Helpers ───────────────────────────────────────────────────────────────
    const goNext = () => {
        setDirection('forward');
        setStep(s => Math.min(s + 1, TOTAL_STEPS));
    };
    const goBack = () => {
        setDirection('back');
        setStep(s => Math.max(s - 1, 1));
    };

    const toggleInterest = (id: string) => {
        setInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const saveProfile = async (skip = false) => {
        if (!user) return;
        setSaving(true);
        try {
            const updates: Record<string, unknown> = {
                full_name: fullName || profile?.full_name,
                phone: phone,
                bio: bio,
                profile_complete: true,
            };

            if (isCollege) {
                updates.college_name = collegeName;
                updates.college_website = collegeWebsite;
            } else {
                updates.department = department;
                updates.interests = skip ? (profile?.interests ?? []) : interests;
            }

            if (!skip) {
                updates.avatar_url = avatar;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            toast.success(skip ? 'Profile saved! You can complete it later.' : '🎉 Profile complete! Welcome aboard!');

            // Redirect based on role
            const dest = isCollege ? '/college' : '/home';
            navigate(dest, { replace: true });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to save profile';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // ── Step 1 — Personal Info ────────────────────────────────────────────────
    const Step1 = () => (
        <div className={`transition-all duration-300 ${direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <User size={20} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Personal Info</h2>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 ml-[52px]">
                Tell us a bit about yourself to personalise your experience.
            </p>

            <div className="space-y-4">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 h-4 w-4 transition-colors" />
                        <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="Your full name"
                            className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                    <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 h-4 w-4 transition-colors" />
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Department (student) OR College Name (college) */}
                {isCollege ? (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">College / Organisation Name</label>
                        <div className="relative group">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 h-4 w-4 transition-colors" />
                            <input
                                type="text"
                                value={collegeName}
                                onChange={e => setCollegeName(e.target.value)}
                                placeholder="Christ University"
                                className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Department / Branch</label>
                        <div className="relative group">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 h-4 w-4 transition-colors" />
                            <input
                                type="text"
                                value={department}
                                onChange={e => setDepartment(e.target.value)}
                                placeholder="Computer Science"
                                className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // ── Step 2 — Interests (student) / College Details (college) ─────────────
    const Step2 = () => (
        <div className={`transition-all duration-300 ${direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
            {isCollege ? (
                <>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Building2 size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">College Details</h2>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 ml-[52px]">
                        Help students discover your college and events.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">College Website</label>
                            <div className="relative group">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 h-4 w-4 transition-colors" />
                                <input
                                    type="url"
                                    value={collegeWebsite}
                                    onChange={e => setCollegeWebsite(e.target.value)}
                                    placeholder="https://yourcollegewebsite.edu"
                                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">About Your College</label>
                            <textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                rows={4}
                                placeholder="Tell students what makes your college special…"
                                className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                            />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Sparkles size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Your Interests</h2>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 ml-[52px]">
                        Pick what excites you — we'll surface the best events for you.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        {INTERESTS.map(({ id, label, icon: Icon }) => {
                            const active = interests.includes(id);
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => toggleInterest(id)}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-200 font-semibold text-sm ${active
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/10 scale-[1.02]'
                                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {label}
                                    {active && <Check size={14} className="ml-auto" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Bio */}
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Short Bio (optional)</label>
                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            rows={2}
                            placeholder="A little about you…"
                            className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm"
                        />
                    </div>
                </>
            )}
        </div>
    );

    // ── Step 3 — Avatar & Review ──────────────────────────────────────────────
    const Step3 = () => (
        <div className={`transition-all duration-300 ${direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                    <Check size={20} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Choose Your Avatar</h2>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 ml-[52px]">
                Pick an emoji avatar — you can update it anytime from your profile.
            </p>

            {/* Avatar grid */}
            <div className="grid grid-cols-6 gap-2 mb-6">
                {AVATARS.map(emoji => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatar(emoji)}
                        className={`h-14 w-full rounded-xl text-2xl flex items-center justify-center transition-all duration-200 border-2 ${avatar === emoji
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-110 shadow-lg shadow-indigo-500/20'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:scale-105'
                            }`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Review Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Your Profile Preview</p>
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-3xl shrink-0">
                        {avatar}
                    </div>
                    <div className="min-w-0">
                        <p className="font-black text-gray-900 dark:text-white truncate">{fullName || 'Your Name'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{profile?.email}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold capitalize mt-0.5">
                            {isCollege
                                ? `🏫 ${collegeName || 'College Organiser'}`
                                : `🎓 ${department || 'Student'}`
                            }
                        </p>
                    </div>
                </div>
                {!isCollege && interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {interests.map(id => {
                            const item = INTERESTS.find(i => i.id === id);
                            return item ? (
                                <span key={id} className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                                    {item.label}
                                </span>
                            ) : null;
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            {/* Left panel — decorative */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
                {/* Animated blobs */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-700" />

                <div className="relative z-10 flex flex-col justify-center p-20 w-full">
                    <div className="max-w-md">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur text-white text-sm font-bold mb-8">
                            <Sparkles size={14} />
                            Just one more step!
                        </div>
                        <h3 className="text-5xl font-black text-white leading-tight mb-6">
                            Make it <br />
                            <span className="text-yellow-300">yours.</span>
                        </h3>
                        <p className="text-white/70 text-lg leading-relaxed mb-10">
                            {isCollege
                                ? 'Set up your college profile to start creating events and reaching students.'
                                : 'Personalise your profile so we can recommend the best events for you on campus.'}
                        </p>

                        {/* Step pills */}
                        <div className="space-y-3">
                            {['Personal Info', isCollege ? 'College Details' : 'Your Interests', 'Avatar & Review'].map((label, i) => (
                                <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${step > i + 1 ? 'opacity-50' : step === i + 1 ? 'opacity-100' : 'opacity-30'}`}>
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${step > i + 1
                                            ? 'bg-white border-white text-indigo-600'
                                            : step === i + 1
                                                ? 'bg-white/20 border-white text-white'
                                                : 'bg-transparent border-white/40 text-white/40'
                                        }`}>
                                        {step > i + 1 ? <Check size={14} /> : <span className="text-sm font-bold">{i + 1}</span>}
                                    </div>
                                    <span className={`font-semibold ${step === i + 1 ? 'text-white' : 'text-white/60'}`}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="w-full lg:w-[540px] flex flex-col justify-center p-8 sm:p-12 bg-white dark:bg-gray-900 overflow-y-auto">
                <div className="max-w-md mx-auto w-full">
                    {/* Logo + header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl mb-6">
                            <div className="h-9 w-9 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Sparkles className="text-white h-4 w-4" />
                            </div>
                            CollegeEvents
                        </div>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
                            Step {step} of {TOTAL_STEPS}
                        </p>
                        <StepBar current={step} total={TOTAL_STEPS} />
                    </div>

                    {/* Step content */}
                    <div className="mb-8">
                        {step === 1 && <Step1 />}
                        {step === 2 && <Step2 />}
                        {step === 3 && <Step3 />}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                            >
                                <ChevronLeft size={18} />
                                Back
                            </button>
                        )}

                        {step < TOTAL_STEPS ? (
                            <button
                                type="button"
                                onClick={goNext}
                                disabled={step === 1 && !fullName.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                Continue
                                <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => saveProfile(false)}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-base shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Complete Setup
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Skip link */}
                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => saveProfile(true)}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <SkipForward size={14} />
                            Skip for now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetup;
