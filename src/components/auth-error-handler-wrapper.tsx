'use client';

import dynamic from 'next/dynamic';

const AuthErrorHandler = dynamic(() => import('./auth-error-handler'), {
    ssr: false,
});

export default function AuthErrorHandlerWrapper() {
    return <AuthErrorHandler />;
}
