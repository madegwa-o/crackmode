// app/api/payments/direct/stk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import {
    processSTKPush,
    getMpesaErrorMessage,
    isMpesaConfigured,
    type PaymentData,
} from '@/helpers/mpesa';
import { createPaymentFromSTK, hasMonthBeenPaid } from '@/lib/payment-service';
import { User } from '@/models/User';

interface STKPushRequest {
    phoneNumber: string;
    amount: number;
    partyB: number;
    accountReference?: string;
    transactionDesc?: string;
    transactionType?: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline';

    // Tracking fields
    apartmentId: string;
    houseId: string;
    selectedCharges: Array<{
        id: string;
        label: string;
        amount: number;
    }>;

    // NEW: Payment type and period
    paymentType: 'joining' | 'monthly';
    paymentPeriod?: {
        month: number;
        year: number;
    };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Auth check
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Check M-Pesa configuration
        if (!isMpesaConfigured()) {
            return NextResponse.json(
                { success: false, error: 'M-Pesa service is not properly configured' },
                { status: 500 }
            );
        }

        const body: STKPushRequest = await request.json();

        // Validation
        const required = ['phoneNumber', 'amount', 'partyB', 'apartmentId', 'houseId', 'selectedCharges', 'paymentType'];
        const missing = required.filter(field => !body[field as keyof STKPushRequest]);
        if (missing.length > 0) {
            return NextResponse.json(
                { success: false, error: `Missing required fields: ${missing.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate payment type
        if (!['joining', 'monthly'].includes(body.paymentType)) {
            return NextResponse.json(
                { success: false, error: 'Invalid payment type' },
                { status: 400 }
            );
        }

        // For monthly payments, validate period and check for duplicates
        if (body.paymentType === 'monthly') {
            if (!body.paymentPeriod?.month || !body.paymentPeriod?.year) {
                return NextResponse.json(
                    { success: false, error: 'Payment period (month/year) required for monthly payments' },
                    { status: 400 }
                );
            }

            // Check if month already paid
            const alreadyPaid = await hasMonthBeenPaid(
                body.houseId,
                user._id.toString(),
                body.paymentPeriod.month,
                body.paymentPeriod.year
            );

            if (alreadyPaid) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Payment for ${body.paymentPeriod.month}/${body.paymentPeriod.year} has already been completed`
                    },
                    { status: 400 }
                );
            }

            // Ensure no deposit is included in monthly payments
            const hasDeposit = body.selectedCharges.some(
                charge => charge.id === 'deposit' || charge.label.toLowerCase().includes('deposit')
            );

            if (hasDeposit) {
                return NextResponse.json(
                    { success: false, error: 'Deposit cannot be included in monthly payments' },
                    { status: 400 }
                );
            }
        }

        // Prepare payment data for M-Pesa
        const paymentData: PaymentData = {
            phoneNumber: String(body.phoneNumber).trim(),
            amount: Number(body.amount),
            partyB: Number(body.partyB),
            accountReference: body.accountReference?.trim(),
            transactionDesc: body.transactionDesc?.trim(),
            transactionType: body.transactionType,
        };

        console.log('Initiating STK push:', {
            ...paymentData,
            paymentType: body.paymentType,
            paymentPeriod: body.paymentPeriod
        });

        // Process STK push with M-Pesa
        const stkResponse = await processSTKPush(paymentData);
        console.log('STK response received:', stkResponse);

        // Create payment document with monthly tracking
        const payment = await createPaymentFromSTK(
            {
                tenantId: user._id.toString(),
                apartmentId: body.apartmentId,
                houseId: body.houseId,
                phoneNumber: body.phoneNumber,
                totalAmount: body.amount,
                selectedCharges: body.selectedCharges,
                paymentType: body.paymentType,
                paymentPeriod: body.paymentType === 'monthly' ? body.paymentPeriod : null
            },
            stkResponse
        );

        console.log('Payment document created:', {
            id: payment._id,
            type: payment.paymentType,
            period: payment.paymentPeriod
        });

        return NextResponse.json({
            success: true,
            message: 'STK push initiated successfully',
            data: {
                paymentId: payment._id,
                merchantRequestId: stkResponse.MerchantRequestID,
                checkoutRequestId: stkResponse.CheckoutRequestID,
                responseCode: stkResponse.ResponseCode,
                responseDescription: stkResponse.ResponseDescription,
                customerMessage: stkResponse.CustomerMessage,
                paymentType: body.paymentType,
                paymentPeriod: body.paymentPeriod
            }
        }, { status: 200 });

    } catch (error) {
        console.error('STK Push error:', error);

        const errorMessage = error instanceof Error
            ? getMpesaErrorMessage(error)
            : 'An unexpected error occurred';

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 400 }
        );
    }
}