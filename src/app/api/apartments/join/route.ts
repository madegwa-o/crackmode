// app/api/apartments/join/route.ts - Updated to use house-specific charges
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { House, IHouse } from "@/models/House";
import { Apartment, IApartment } from "@/models/Apartment";
import { User, IUser } from "@/models/User";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { Role } from "@/lib/roles"

const JoinApartmentSchema = z.object({
	apartmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid apartment ID format"),
	houseId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid house ID format"),
	phone: z.string()
		.regex(
			/^(?:\+?254(7\d{8}|1\d{8})|0(7\d{8}|1\d{8}))$/,
			"Phone must be Kenyan (2547XXXXXXXX / 2541XXXXXXXX / +2547XXXXXXXX / 07XXXXXXXX / 01XXXXXXXX)"
		)
		.transform(val => {
			if (val.startsWith("+")) {
				val = val.slice(1);
			}
			if (val.startsWith("0")) {
				val = "254" + val.slice(1);
			}
			return val;
		}),
	selectedCharges: z.array(
		z.object({
			id: z.string(),
			label: z.string(),
			amount: z.number().min(0),
		})
	),
	totalAmount: z.number().min(0),
});

export async function POST(req: NextRequest) {
	try {
		await connectToDatabase();

		const session = await getServerSession();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
		}

		const { apartmentId, houseId, phone, selectedCharges, totalAmount } =
			JoinApartmentSchema.parse(await req.json());

		console.log('selectedCharges: ', selectedCharges, ' so totalAmount is: ', totalAmount);

		const user: IUser | null = await User.findOne({ email: session.user.email });
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const house: IHouse | null = await House.findById(houseId);
		if (!house) {
			return NextResponse.json({ error: "House not found" }, { status: 404 });
		}

		// Validate house availability
		if (house.status !== "vacant") {
			return NextResponse.json({ error: "House is already occupied" }, { status: 400 });
		}

		const apartment: IApartment | null = await Apartment.findById(apartmentId);
		if (!apartment) {
			return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
		}

		// Validate house belongs to apartment
		if (house.apartment.toString() !== apartmentId) {
			return NextResponse.json({ error: "House does not belong to this apartment" }, { status: 400 });
		}

		// Update this section in /api/apartments/join/route.ts around line 75-85

// Validate selected charges match house charges
		const expectedCharges = [];

// Add rent charge
		expectedCharges.push({
			id: "rent",
			label: "Rent",
			amount: house.rentAmount
		});

// Add deposit if required - use house deposit if available, otherwise apartment deposit
		console.log('deposit house:  ', house );
		console.log('deposit apartment:  ', apartment );
		const depositAmount = house.depositAmount ?? apartment.depositAmount;

		if (depositAmount) {
			expectedCharges.push({
				id: "deposit",
				label: "Deposit",
				amount: depositAmount  // Now correctly uses house deposit first
			});
		}

// Add house-specific utility charges
		if (house.additionalCharges.water && house.additionalCharges.water > 0) {
			expectedCharges.push({
				id: "water",
				label: "Water",
				amount: house.additionalCharges.water
			});
		}

		if (house.additionalCharges.electricity && house.additionalCharges.electricity > 0) {
			expectedCharges.push({
				id: "electricity",
				label: "Electricity",
				amount: house.additionalCharges.electricity
			});
		}

// Add other charges from house
		if (house.additionalCharges.other && house.additionalCharges.other.length > 0) {
			house.additionalCharges.other.forEach((charge, index) => {
				expectedCharges.push({
					id: `other-${index}`,
					label: charge.label,
					amount: charge.amount
				});
			});
		}

// Validate total amount
		const expectedTotal = expectedCharges.reduce((sum, charge) => sum + charge.amount, 0);
		console.log('expected charges: ', expectedCharges);
		console.log('Total amount: ', totalAmount, ' Expected: ' + expectedTotal);
		if (Math.abs(totalAmount - expectedTotal) > 0.01) {
			return NextResponse.json({
				error: "Total amount mismatch",
				details: `Expected ${expectedTotal}, received ${totalAmount}`
			}, { status: 400 });
		}

		console.log('user: ', user);

		// Start database transaction
		const session_db = await User.startSession();

		try {
			await session_db.withTransaction(async () => {
				// Update user document
				await User.updateOne(
					{ _id: user._id },
					{
						$addToSet: {
							joinedApartments: apartmentId,
							roles: { $each: [Role.TENANT] },
							rentedHouses: {
								apartment: apartmentId,
								houseId,
							},
						},
						$set: { phone },
					},
					{ session: session_db }
				);


				// Update house status and assign tenant
				await House.updateOne(
					{ _id: houseId },
					{
						$set: {
							status: "occupied",
							tenant: user._id
						}
					},
					{ session: session_db }
				);
			});

			await session_db.commitTransaction();

		} catch (transactionError) {
			await session_db.abortTransaction();
			console.error("Transaction failed:", transactionError);
			throw transactionError;
		} finally {
			await session_db.endSession();
		}

		// Return success response with house-specific details
		return NextResponse.json({
			success: true,
			message: "Successfully joined the apartment!",
			data: {
				apartment: {
					id: apartment._id,
					name: apartment.name
				},
				house: {
					id: house._id,
					doorNumber: house.doorNumber,
					rentAmount: house.rentAmount,
					additionalCharges: house.additionalCharges
				},
				user: {
					id: user._id,
					name: user.name,
					phone: phone
				},
				charges: selectedCharges,
				totalAmount: totalAmount
			}
		}, { status: 200 });

	} catch (error: unknown) {
		console.error("Error in join apartment API:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json({
				error: "Invalid request data",
				details: error.issues.map(issue => ({
					field: issue.path.join('.'),
					message: issue.message
				}))
			}, { status: 400 });
		}

		if (error && typeof error === 'object' && 'code' in error) {
			if (error.code === 11000) {
				return NextResponse.json({
					error: "Duplicate entry - you may already be joined to this apartment"
				}, { status: 409 });
			}
		}

		const message = error instanceof Error ? error.message : "An unexpected error occurred";
		return NextResponse.json(
			{ error: "Internal server error", details: message },
			{ status: 500 }
		);
	}
}

export async function GET(req: NextRequest) {
	try {
		await connectToDatabase();

		const session = await getServerSession();
		if (!session?.user?.email) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const user = await User.findOne({ email: session.user.email })
			.populate({
				path: 'currentHouse.apartment',
				model: 'Apartment',
				select: 'name houseType'
			})
			.populate({
				path: 'currentHouse.house',
				model: 'House',
				select: 'doorNumber status rentAmount additionalCharges'
			})
			.select('name email currentHouse joinedApartments roles');

		if (!user) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				roles: user.roles,
				joinedApartments: user.joinedApartments
			}
		});

	} catch (error) {
		console.error("Error fetching user apartment status:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}