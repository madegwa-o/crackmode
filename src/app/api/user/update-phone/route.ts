// app/api/user/update-phone/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { User } from "@/models/User";
import {connectToDatabase} from "@/lib/db";


interface UserData {
    name: string;
    email: string;
    phone: string;
}
export async function GET() {

    try {
        const session = await getServerSession();

        if (!session) {
            throw new Error('User not found');
        }

        const user = await User.findOne({email: session?.user?.email}).lean<UserData | null>();

        return NextResponse.json({
            username: user?.name,
            email: user?.email,
            phone: user?.phone,
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({
            message: 'Internal Server Error',
        });

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

        const { phone } = await req.json();

        // Validate phone number format (basic validation)
        if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
            return NextResponse.json(
                { error: "Invalid phone number format" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const user = await User.findOneAndUpdate(
            { email: session.user.email },
            { phone: phone || null },
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
            phone: user.phone,
            message: "Phone number updated successfully"
        });
    } catch (error) {
        console.error("Phone update error:", error);
        return NextResponse.json(
            { error: "Failed to update phone number" },
            { status: 500 }
        );
    }
}