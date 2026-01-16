// app/api/payments/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { Payment } from '@/models/Payment'; // Adjust import path as needed
import { connectToDatabase} from '@/lib/db'; // Adjust import path as needed

export async function GET(request: NextRequest) {
    try {
        // Auth check
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectToDatabase();

        const searchParams = request.nextUrl.searchParams;
        const checkoutRequestId = searchParams.get('checkoutRequestId');

        if (!checkoutRequestId) {
            return NextResponse.json(
                { success: false, error: 'checkoutRequestId is required' },
                { status: 400 }
            );
        }

        // Find payment by checkoutRequestId
        const payment = await Payment.findOne({ checkoutRequestId });

        if (!payment) {
            return NextResponse.json(
                { success: false, error: 'Payment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            payment: {
                _id: payment._id,
                status: payment.status,
                resultCode: payment.resultCode,
                resultDesc: payment.resultDesc,
                mpesaReceiptNumber: payment.mpesaReceiptNumber,
                transactionAmount: payment.transactionAmount,
                checkoutRequestId: payment.checkoutRequestId,
            }
        });

    } catch (error) {
        console.error('Payment status check error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}