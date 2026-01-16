// app/api/houses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { House, Payment } from "@/models";

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get("tenantId");

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
        }

        // Get houses with apartment details
        const houses = await House.find({
            tenant: tenantId,
            status: "occupied",
        })
            .populate("apartment", "name houseType rentAmount additionalCharges landlordPhoneNumber disbursementAccount landlord depositAmount withDeposit")
            .lean();

        // Get payment details for each house
        const housesWithPayments = await Promise.all(
            houses.map(async (house) => {
                // Get all payments for this house
                const payments = await Payment.find({
                    house: house._id,
                    tenant: tenantId
                })
                    .sort({ createdAt: -1 }) // Most recent first
                    .lean();

                // Get latest completed payment
                const latestCompletedPayment = payments.find(p => p.status === 'completed') || null;

                // Get payment statistics
                const completedPayments = payments.filter(p => p.status === 'completed');
                const totalPaid = completedPayments.reduce((sum, p) => sum + p.totalAmount, 0);
                const pendingPayments = payments.filter(p => p.status === 'pending');

                return {
                    ...house,
                    paymentDetails: {
                        latestPayment: payments[0] || null,
                        totalPayments: payments.length,
                        completedPayments: completedPayments.length,
                        pendingPayments: pendingPayments.length,
                        totalAmountPaid: totalPaid,
                        paymentHistory: payments.slice(0, 10), // Last 10 payments
                        // Use createdAt (from timestamps) or fallback to transactionDate
                        lastPaymentDate: latestCompletedPayment?.createdAt || latestCompletedPayment?.transactionDate || null,
                        lastPaymentStatus: latestCompletedPayment?.status || null,
                        lastPaymentAmount: latestCompletedPayment?.totalAmount || 0,
                        pendingAmount: pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0)
                    }
                };
            })
        );

        return NextResponse.json({
            houses: housesWithPayments,
            count: housesWithPayments.length,
        });
    } catch (error) {
        console.error("Error fetching houses by tenant:", error);
        return NextResponse.json({ error: "Failed to fetch houses" }, { status: 500 });
    }
}