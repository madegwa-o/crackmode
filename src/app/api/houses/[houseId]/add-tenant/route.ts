import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { House, User } from "@/models";
import { Role, hasAnyRole } from "@/lib/roles";

const AddTenantSchema = z.object({
    tenantEmail: z.string().email(),
    tenantPhone: z.string().optional(),
});

export async function POST(
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

        const { tenantEmail, tenantPhone } = AddTenantSchema.parse(await req.json());

        const house = await House.findById(houseId);
        if (!house) {
            return NextResponse.json({ error: "House not found" }, { status: 404 });
        }

        if (house.status === "occupied") {
            return NextResponse.json({ error: "House already occupied" }, { status: 400 });
        }

        const tenant = await User.findOne({ email: tenantEmail });
        if (!tenant) {
            return NextResponse.json(
                { error: "Tenant must have an existing account" },
                { status: 404 }
            );
        }

        const sessionDb = await User.startSession();

        try {
            await sessionDb.withTransaction(async () => {
                // Update house
                await House.updateOne(
                    { _id: house._id },
                    {
                        $set: {
                            status: "occupied",
                            tenant: tenant._id,
                        },
                    },
                    { session: sessionDb }
                );

                // Update tenant
                await User.updateOne(
                    { _id: tenant._id },
                    {
                        $addToSet: {
                            roles: Role.TENANT,
                            joinedApartments: house.apartment,
                            rentedHouses: {
                                apartment: house.apartment,
                                houseId: house._id,
                            },
                        },
                        ...(tenantPhone ? { $set: { phone: tenantPhone } } : {}),
                    },
                    { session: sessionDb }
                );
            });
        } finally {
            await sessionDb.endSession();
        }

        return NextResponse.json({
            success: true,
            message: "Tenant added successfully",
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