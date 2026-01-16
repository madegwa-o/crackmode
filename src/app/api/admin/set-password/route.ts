// app/api/admin/set-password/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { updateUserPassword, getUserByEmail } from "@/lib/users"
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

export async function POST(req: NextRequest) {
    try {
        // Check admin authorization
        if (!(await isAdmin())) {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 403 }
            )
        }

        const { email, password } = await req.json()

        // Validate inputs
        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            )
        }

        if (!password || password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            )
        }

        // Check if user exists
        const targetUser = await getUserByEmail(email)
        if (!targetUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // Update the password
        const updatedUser = await updateUserPassword(email, password)

        if (!updatedUser) {
            return NextResponse.json(
                { error: "Failed to update password" },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: "Password updated successfully",
            user: {
                email: updatedUser.email,
                name: updatedUser.name
            }
        })
    } catch (error) {
        console.error("Admin set password error:", error)
        return NextResponse.json(
            { error: "Failed to set password" },
            { status: 500 }
        )
    }
}