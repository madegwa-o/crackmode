// app/api/payments/direct/callback/route.ts
import { NextResponse } from "next/server";
import { MpesaCallbackBody } from "@/types/mpesa";
import { updatePaymentFromCallback } from "@/lib/payment-service";

export async function POST(request: Request) {
    try {
        const body: MpesaCallbackBody = await request.json();

        console.log("📩 M-Pesa Callback received:", JSON.stringify(body, null, 2));

        const callback = body.Body.stkCallback;

        // Validate required fields
        if (!callback.MerchantRequestID || !callback.CheckoutRequestID) {
            console.error("❌ Missing required callback identifiers");
            return NextResponse.json({ error: "Missing required identifiers" }, { status: 400 });
        }

        // Update payment document
        const updatedPayment = await updatePaymentFromCallback(callback);

        if (!updatedPayment) {
            console.error("❌ Payment not found for callback:", {
                merchantRequestId: callback.MerchantRequestID,
                checkoutRequestId: callback.CheckoutRequestID
            });
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        console.log("✅ Payment updated successfully:", {
            paymentId: updatedPayment._id,
            status: updatedPayment.status,
            resultCode: callback.ResultCode,
            resultDesc: callback.ResultDesc
        });

        // Extract metadata for logging
        const items = callback.CallbackMetadata?.Item ?? [];
        const amount = items.find(i => i.Name === "Amount")?.Value;
        const receipt = items.find(i => i.Name === "MpesaReceiptNumber")?.Value;
        const phone = items.find(i => i.Name === "PhoneNumber")?.Value;

        console.log("💰 Transaction details:", { amount, receipt, phone });

        // Optional: Trigger additional processing for successful payments
        if (callback.ResultCode === 0) {
            console.log("🎉 Payment completed successfully");
        } else {
            console.log("❌ Payment failed:", callback.ResultDesc);
        }

        return NextResponse.json({
            message: "Callback processed successfully",
            paymentId: updatedPayment._id,
            status: updatedPayment.status
        });

    } catch (error) {
        console.error("❌ Callback processing error:", error);
        return NextResponse.json({
            error: "Callback processing failed",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}