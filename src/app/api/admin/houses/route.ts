// app/api/admin/houses/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connectToDatabase } from "@/lib/db"
import { House } from "@/models/House"
import { Apartment } from "@/models/Apartment"
import { getUserByEmail } from "@/lib/users"
import { Role } from "@/lib/roles"

async function isAdmin(): Promise<boolean> {
    try {
        const session = await getServerSession()
        if (!session?.user?.email) return false

        const user = await getUserByEmail(session.user.email)
        if (!user) return false

        return user.roles?.includes(Role.ADMIN) ?? false
    } catch (error) {
        console.error("Error checking admin status:", error)
        return false
    }
}

// GET - Fetch houses with filtering
export async function GET(req: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 403 }
            )
        }

        await connectToDatabase()

        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const search = searchParams.get("search") || ""
        const status = searchParams.get("status") || ""
        const apartmentId = searchParams.get("apartmentId") || ""

        const query: Record<string, unknown> = {}

        if (search) {
            query.doorNumber = { $regex: search, $options: "i" }
        }

        if (status && ["vacant", "occupied"].includes(status)) {
            query.status = status
        }

        if (apartmentId) {
            query.apartment = apartmentId
        }

        const skip = (page - 1) * limit
        const [houses, total, apartments] = await Promise.all([
            House.find(query)
                .populate("apartment", "name")
                .populate("tenant", "name email phone")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            House.countDocuments(query),
            Apartment.find({}).select("_id name").lean()
        ])

        return NextResponse.json({
            houses,
            apartments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("Error fetching houses:", error)
        return NextResponse.json(
            { error: "Failed to fetch houses" },
            { status: 500 }
        )
    }
}

// PUT - Update single or multiple houses
export async function PUT(req: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 403 }
            )
        }

        await connectToDatabase()

        const body = await req.json()
        const { houseIds, updates } = body

        if (!houseIds || !Array.isArray(houseIds) || houseIds.length === 0) {
            return NextResponse.json(
                { error: "House IDs are required" },
                { status: 400 }
            )
        }

        // Validate allowed update fields
        const allowedFields = [
            "doorNumber",
            "status",
            "rentAmount",
            "depositAmount",
            "additionalCharges"
        ]

        const updateData: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateData[key] = value
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No valid fields to update" },
                { status: 400 }
            )
        }

        // Validate status if being updated
        if (updateData.status && !["vacant", "occupied"].includes(updateData.status as string)) {
            return NextResponse.json(
                { error: "Invalid status value" },
                { status: 400 }
            )
        }

        // Validate numeric fields
        if (updateData.rentAmount !== undefined && (typeof updateData.rentAmount !== "number" || updateData.rentAmount < 0)) {
            return NextResponse.json(
                { error: "Invalid rent amount" },
                { status: 400 }
            )
        }

        if (updateData.depositAmount !== undefined && (typeof updateData.depositAmount !== "number" || updateData.depositAmount < 0)) {
            return NextResponse.json(
                { error: "Invalid deposit amount" },
                { status: 400 }
            )
        }

        // Update houses
        const result = await House.updateMany(
            { _id: { $in: houseIds } },
            { $set: updateData }
        )

        // Fetch updated houses
        const updatedHouses = await House.find({ _id: { $in: houseIds } })
            .populate("apartment", "name")
            .populate("tenant", "name email phone")
            .lean()

        return NextResponse.json({
            message: `Successfully updated ${result.modifiedCount} house(s)`,
            modifiedCount: result.modifiedCount,
            houses: updatedHouses
        })
    } catch (error) {
        console.error("Error updating houses:", error)
        return NextResponse.json(
            { error: "Failed to update houses" },
            { status: 500 }
        )
    }
}

// DELETE - Delete houses
export async function DELETE(req: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 403 }
            )
        }

        await connectToDatabase()

        const { searchParams } = new URL(req.url)
        const houseIds = searchParams.get("houseIds")

        if (!houseIds) {
            return NextResponse.json(
                { error: "House IDs are required" },
                { status: 400 }
            )
        }

        const idsArray = houseIds.split(",")

        // Check if any houses are occupied
        const occupiedHouses = await House.find({
            _id: { $in: idsArray },
            status: "occupied"
        })

        if (occupiedHouses.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete occupied houses" },
                { status: 400 }
            )
        }

        const result = await House.deleteMany({ _id: { $in: idsArray } })

        return NextResponse.json({
            message: `Successfully deleted ${result.deletedCount} house(s)`,
            deletedCount: result.deletedCount
        })
    } catch (error) {
        console.error("Error deleting houses:", error)
        return NextResponse.json(
            { error: "Failed to delete houses" },
            { status: 500 }
        )
    }
}