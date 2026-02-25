import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check active sessions and subscribe to auth changes
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                // Only fetch profile if we don't have it or if the user changed
                fetchProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('Error fetching profile:', error);
                // Don't set profile to null immediately if we already have one, unless it's a hard error? 
                // Actually, if fetch fails, we probably should reset it to avoid stale data.
                setProfile(null);
            } else if (data) {
                setProfile(data);
            } else {
                // No profile found
                setProfile(null);
            }
        } catch (error) {
            console.error('Error in fetchProfile:', error);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            // Best-effort server-side signout — may return 403 if token already expired
            await supabase.auth.signOut({ scope: 'local' });
        } catch {
            // Ignore — we still clear local state below
        }
        // Always clear local auth state so the user is never stuck
        setUser(null);
        setProfile(null);
        // Remove Supabase session from localStorage as a safety net
        Object.keys(localStorage)
            .filter(k => k.startsWith('sb-'))
            .forEach(k => localStorage.removeItem(k));
        navigate('/login');
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
