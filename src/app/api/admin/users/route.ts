// app/api/admin/users/route.ts
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {connectToDatabase} from "@/lib/db";
import { User} from "@/models/User";
import {getUserByEmail} from "@/lib/users";
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


// GET - Fetch all users
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

        // Get query parameters for filtering/pagination
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || "";

        // Build query
        const query: Record<string, unknown> = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } }
            ];
        }

        if (role && Object.values(Role).includes(role as Role)) {
            query.roles = { $in: [role as Role] };
        }


        // Execute query with pagination
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            User.find(query)
                .select("-__v")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ]);

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

// PUT - Update a user
export async function PUT(req: NextRequest) {
    try {
        // Check admin authorization
        if (!(await isAdmin())) {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 403 }
            );
        }

        await connectToDatabase();

        const body = await req.json();
        const { userId, ...updates } = body;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Validate allowed update fields
        const allowedFields = ["name", "email", "phone", "roles", "image"];
        const updateData: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateData[key] = value;
            }
        }

        // Validate roles if being updated
        if (updateData.roles) {
            const roles = updateData.roles as Role[];
            const validRoles = Object.values(Role);

            const invalidRoles = roles.filter(r => !validRoles.includes(r));
            if (invalidRoles.length > 0) {
                return NextResponse.json(
                    { error: `Invalid roles: ${invalidRoles.join(", ")}` },
                    { status: 400 }
                );
            }
        }


        // Validate email format if being updated
        if (updateData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updateData.email as string)) {
                return NextResponse.json(
                    { error: "Invalid email format" },
                    { status: 400 }
                );
            }

            // Check if email already exists
            const existingUser = await User.findOne({
                email: updateData.email,
                _id: { $ne: userId }
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: "Email already in use" },
                    { status: 409 }
                );
            }
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!updatedUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "User updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a user
export async function DELETE(req: NextRequest) {
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
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Prevent self-deletion
        const session = await getServerSession();
        const currentUser = session?.user as { email?: string };

        const userToDelete = await User.findById(userId);

        if (!userToDelete) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (userToDelete.email === currentUser?.email) {
            return NextResponse.json(
                { error: "You cannot delete your own account" },
                { status: 400 }
            );
        }

        // Delete the user
        await User.findByIdAndDelete(userId);

        return NextResponse.json({
            message: "User deleted successfully",
            deletedUserId: userId
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}