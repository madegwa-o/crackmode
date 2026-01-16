// app/api/users/usernames/route.ts
import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
    try {
        await connectToDatabase();

        // Fetch all users with non-null usernames
        const users = await User.find(
            {
                username: {
                    $exists: true,
                    $nin: [null, ""]
                }
            },
            { username: 1, _id: 0 }
        ).lean();

        // Extract just the usernames
        const usernames = users
            .map(user => user.username)
            .filter((username): username is string => !!username);

        return NextResponse.json({
            success: true,
            usernames,
            count: usernames.length
        });
    } catch (error) {
        console.error("Error fetching usernames:", error);
        return NextResponse.json(
            { error: "Failed to fetch usernames" },
            { status: 500 }
        );
    }
}