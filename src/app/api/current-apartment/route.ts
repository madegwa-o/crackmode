import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connectToDatabase } from "@/lib/db"
import { User } from "@/models/User"
import { Types } from "mongoose"
import "@/models/Apartment" // Ensure model is registered for population

interface ApartmentDoc {
    _id: Types.ObjectId
    name: string
}

interface PopulatedUser {
    ownedApartments?: ApartmentDoc[]
    joinedApartments?: ApartmentDoc[]
}

export async function GET() {
    try {
        const session = await getServerSession()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectToDatabase()

        const user = await User.findOne({ email: session.user.email })
            .populate("ownedApartments", "name _id")
            .populate("joinedApartments", "name _id")
            .lean<PopulatedUser>()

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Use _id instead of id when working with lean()
        const owned = (user.ownedApartments || []).map((apt) => ({
            id: apt._id.toString(),
            name: apt.name,
            type: "Owned",
        }))

        const joined = (user.joinedApartments || []).map((apt) => ({
            id: apt._id.toString(),
            name: apt.name,
            type: "Joined",
        }))

        // Combined list for the selector
        return NextResponse.json([...owned, ...joined])
    } catch (error) {
        console.error("Error fetching user apartments:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}