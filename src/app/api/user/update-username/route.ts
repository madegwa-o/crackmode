
// ============================================
// app/api/user/update-username/route.ts
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { User } from "@/models/User";
import { connectToDatabase } from "@/lib/db";

interface UserData {
    name: string;
    email: string;
    username: string;
}

export async function GET() {
    try {
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectToDatabase();

        const user = await User.findOne({ email: session?.user?.email }).lean<UserData | null>();

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            username: user.username,
            email: user.email,
            name: user.name,
        });
    } catch (error) {
        console.error("Error fetching username:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { username } = await req.json();

        // Validate username
        if (!username || username.trim().length < 3) {
            return NextResponse.json(
                { error: "Username must be at least 3 characters long" },
                { status: 400 }
            );
        }

        if (username.length > 30) {
            return NextResponse.json(
                { error: "Username must not exceed 30 characters" },
                { status: 400 }
            );
        }
        //
        // // Check if username contains only valid characters
        // if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        //     return NextResponse.json(
        //         { error: "Username can only contain letters, numbers, and underscores" },
        //         { status: 400 }
        //     );
        // }

        await connectToDatabase();

        // Check if username is already taken by another user
        const existingUser = await User.findOne({
            username: username,
            email: { $ne: session.user.email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Username is already taken" },
                { status: 409 }
            );
        }

        // Update the username
        const user = await User.findOneAndUpdate(
            { email: session.user.email },
            { username: username.trim() },
            { new: true, runValidators: true }
        );

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            username: user.username,
            message: "Username updated successfully"
        });
    } catch (error) {
        console.error("Username update error:", error);
        return NextResponse.json(
            { error: "Failed to update username" },
            { status: 500 }
        );
    }
}