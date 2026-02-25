import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Notification {
    id: string;
    user_id: string;
    type: 'booking' | 'reminder' | 'system' | 'achievement';
    title: string;
    message: string;
    read: boolean;
    created_at: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notif: Omit<Notification, 'id' | 'user_id' | 'read' | 'created_at'>) => Promise<void>;
    loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);
            setNotifications(data || []);
        } catch (e) {
            console.error('Error fetching notifications:', e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) { setNotifications([]); return; }
        fetchNotifications();

        // Real-time subscription
        const sub = supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`,
            }, (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
            })
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    }, [user, fetchNotifications]);

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = async () => {
        if (!user) return;
        await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const addNotification = async (notif: Omit<Notification, 'id' | 'user_id' | 'read' | 'created_at'>) => {
        if (!user) return;
        await supabase.from('notifications').insert({ ...notif, user_id: user.id });
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification, loading }}>
            {children}
        </NotificationContext.Provider>
    );
};
