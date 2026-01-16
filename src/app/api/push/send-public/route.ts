import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { connectToDatabase } from '@/lib/db';
import { Subscription } from '@/models/Subscription';

// Configure web-push with VAPID details
webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);


export async function POST(request: NextRequest) {
    try {
        const { title, body, url, userId } = await request.json();

        if (!title || !body) {
            return NextResponse.json(
                { error: 'Title and body are very required' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Get all subscriptions from database (or filter by userId if provided)
        const query = userId ? { userId } : {};
        const subscriptions = await Subscription.find(query).lean();

        if (subscriptions.length === 0) {
            console.log('No subscriptions found in database');
            return NextResponse.json({
                success: true,
                sent: 0,
                failed: 0,
                message: 'No active subscriptions. Please subscribe first.',
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

        console.log('results: ', results)

        // Remove failed subscriptions (expired or invalid)
        const failedResults = results
            .map((result, index) => ({ result, index }))
            .filter(({ result }) => result.status === 'rejected');

        for (const { index } of failedResults) {
            const failedSub = subscriptions[index];
            await Subscription.deleteOne({ endpoint: failedSub.endpoint });
            console.log('Removed invalid subscription:', failedSub.endpoint);
        }

        const sent = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;

        return NextResponse.json({
            success: true,
            sent,
            failed,
            total: subscriptions.length,
            message: 'Notification sent successfully',
        });
    } catch (error) {
        console.error('Error sending push notification:', error);
        return NextResponse.json(
            { error: 'Failed to send notification' },
            { status: 500 }
        );
    }
}