// lib/payment-service.ts
import { connectToDatabase } from "@/lib/db";
import { Payment } from "@/models/Payment";
import type { STKPushResponse } from "@/helpers/mpesa";
import type { MpesaStkCallback } from "@/types/mpesa";

export interface PaymentCreateData {
    tenantId: string;
    apartmentId: string;
    houseId: string;
    phoneNumber: string;
    totalAmount: number;
    paymentType: "joining" | "monthly";
    paymentPeriod: {
        month: number
        year: number
    } | null | undefined;
    selectedCharges: Array<{
        id: string;
        label: string;
        amount: number;
    }>;
}

/**
 * Create payment document after successful STK push initiation
 */
export async function createPaymentFromSTK(
    paymentData: PaymentCreateData,
    stkResponse: STKPushResponse
) {
    await connectToDatabase();

    const payment = new Payment({
        tenant: paymentData.tenantId,
        apartment: paymentData.apartmentId,
        house: paymentData.houseId,
        phoneNumber: paymentData.phoneNumber,
        totalAmount: paymentData.totalAmount,
        selectedCharges: paymentData.selectedCharges,

        // STK response fields
        merchantRequestId: stkResponse.MerchantRequestID,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        responseCode: stkResponse.ResponseCode,
        responseDescription: stkResponse.ResponseDescription,
        customerMessage: stkResponse.CustomerMessage,

        // ADD THESE MISSING FIELDS:
        paymentType: paymentData.paymentType,
        paymentPeriod: paymentData.paymentPeriod,

        status: 'pending'
    });

    return await payment.save();
}


export async function hasMonthBeenPaid(
    houseId: string,
    tenantId: string,
    month: number,
    year: number
): Promise<boolean> {
    await connectToDatabase();

    const existingPayment = await Payment.findOne({
        house: houseId,
        tenant: tenantId,
        paymentType: 'monthly',
        'paymentPeriod.month': month,
        'paymentPeriod.year': year,
        status: 'completed'
    });

    return !!existingPayment;
}

/**
 * Update payment with callback data
 */
export async function updatePaymentFromCallback(callback: MpesaStkCallback) {
    await connectToDatabase();

    const items = callback.CallbackMetadata?.Item ?? [];
    const amount = items.find(i => i.Name === "Amount")?.Value;
    const receipt = items.find(i => i.Name === "MpesaReceiptNumber")?.Value;
    const phone = items.find(i => i.Name === "PhoneNumber")?.Value;
    const balance = items.find(i => i.Name === "Balance")?.Value;

    const transactionDateRaw = items.find(i => i.Name === "TransactionDate")?.Value;

    let parsedDate: Date | undefined = undefined;
    if (transactionDateRaw) {
        const str = String(transactionDateRaw);
        // Safaricom sends format yyyyMMddHHmmss
        const year = Number(str.substring(0, 4));
        const month = Number(str.substring(4, 6)) - 1; // JS months are 0-based
        const day = Number(str.substring(6, 8));
        const hour = Number(str.substring(8, 10));
        const minute = Number(str.substring(10, 12));
        const second = Number(str.substring(12, 14));
        parsedDate = new Date(year, month, day, hour, minute, second);
    }


    const updateData = {
        resultCode: callback.ResultCode,
        resultDesc: callback.ResultDesc,
        status: callback.ResultCode === 0 ? 'completed' : 'failed',
        ...(amount && { transactionAmount: Number(amount) }),
        ...(receipt && { mpesaReceiptNumber: String(receipt) }),
        ...(phone && { phoneNumber: String(phone) }),
        ...(parsedDate && { transactionDate: parsedDate }),
        ...(balance && { balance: String(balance) })
    };

    return Payment.findOneAndUpdate(
        {
            merchantRequestId: callback.MerchantRequestID,
            checkoutRequestId: callback.CheckoutRequestID
        },
        updateData,
        {new: true}
    );
}

/**
 * Get payment by STK identifiers
 */
export async function getPaymentBySTKIds(merchantRequestId: string, checkoutRequestId: string) {
    await connectToDatabase();

    return Payment.findOne({
        merchantRequestId,
        checkoutRequestId
    }).populate(['tenant', 'apartment', 'house']);
}