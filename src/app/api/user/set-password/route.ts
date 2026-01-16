import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { updateUserPassword } from "@/lib/users"

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession()

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { password } = await req.json()

        if (!password || password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
        }

        const updatedUser = await updateUserPassword(session.user.email, password)

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: "Password set successfully" })
    } catch (error) {
        console.error("Set password error:", error)
        return NextResponse.json({ error: "Failed to set password" }, { status: 500 })
    }
}
