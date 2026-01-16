'use client';

import { useState, useEffect } from 'react';

export function usePushNotifications() {
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
        }
    }, []);

    async function checkSubscription() {
        try {
            // Wait for the workbox service worker to be ready
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
            setIsSubscribed(!!sub);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    }

    async function subscribeToPush() {
        try {
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                throw new Error('Permission not granted for notifications');
            }

            // Wait for workbox service worker
            const registration = await navigator.serviceWorker.ready;

            // Get VAPID public key from your server
            const response = await fetch('/api/push/vapid-public-key');
            const { publicKey } = await response.json();

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            // Send subscription to your server
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub),
            });

            setSubscription(sub);
            setIsSubscribed(true);

            return sub;
        } catch (error) {
            console.error('Error subscribing to push:', error);
            throw error;
        }
    }

    async function unsubscribeFromPush() {
        try {
            if (subscription) {
                await subscription.unsubscribe();

                // Remove subscription from your server
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription),
                });

                setSubscription(null);
                setIsSubscribed(false);
            }
        } catch (error) {
            console.error('Error unsubscribing from push:', error);
            throw error;
        }
    }

    return {
        isSupported,
        isSubscribed,
        subscription,
        subscribeToPush,
        unsubscribeFromPush,
    };
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}