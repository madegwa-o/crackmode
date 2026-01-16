import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";

import { House, User } from "@/models";
import { Role, hasAnyRole } from "@/lib/roles";
import {z} from "zod";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ houseId: string }> }
) {
    try {

        const { houseId } = await params;
        await connectToDatabase();

        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const actor = await User.findOne({ email: session.user.email });
        if (!actor || !hasAnyRole(actor.roles, [Role.ADMIN, Role.LANDLORD, Role.CARETAKER])) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const house = await House.findById(houseId);
        if (!house || !house.tenant) {
            return NextResponse.json(
                { error: "House has no tenant" },
                { status: 400 }
            );
        }

        const tenant = await User.findById(house.tenant);
        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        const sessionDb = await User.startSession();

        try {
            await sessionDb.withTransaction(async () => {
                // Vacate house
                await House.updateOne(
                    { _id: house._id },
                    {
                        $set: { status: "vacant" },
                        $unset: { tenant: "" },
                    },
                    { session: sessionDb }
                );

                // Remove rented house entry
                await User.updateOne(
                    { _id: tenant._id },
                    {
                        $pull: {
                            rentedHouses: { houseId: house._id },
                        },
                    },
                    { session: sessionDb }
                );

                // Reload tenant to check remaining rentals
                const updatedTenant = await User.findById(tenant._id).session(sessionDb);

                if (!updatedTenant?.rentedHouses?.length) {
                    await User.updateOne(
                        { _id: tenant._id },
                        { $pull: { roles: Role.TENANT } },
                        { session: sessionDb }
                    );
                }
            });
        } finally {
            await sessionDb.endSession();
        }

        return NextResponse.json({
            success: true,
            message: "Tenant removed successfully",
        });
    } catch (error) {
        console.error("Add tenant error:", error);

        // Type-safe error handling
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input data", details: error.message },
                { status: 400 }
            );
        }

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}