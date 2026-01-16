import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { connectToDatabase } from '@/lib/db';
import { Subscription } from '@/models/Subscription';
import { getServerSession } from 'next-auth';

// Configure web-push
webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, body, url, userId } = await request.json();

        await connectToDatabase();

        // Get user's subscriptions from database
        const subscriptions = await Subscription.find({ userId }).lean();

        if (subscriptions.length === 0) {
            return NextResponse.json({
                success: true,
                sent: 0,
                failed: 0,
                message: 'No subscriptions found for this user',
            });
        }

        const payload = JSON.stringify({
            title,
            body,
            url: url || '/',
        });

        const results = await Promise.allSettled(
            subscriptions.map((sub) =>
                webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.keys.p256dh,
                            auth: sub.keys.auth,
                        },
                    },
                    payload
                )
            )
        );

        const sent = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;

        return NextResponse.json({
            success: true,
            sent,
            failed,
        });
    } catch (error) {
        console.error('Error sending push notification:', error);
        return NextResponse.json(
            { error: 'Failed to send notification' },
            { status: 500 }
        );
    }
}