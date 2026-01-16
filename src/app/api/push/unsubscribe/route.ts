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

        // Remove subscription from database
        await Subscription.deleteOne({
            endpoint: subscriptionData.endpoint,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing subscription:', error);
        return NextResponse.json(
            { error: 'Failed to remove subscription' },
            { status: 500 }
        );
    }
}