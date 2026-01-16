// app/api/emails/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { getUserByEmail } from "@/lib/users";
import { Role } from "@/lib/roles";

// Helper function to check if user is admin
async function isAdmin(): Promise<boolean> {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) return false;

        const user = await getUserByEmail(session.user.email);
        if (!user) return false;

        return user.roles?.includes(Role.ADMIN) ?? false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

export async function GET(req: NextRequest) {
    try {
        // Check admin authorization
        if (!(await isAdmin())) {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 403 }
            );
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role") || "";

        // Build query
        const query: Record<string, unknown> = {};

        if (role && Object.values(Role).includes(role as Role)) {
            query.roles = { $in: [role as Role] };
        }

        // Get all users with email only
        const users = await User.find(query)
            .select("name email")
            .sort({ name: 1 })
            .lean();

        return NextResponse.json({
            users: users.map(u => ({
                _id: u._id,
                name: u.name,
                email: u.email,
            })),
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}