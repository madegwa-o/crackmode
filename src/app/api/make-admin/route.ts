// app/api/make-admin/route.ts
import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { User } from "@/models/User"
import { Role } from "@/lib/roles"

export async function POST() {
    try {
        await connectToDatabase()

        const email = "madegwakidi@gmail.com"
        const user = await User.findOne({ email })

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // Ensure roles array exists
        user.roles = user.roles ?? [Role.USER]

        if (!user.roles.includes(Role.ADMIN)) {
            user.roles.push(Role.ADMIN)
            await user.save()
        }

        return NextResponse.json({
            message: `${user.email} is now an admin`,
            roles: user.roles,
        })
    } catch (error) {
        console.error("Error making admin:", error)
        return NextResponse.json(
            { error: "Failed to promote user to admin" },
            { status: 500 }
        )
    }
}
