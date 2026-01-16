import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { Apartment } from "@/models/Apartment"
import { House } from "@/models/House"
import {IUser, User} from "@/models/User"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { Role, hasRole } from "@/lib/roles"
import { Types } from "mongoose"

const CreateApartmentSchema = z.object({
	name: z.string().min(1),
	numberOfDoors: z.number().min(1),
	houseType: z.enum(["bed_sitter", "single_stone", "single_wood"]),
	rentAmount: z.number().min(0),
	additionalCharges: z.object({
		water: z.number().min(0).optional(),
		electricity: z.number().min(0).optional(),
		other: z.array(
			z.object({
				label: z.string(),
				amount: z.number().min(0),
			})
		).optional(),
	}),
	withDeposit: z.boolean(),
	depositAmount: z.number().min(0).optional(),
	landlordPhoneNumber: z.string().min(10),
	disbursementAccount: z.object({
		type: z.enum(["safaricom", "bank"]),
		safaricomNumber: z.string().optional(),
		bankPaybill: z.string().optional(),
		bankAccountNumber: z.string().optional(),
	}).refine((data) => {
		if (data.type === "safaricom") {
			return !!data.safaricomNumber && data.safaricomNumber.length >= 10
		}
		if (data.type === "bank") {
			return !!data.bankPaybill && !!data.bankAccountNumber
		}
		return false
	}, {
		message: "Invalid disbursement account details",
	}),
})

/* -------------------------------- GET -------------------------------- */

export async function GET(req: NextRequest) {
	try {
		await connectToDatabase()
		const session = await getServerSession()

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const user = await User.findOne({ email: session.user.email }).lean<IUser>()
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 })
		}

		const { searchParams } = new URL(req.url)
		const view = searchParams.get("view")

		const isLandlordView =
			view === "landlord" &&
			hasRole(user.roles, Role.LANDLORD)

		const apartments = isLandlordView
			? await Apartment.find({ landlord: user._id })
				.populate("landlord", "name email")
				.populate(
					"houses",
					"doorNumber status rentAmount depositAmount additionalCharges"
				)
				.lean()
			: await Apartment.find()
				.populate("landlord", "name email")
				.populate(
					"houses",
					"doorNumber status rentAmount depositAmount additionalCharges"
				)
				.limit(50)
				.lean()

		return NextResponse.json({ apartments })
	} catch (error) {
		console.error("Error fetching apartments:", error)
		return NextResponse.json(
			{ error: "Failed to fetch apartments" },
			{ status: 500 }
		)
	}
}

/* -------------------------------- POST -------------------------------- */

export async function POST(req: NextRequest) {
	try {
		await connectToDatabase()
		const session = await getServerSession()

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const data = CreateApartmentSchema.parse(await req.json())

		const landlord = await User.findOne({ email: session.user.email })
		if (!landlord) {
			return NextResponse.json({ error: "User not found" }, { status: 404 })
		}

		let rolesUpdated = false

		if (!hasRole(landlord.roles, Role.LANDLORD)) {
			landlord.roles.push(Role.LANDLORD)
			await landlord.save()
			rolesUpdated = true
		}

		const apartment = await Apartment.create({
			...data,
			landlord: landlord._id,
		})

		await User.updateOne(
			{ _id: landlord._id },
			{ $addToSet: { ownedApartments: apartment._id } }
		)

		const houses: Types.ObjectId[] = []

		for (let i = 1; i <= data.numberOfDoors; i++) {
			const house = await House.create({
				apartment: apartment._id,
				doorNumber: i.toString(),
				status: "vacant",
				rentAmount: data.rentAmount,
				depositAmount: data.depositAmount,
				additionalCharges: {
					water: data.additionalCharges.water ?? 0,
					electricity: data.additionalCharges.electricity ?? 0,
					other: data.additionalCharges.other ?? [],
				},
			})

			houses.push(house._id as Types.ObjectId)
		}

		await Apartment.updateOne(
			{ _id: apartment._id },
			{ houses }
		)

		return NextResponse.json({
			apartment: {
				...apartment.toObject(),
				houses: houses.length,
			},
			...(rolesUpdated && {
				userUpdated: true,
				newRoles: landlord.roles,
			}),
		})
	} catch (e) {
		console.error("Error creating apartment:", e)

		if (e instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid data", details: e.issues },
				{ status: 400 }
			)
		}

		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Unknown error" },
			{ status: 400 }
		)
	}
}
