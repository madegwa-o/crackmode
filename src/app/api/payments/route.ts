import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Payment } from "@/models/Payment";

export async function GET(req: NextRequest) {
	await connectToDatabase();
	const { searchParams } = new URL(req.url);
	const tenant = searchParams.get("tenant");
	const door = searchParams.get("door");
	const query: Record<string, unknown> = {};
	if (tenant) query.tenantId = tenant;
	if (door) query.doorNumber = door;
	const payments = await Payment.find(query).sort({ date: -1 }).limit(100).lean();
	return NextResponse.json({ payments });
}


