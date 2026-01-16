// app/api/apartments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/db";
import { Apartment, Payment, User, House } from "@/models";
import {IUser} from "@/models/User";
import {hasRole, Role} from "@/lib/roles";

interface ExtendedUser {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
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

        // Get apartment with landlord details
        const apartment = await Apartment.findById(id)
            .populate("landlord", "name email")
            .lean();

        if (!apartment) {
            return NextResponse.json(
                { error: "Apartment not found" },
                { status: 404 }
            );
        }

        const landlord = apartment.landlord as IUser;
        if (landlord._id.toString() !== user._id.toString()) {
            return NextResponse.json(
                { error: "Access denied. You can only manage your own apartments." },
                { status: 403 }
            );
        }

        // Get houses with tenant details
        const houses = await House.find({ apartment: id })
            .populate("tenant", "name email phone")
            .lean();

        // Get payment details for each house
        const housesWithPaymentDetails = await Promise.all(
            houses.map(async (house) => {
                // Get all payments for this house
                const payments = await Payment.find({ house: house._id })
                    .populate("tenant", "name email")
                    .sort({ createdAt: -1 })
                    .lean();

                // Calculate payment statistics
                const completedPayments = payments.filter(p => p.status === 'completed');
                const pendingPayments = payments.filter(p => p.status === 'pending');
                const failedPayments = payments.filter(p => p.status === 'failed');

                const totalPaid = completedPayments.reduce((sum, p) => sum + p.totalAmount, 0);
                const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0);

                // Calculate rent status for current month
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
                } else if (dayOfMonth <= 5) { // Grace period first 5 days
                    rentStatus = 'pending';
                } else {
                    rentStatus = 'overdue';
                }

                return {
                    ...house,
                    paymentSummary: {
                        totalPayments: payments.length,
                        completedPayments: completedPayments.length,
                        pendingPayments: pendingPayments.length,
                        failedPayments: failedPayments.length,
                        totalAmountPaid: totalPaid,
                        pendingAmount: pendingAmount,
                        lastPayment: payments[0] || null,
                        recentPayments: payments.slice(0, 5), // Last 5 payments
                        rentStatus,
                        currentMonthPaid: hasCurrentMonthRentPayment,
                        currentMonthAmount: currentMonthPayments.reduce((sum, p) => sum + p.totalAmount, 0)
                    }
                };
            })
        );

        // Calculate apartment-level analytics
        const occupiedHouses = housesWithPaymentDetails.filter(h => h.status === 'occupied');
        const vacantHouses = housesWithPaymentDetails.filter(h => h.status === 'vacant');

        const totalPotentialIncome = housesWithPaymentDetails.length * apartment.rentAmount;
        const totalCurrentIncome = occupiedHouses.reduce((sum, house) =>
            sum + (house.paymentSummary.currentMonthPaid ? apartment.rentAmount : 0), 0
        );

        const totalCollected = housesWithPaymentDetails.reduce((sum, house) =>
            sum + house.paymentSummary.totalAmountPaid, 0
        );

        const paidRentCount = occupiedHouses.filter(h => h.paymentSummary.rentStatus === 'paid').length;
        const overdueRentCount = occupiedHouses.filter(h => h.paymentSummary.rentStatus === 'overdue').length;
        const pendingRentCount = occupiedHouses.filter(h => h.paymentSummary.rentStatus === 'pending').length;

        const analytics = {
            totalUnits: housesWithPaymentDetails.length,
            occupiedUnits: occupiedHouses.length,
            vacantUnits: vacantHouses.length,
            occupancyRate: housesWithPaymentDetails.length > 0
                ? (occupiedHouses.length / housesWithPaymentDetails.length) * 100
                : 0,
            potentialMonthlyIncome: totalPotentialIncome,
            currentMonthIncome: totalCurrentIncome,
            collectionRate: totalPotentialIncome > 0
                ? (totalCurrentIncome / totalPotentialIncome) * 100
                : 0,
            totalCollected,
            paidRentCount,
            pendingRentCount,
            overdueRentCount,
            averagePaymentAmount: occupiedHouses.length > 0
                ? totalCollected / occupiedHouses.length
                : 0
        };

        const response = {
            apartment,
            houses: housesWithPaymentDetails,
            analytics,
            summary: {
                totalUnits: analytics.totalUnits,
                occupied: analytics.occupiedUnits,
                vacant: analytics.vacantUnits,
                monthlyIncome: analytics.currentMonthIncome,
                totalCollected: analytics.totalCollected
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error("Error fetching apartment details:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}