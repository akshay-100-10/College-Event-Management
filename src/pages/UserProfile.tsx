import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import {
    User, Phone, BookOpen, Building2, Globe, Save, ArrowLeft,
    Edit3, Music, Cpu, Trophy, Palette, Utensils,
    BookOpenCheck, Users, Flame, Check, Camera, Mail, Shield
} from 'lucide-react';

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

const AVATARS = ['🎓', '🏆', '🎵', '💡', '🚀', '🎨', '⚡', '🌟', '🦁', '🐉', '🎭', '🔥'];

const UserProfile = () => {
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [editingAvatar, setEditingAvatar] = useState(false);

    // Form state — pre-fill from existing profile
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [department, setDepartment] = useState(profile?.department || '');
    const [collegeName, setCollegeName] = useState(profile?.college_name || '');
    const [collegeWebsite, setCollegeWebsite] = useState(profile?.college_website || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [interests, setInterests] = useState<string[]>(profile?.interests || []);
    const [avatar, setAvatar] = useState(profile?.avatar_url || '🎓');

    const isCollege = profile?.role === 'college';

    const toggleInterest = (id: string) => {
        setInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!user) return;
        if (!fullName.trim()) {
            toast.error('Full name is required');
            return;
        }
        setSaving(true);
        try {
            const updates: Record<string, unknown> = {
                full_name: fullName.trim(),
                phone,
                bio,
                avatar_url: avatar,
                profile_complete: true,
            };
            if (isCollege) {
                updates.college_name = collegeName;
                updates.college_website = collegeWebsite;
            } else {
                updates.department = department;
                updates.interests = interests;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            toast.success('Profile updated successfully!');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to save profile';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (!user || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Please log in to view your profile.</p>
                    <Link to="/login" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-colors">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    const backDest = isCollege ? '/college' : '/home';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            {/* Top bar */}
            <div className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(backDest)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                    <span className="font-black text-gray-900 dark:text-white text-lg">Edit Profile</span>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* ── Profile Card Header ─────────────────────────────────────── */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 right-4 w-48 h-48 bg-white rounded-full blur-3xl" />
                        <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white rounded-full blur-3xl" />
                    </div>
                    <div className="relative z-10 flex items-center gap-5">
                        {/* Avatar */}
                        <div className="relative">
                            <div
                                className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl cursor-pointer hover:bg-white/30 transition-colors border-2 border-white/30"
                                onClick={() => setEditingAvatar(v => !v)}
                            >
                                {avatar}
                            </div>
                            <div
                                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white flex items-center justify-center text-indigo-600 cursor-pointer shadow"
                                onClick={() => setEditingAvatar(v => !v)}
                            >
                                <Camera size={13} />
                            </div>
                        </div>

                        <div>
                            <h1 className="text-2xl font-black">{fullName || 'Your Name'}</h1>
                            <p className="text-white/70 text-sm mt-0.5">{profile.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${isCollege ? 'bg-amber-400/20 text-amber-200' : 'bg-green-400/20 text-green-200'
                                    }`}>
                                    <Shield size={10} />
                                    {isCollege ? 'College Organiser' : 'Student'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Avatar picker drawer */}
                    {editingAvatar && (
                        <div className="relative z-10 mt-4 p-3 bg-white/10 backdrop-blur rounded-2xl">
                            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Choose avatar</p>
                            <div className="grid grid-cols-6 gap-2">
                                {AVATARS.map(emoji => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => { setAvatar(emoji); setEditingAvatar(false); }}
                                        className={`h-11 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${avatar === emoji
                                                ? 'border-white bg-white/30 scale-110'
                                                : 'border-white/20 bg-white/10 hover:bg-white/20 hover:scale-105'
                                            }`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Account Info (read-only) ────────────────────────────────── */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                    <h2 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Mail size={16} className="text-indigo-500" />
                        Account
                    </h2>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 shrink-0">
                            <Mail size={16} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Email (cannot be changed)</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile.email}</p>
                        </div>
                    </div>
                </div>

                {/* ── Personal Info ───────────────────────────────────────────── */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                    <h2 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <User size={16} className="text-indigo-500" />
                        Personal Info
                    </h2>
                    <div className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Full Name <span className="text-red-400">*</span>
                            </label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 h-4 w-4 transition-colors" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Your full name"
                                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 h-4 w-4 transition-colors" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Department or College Name */}
                        {isCollege ? (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">College / Organisation Name</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 h-4 w-4 transition-colors" />
                                    <input
                                        type="text"
                                        value={collegeName}
                                        onChange={e => setCollegeName(e.target.value)}
                                        placeholder="Christ University"
                                        className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Department / Branch</label>
                                <div className="relative group">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 h-4 w-4 transition-colors" />
                                    <input
                                        type="text"
                                        value={department}
                                        onChange={e => setDepartment(e.target.value)}
                                        placeholder="Computer Science"
                                        className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {isCollege ? 'About Your College' : 'Short Bio'}
                            </label>
                            <textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                rows={3}
                                placeholder={isCollege ? 'Tell students what makes your college special…' : 'A little about you…'}
                                className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm"
                            />
                        </div>

                        {/* College Website (college only) */}
                        {isCollege && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">College Website</label>
                                <div className="relative group">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 h-4 w-4 transition-colors" />
                                    <input
                                        type="url"
                                        value={collegeWebsite}
                                        onChange={e => setCollegeWebsite(e.target.value)}
                                        placeholder="https://yourcollegewebsite.edu"
                                        className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Interests (students only) ────────────────────────────────── */}
                {!isCollege && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-base font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                            <Edit3 size={16} className="text-indigo-500" />
                            Your Interests
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            We use these to recommend the best events for you.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {INTERESTS.map(({ id, label, icon: Icon }) => {
                                const active = interests.includes(id);
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => toggleInterest(id)}
                                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-semibold text-sm ${active
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/10'
                                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {label}
                                        {active && <Check size={13} className="ml-auto" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Save Button (bottom) ─────────────────────────────────────── */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-base shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed mb-8"
                >
                    {saving ? (
                        <>
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving…
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default UserProfile;
