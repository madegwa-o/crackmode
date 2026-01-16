// app/api/apartments/[id]/houses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { House } from "@/models/House";
import { Apartment } from "@/models/Apartment";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	await connectToDatabase();

	// ✅ FIXED: Await the params before accessing properties
	const { id } = await params;

	const houses = await House.find({
		apartment: id,
		status: "vacant"
	}).lean();

	const apartment = await Apartment.findById(id).lean();
	if (!apartment) {
		return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
	}

	return NextResponse.json({ houses, apartment });
}

