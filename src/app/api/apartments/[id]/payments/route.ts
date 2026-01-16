// app/api/apartments/[id]/payments/route.ts
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

interface PopulatedHouse {
	_id: Types.ObjectId;
	doorNumber: string;
	tenant?: PopulatedTenant;
}

interface PopulatedPayment {
	_id: Types.ObjectId;
	house: {
		_id: Types.ObjectId;
		doorNumber: string;
	};
	tenant: PopulatedTenant;
	totalAmount: number;
	status: 'pending' | 'completed' | 'failed' | 'cancelled';
	createdAt: Date;
	transactionDate: Date;
	selectedCharges: Array<{
		id: string;
		label: string;
		amount: number;
	}>;
	mpesaReceiptNumber?: string;
	phoneNumber: string;
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

		// Get filter parameters from query string
		const { searchParams } = new URL(request.url);
		const filterMonth = searchParams.get('month');
		const filterYear = searchParams.get('year');

		// Default to current month/year if not provided
		const now = new Date();
		const month = filterMonth ? parseInt(filterMonth) : now.getMonth() + 1;
		const year = filterYear ? parseInt(filterYear) : now.getFullYear();

		// Verify apartment ownership
		const apartment = await Apartment.findById(id)
			.select('name landlord')
			.lean();

		if (!apartment) {
			return NextResponse.json(
				{ error: "Apartment not found" },
				{ status: 404 }
			);
		}

		const landlordId = typeof apartment.landlord === 'object' && '_id' in apartment.landlord
			? apartment.landlord._id
			: apartment.landlord;

		if (landlordId.toString() !== user._id.toString()) {
			return NextResponse.json(
				{ error: "Access denied. You can only manage your own apartments." },
				{ status: 403 }
			);
		}

		// Get all occupied houses
		const houses = await House.find({ apartment: id, status: 'occupied' })
			.populate<{ tenant?: PopulatedTenant }>('tenant', 'name email phone')
			.select('doorNumber tenant')
			.lean<PopulatedHouse[]>();

		// Get payments for the specified month/year
		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0, 23, 59, 59);

		const payments = await Payment.find({
			apartment: id,
			transactionDate: { $gte: startDate, $lte: endDate }
		})
			.populate('house', 'doorNumber')
			.populate('tenant', 'name email phone')
			.select('house tenant totalAmount status createdAt transactionDate selectedCharges mpesaReceiptNumber phoneNumber')
			.sort({ transactionDate: -1 })
			.lean<PopulatedPayment[]>();

		// Create a map of house payments
		const housePaymentMap = new Map<string, PopulatedPayment[]>();
		payments.forEach(payment => {
			const houseId = payment.house._id.toString();
			if (!housePaymentMap.has(houseId)) {
				housePaymentMap.set(houseId, []);
			}
			housePaymentMap.get(houseId)!.push(payment);
		});

		// Build tenant payment records
		const tenantPayments = houses.map(house => {
			const houseId = house._id.toString();
			const housePayments = housePaymentMap.get(houseId) || [];

			// Check if rent was paid this month
			const hasRentPayment = housePayments.some(p =>
				p.status === 'completed' &&
				p.selectedCharges.some(c => c.id === 'rent')
			);

			const completedPayments = housePayments.filter(p => p.status === 'completed');
			const totalPaid = completedPayments.reduce((sum, p) => sum + p.totalAmount, 0);

			return {
				_id: house._id.toString(),
				doorNumber: house.doorNumber,
				tenant: house.tenant ? {
					name: house.tenant.name,
					email: house.tenant.email,
					phone: house.tenant.phone || null,
				} : null,
				hasPaid: hasRentPayment,
				totalPaid,
				paymentCount: completedPayments.length,
				payments: housePayments.map(p => ({
					_id: p._id.toString(),
					totalAmount: p.totalAmount,
					status: p.status,
					createdAt: p.createdAt,
					transactionDate: p.transactionDate,
					selectedCharges: p.selectedCharges,
					mpesaReceiptNumber: p.mpesaReceiptNumber || null,
					phoneNumber: p.phoneNumber,
				})),
			};
		});

		// Sort: unpaid first, then by door number
		tenantPayments.sort((a, b) => {
			if (a.hasPaid === b.hasPaid) {
				return a.doorNumber.localeCompare(b.doorNumber, undefined, { numeric: true });
			}
			return a.hasPaid ? 1 : -1;
		});

		// Calculate summary
		const paidCount = tenantPayments.filter(t => t.hasPaid).length;
		const unpaidCount = tenantPayments.filter(t => !t.hasPaid).length;
		const totalCollected = tenantPayments.reduce((sum, t) => sum + t.totalPaid, 0);

		return NextResponse.json({
			apartmentName: apartment.name,
			filterPeriod: {
				month,
				year,
				monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' })
			},
			tenantPayments,
			summary: {
				total: tenantPayments.length,
				paid: paidCount,
				unpaid: unpaidCount,
				totalCollected,
			}
		});

	} catch (error) {
		console.error("Error fetching payments:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}