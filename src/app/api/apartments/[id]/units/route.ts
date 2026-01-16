// app/api/apartments/[id]/units/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/db";
import { Apartment, User, House } from "@/models";
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
}

interface HouseDocument {
	_id: Types.ObjectId;
	apartment: Types.ObjectId;
	doorNumber: string;
	status: "vacant" | "occupied";
	tenant?: PopulatedTenant;
	rentAmount: number;
	depositAmount: number;
	createdAt: Date;
	updatedAt: Date;
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

		// Get apartment basic details
		const apartment = await Apartment.findById(id)
			.select('name landlord')
			.lean();

		if (!apartment) {
			return NextResponse.json(
				{ error: "Apartment not found" },
				{ status: 404 }
			);
		}

		// Verify landlord ownership
		const landlordId = typeof apartment.landlord === 'object' && '_id' in apartment.landlord
			? apartment.landlord._id
			: apartment.landlord;

		if (landlordId.toString() !== user._id.toString()) {
			return NextResponse.json(
				{ error: "Access denied. You can only manage your own apartments." },
				{ status: 403 }
			);
		}

		// Get houses with minimal tenant information
		const houses = await House.find({ apartment: id })
			.populate<{ tenant?: PopulatedTenant }>("tenant", "name")
			.select('doorNumber status tenant createdAt rentAmount depositAmount')
			.sort({ doorNumber: 1 })
			.lean<HouseDocument[]>();

		// Format the response
		const units = houses.map(house => ({
			_id: house._id.toString(),
			doorNumber: house.doorNumber,
			status: house.status,
			tenantName: house.tenant?.name || null,
			occupiedSince: house.status === 'occupied' ? house.createdAt : null,
			rentAmount: house.rentAmount,
			depositAmount: house.depositAmount || null,
		}));

		// Calculate summary statistics
		const totalUnits = units.length;
		const occupiedUnits = units.filter(u => u.status === 'occupied').length;
		const vacantUnits = units.filter(u => u.status === 'vacant').length;

		return NextResponse.json({
			apartmentName: apartment.name,
			units,
			summary: {
				total: totalUnits,
				occupied: occupiedUnits,
				vacant: vacantUnits,
				occupancyRate: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
			}
		});

	} catch (error) {
		console.error("Error fetching apartment units:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}