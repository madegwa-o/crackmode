

// components/auth-error-handler.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNotifications } from './notifications/notification-context';

const errorMessages: Record<string, { title: string; message: string }> = {
    OAuthSignin: {
        title: 'Sign-in Failed',
        message: 'There was a problem connecting to Google. Please check your internet connection and try again.',
    },
    OAuthCallback: {
        title: 'Authentication Error',
        message: 'Unable to complete sign-in process. Please try again.',
    },
    OAuthCreateAccount: {
        title: 'Account Creation Failed',
        message: 'Unable to create your account. Please try again later.',
    },
    EmailCreateAccount: {
        title: 'Email Account Error',
        message: 'Unable to create account with this email address.',
    },
    Callback: {
        title: 'Callback Error',
        message: 'Authentication callback failed. Please try signing in again.',
    },
    OAuthAccountNotLinked: {
        title: 'Account Not Linked',
        message: 'This account is already associated with another sign-in method.',
    },
    EmailSignin: {
        title: 'Email Sign-in Failed',
        message: 'Unable to send sign-in email. Please check your email address.',
    },
    CredentialsSignin: {
        title: 'Invalid Credentials',
        message: 'The email or password you entered is incorrect.',
    },
    Default: {
        title: 'Authentication Error',
        message: 'An unexpected error occurred during sign-in. Please try again.',
    },
};

export default function AuthErrorHandler() {
    const searchParams = useSearchParams();
    const { addNotification } = useNotifications();

    useEffect(() => {
        const error = searchParams.get('error');

        if (error) {
            const errorInfo = errorMessages[error] || errorMessages.Default;

            addNotification({
                type: 'error',
                title: errorInfo.title,
                message: errorInfo.message,
                duration: 8000, // Show auth errors longer
                actions: [
                    {
                        label: 'Retry',
                        onClick: () => {
                            // Clear the error from URL and reload
                            const url = new URL(window.location.href);
                            url.searchParams.delete('error');
                            url.searchParams.delete('callbackUrl');
                            window.history.replaceState({}, '', url.toString());
                        }
                    }
                ]
            });
        }
    }, [searchParams, addNotification]);

    return null;
}
