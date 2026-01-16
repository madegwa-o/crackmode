import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db';
import { Subscription } from '@/models/Subscription';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const subscriptionData = await request.json();

        // Find or create subscription
        const subscription = await Subscription.findOneAndUpdate(
            { endpoint: subscriptionData.endpoint },
            {
                userId: session.user.id,
                endpoint: subscriptionData.endpoint,
                keys: subscriptionData.keys,
            },
            { upsert: true, new: true }
        );

        console.log('Subscription saved:', subscription._id);

        return NextResponse.json({
            success: true,
            subscriptionId: subscription._id
        });
    } catch (error) {
        console.error('Error saving subscription:', error);
        return NextResponse.json(
            { error: 'Failed to save subscription' },
            { status: 500 }
        );
    }
}