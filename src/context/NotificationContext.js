import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [permission, setPermission] = useState('default');

    // Request browser notification permission
    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        }
        return 'denied';
    };

    const fetchNotifications = useCallback(async (background = false) => {
        if (!user) return;
        if (!background) setLoading(true);

        try {
            // Fetch latest 20 notifications
            const response = await api.get('/notifications?limit=20');
            const data = response.data.data || [];

            // Update state
            setNotifications(data);

            // Count unread (assuming backend doesn't always return count, though we have an endpoint for it)
            // We can also fetch unread count separately if needed, but for now filtering is fine
            const unread = data.filter(n => !n.is_read).length;

            // Check for new notifications to trigger browser alert
            // Simple logic: if unread count increased or top item is new and unread
            if (background && unread > unreadCount && data.length > 0) {
                const latest = data[0];
                if (!latest.is_read && Notification.permission === 'granted') {
                    new Notification(latest.title, {
                        body: latest.message,
                        icon: '/logo192.png', // Assuming pwa logo exists
                    });
                }
            }

            setUnreadCount(unread);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            if (!background) setLoading(false);
        }
    }, [user, unreadCount]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Poll for notifications
    useEffect(() => {
        if (user) {
            fetchNotifications(); // Initial fetch
            const interval = setInterval(() => {
                fetchNotifications(true); // Background fetch
            }, 60000); // Poll every minute return () => clearInterval(interval);
            return () => clearInterval(interval);
        }
    }, [user, fetchNotifications]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markAsRead,
            markAllAsRead,
            requestPermission,
            permission
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
