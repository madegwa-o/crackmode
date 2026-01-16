
// hooks/useNetworkStatus.ts
'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '@/components/notifications/notification-context';

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const { addNotification } = useNotifications();

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            addNotification({
                type: 'success',
                title: 'Connection Restored',
                message: 'Your internet connection has been restored.',
                duration: 3000,
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
            addNotification({
                type: 'warning',
                title: 'Connection Lost',
                message: 'You are currently offline. Some features may not work properly.',
                duration: 0, // Persistent until back online
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [addNotification]);

    return isOnline;
}