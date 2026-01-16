// components/notifications/notification-display.tsx
'use client';

import { useNotifications, Notification } from './notification-context';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const colorMap = {
    success: {
        bg: 'var(--success)',
        text: 'white',
        border: 'var(--success)',
    },
    error: {
        bg: '#ef4444',
        text: 'white',
        border: '#ef4444',
    },
    warning: {
        bg: '#f59e0b',
        text: 'white',
        border: '#f59e0b',
    },
    info: {
        bg: 'var(--text-primary)',
        text: 'var(--background)',
        border: 'var(--text-primary)',
    },
};

function NotificationItem({ notification }: { notification: Notification }) {
    const { removeNotification } = useNotifications();
    const Icon = iconMap[notification.type];
    const colors = colorMap[notification.type];

    return (
        <div
            className="max-w-sm w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden transform transition-all duration-300 ease-in-out"
            style={{
                background: 'var(--surface)',
                border: `1px solid ${colors.border}`,
            }}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Icon
                            className="h-6 w-6"
                            style={{ color: colors.bg }}
                        />
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {notification.title}
                        </p>
                        {notification.message && (
                            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {notification.message}
                            </p>
                        )}
                        {notification.actions && notification.actions.length > 0 && (
                            <div className="mt-3 flex space-x-2">
                                {notification.actions.map((action, index) => (
                                    <Button
                                        key={index}
                                        size="sm"
                                        variant="outline"
                                        onClick={action.onClick}
                                        className="text-xs"
                                        style={{
                                            borderColor: colors.bg,
                                            color: colors.bg,
                                        }}
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            className="rounded-md inline-flex hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
                            style={{
                                color: 'var(--text-tertiary)',
                                '--tw-ring-color': colors.bg
                            } as React.CSSProperties}
                            onClick={() => removeNotification(notification.id)}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NotificationDisplay() {
    const { notifications } = useNotifications();

    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                    />
                ))}
            </div>
        </div>
    );
}