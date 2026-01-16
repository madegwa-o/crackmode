// app/api/apartments/[id]/tenants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/db";
import { Apartment, User, House, Payment } from "@/models";
import { Types } from "mongoose";
import {hasRole, Role} from "@/lib/roles";

interface ExtendedUser {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
}

interface PopulatedTenant {
    _id: Types.ObjectId;
    name: string;
    email: string;
    phone?: string;
}

interface HouseDocument {
    _id: Types.ObjectId;
    doorNumber: string;
    status: "vacant" | "occupied";
    tenant?: PopulatedTenant;
    createdAt: Date;
}

interface PaymentDocument {
    _id: Types.ObjectId;
    totalAmount: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    transactionDate: Date;
    selectedCharges: Array<{
        id: string;
        label: string;
        amount: number;
    }>;
    mpesaReceiptNumber?: string;
    createdAt: Date;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();

        const session = await getServerSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userFromSession = session.user as ExtendedUser;
        const userEmail = userFromSession.email as string;

        const user = await User.findOne({ email: userEmail.toLowerCase() });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!hasRole(user.roles as Role[], Role.LANDLORD)) {
            return NextResponse.json(
                { error: "Access denied. Landlord role required." },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Get apartment
        const apartment = await Apartment.findById(id)
            .select('name landlord')
            .lean();

        if (!apartment) {
            return NextResponse.json(
                { error: "Apartment not found" },
                { status: 404 }
            );
        }

        // Verify ownership
        const landlordId = typeof apartment.landlord === 'object' && '_id' in apartment.landlord
            ? apartment.landlord._id
            : apartment.landlord;

        if (landlordId.toString() !== user._id.toString()) {
            return NextResponse.json(
                { error: "Access denied. You can only manage your own apartments." },
                { status: 403 }
            );
        }

        // Get occupied houses with tenant details
        const houses = await House.find({ apartment: id, status: 'occupied' })
            .populate<{ tenant?: PopulatedTenant }>("tenant", "name email phone")
            .select('doorNumber status tenant createdAt')
            .sort({ doorNumber: 1 })
            .lean<HouseDocument[]>();

        // Get payment details for each house
        const tenantsWithPayments = await Promise.all(
            houses.map(async (house) => {
                if (!house.tenant) return null;

                // Get all payments for this house
                const payments = await Payment.find({ house: house._id })
                    .select('totalAmount status transactionDate selectedCharges mpesaReceiptNumber createdAt')
                    .sort({ createdAt: -1 })
                    .lean<PaymentDocument[]>();

                // Calculate statistics
                const completedPayments = payments.filter(p => p.status === 'completed');
                const pendingPayments = payments.filter(p => p.status === 'pending');
                const failedPayments = payments.filter(p => p.status === 'failed');

                const totalPaid = completedPayments.reduce((sum, p) => sum + p.totalAmount, 0);
                const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0);

                // Check current month rent status
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const currentMonthPayments = completedPayments.filter(p => {
                    const paymentDate = new Date(p.transactionDate);
                    return paymentDate.getMonth() === currentMonth &&
                        paymentDate.getFullYear() === currentYear;
                });

                const hasCurrentMonthRentPayment = currentMonthPayments.some(p =>
                    p.selectedCharges.some(charge => charge.id === 'rent')
                );

                // Determine rent status
                let rentStatus: 'paid' | 'pending' | 'overdue' = 'overdue';
                const today = new Date();
                const dayOfMonth = today.getDate();

                if (hasCurrentMonthRentPayment) {
                    rentStatus = 'paid';
                } else if (dayOfMonth <= 5) {
                    rentStatus = 'pending';
                } else {
                    rentStatus = 'overdue';
                }

                return {
                    _id: house._id.toString(),
                    doorNumber: house.doorNumber,
                    tenant: {
                        name: house.tenant.name,
                        email: house.tenant.email,
                        phone: house.tenant.phone || null,
                    },
                    occupiedSince: house.createdAt,
                    paymentSummary: {
                        totalPayments: payments.length,
                        completedPayments: completedPayments.length,
                        pendingPayments: pendingPayments.length,
                        failedPayments: failedPayments.length,
                        totalAmountPaid: totalPaid,
                        pendingAmount: pendingAmount,
                        lastPaymentDate: completedPayments[0]?.createdAt || null,
                        rentStatus,
                        currentMonthPaid: hasCurrentMonthRentPayment,
                        currentMonthAmount: currentMonthPayments.reduce((sum, p) => sum + p.totalAmount, 0),
                        recentPayments: payments.slice(0, 10).map(p => ({
                            _id: p._id.toString(),
                            totalAmount: p.totalAmount,
                            status: p.status,
                            createdAt: p.createdAt,
                            selectedCharges: p.selectedCharges,
                            mpesaReceiptNumber: p.mpesaReceiptNumber || null,
                        })),
                    },
                };
            })
        );

        // Filter out null values
        const tenants = tenantsWithPayments.filter(t => t !== null);

        // Calculate summary
        const paidRentCount = tenants.filter(t => t.paymentSummary.rentStatus === 'paid').length;
        const pendingRentCount = tenants.filter(t => t.paymentSummary.rentStatus === 'pending').length;
        const overdueRentCount = tenants.filter(t => t.paymentSummary.rentStatus === 'overdue').length;

        return NextResponse.json({
            apartmentName: apartment.name,
            tenants,
            summary: {
                total: tenants.length,
                paidRent: paidRentCount,
                pendingRent: pendingRentCount,
                overdueRent: overdueRentCount,
            }
        });

    } catch (error) {
        console.error("Error fetching tenants:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}