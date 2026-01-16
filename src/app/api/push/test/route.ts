// app/api/notifications/test/route.tsx
import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { sendPushNotification } from "@/lib/push-notifications"
import { Subscription } from "@/models"

export async function POST(request: Request) {
    try {
        const { userId, title, body, url } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        await connectToDatabase()

        // Get user's subscriptions from database
        const subscriptions = await Subscription.find({ userId }).lean();

        if (subscriptions.length === 0) {
            return NextResponse.json({
                success: true,
                sent: 0,
                failed: 0,
                message: 'No subscriptions found for this user. Please subscribe first.',
            });
        }

        // Transform Mongoose documents to PushSubscription format
        const pushSubscriptions = subscriptions.map(sub => ({
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
            },
        }));

        // Notification payload
        const notificationPayload = {
            title: title || "Happy New Year From Malipo agents",
            body: body || "Your push notifications are working perfectly!",
            icon: "/icons/android-chrome-192x192.png",
            badge: "/icons/favicon-32x32.png",
            url: url || undefined,
            data: {
                type: "test",
                url: url || '/',
                timestamp: new Date().toISOString()
            },
        };

        // Send notification to each subscription
        let sent = 0;
        let failed = 0;
        const errors: Array<{ endpoint: string; error: string }> = [];

        for (const subscription of pushSubscriptions) {
            try {
                const result = await sendPushNotification(subscription, notificationPayload);
                if (result.success) {
                    sent++;
                } else {
                    failed++;
                    errors.push({
                        endpoint: subscription.endpoint,
                        error: typeof result.error === 'string' ? result.error : 'Failed to send notification'
                    });
                }
            } catch (error) {
                failed++;
                errors.push({
                    endpoint: subscription.endpoint,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        if (sent > 0) {
            return NextResponse.json({
                success: true,
                sent,
                failed,
                message: `Test notification sent successfully to ${sent} subscription(s)`,
                errors: failed > 0 ? errors : undefined
            })
        } else {
            return NextResponse.json({
                error: "Failed to send test notification to any subscription",
                sent,
                failed,
                errors
            }, { status: 500 })
        }
    } catch (error) {
        console.error("Error sending test notification:", error)
        return NextResponse.json({
            error: "Failed to send test notification",
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}