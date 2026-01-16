import { NextRequest, NextResponse } from "next/server";
import { initiateStkPush } from "@/lib/mpesa";
import { z } from "zod";

const BodySchema = z.object({
	phone: z.string().min(10),
	amount: z.number().positive(),
	accountReference: z.string().min(1),
	description: z.string().optional(),
});

export async function POST(req: NextRequest) {
	try {
		const json = await req.json();
		const parsed = BodySchema.parse(json);
		const data = await initiateStkPush(parsed);
		return NextResponse.json({ ok: true, data });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Failed to initiate STK";
		return NextResponse.json(
			{ ok: false, message },
			{ status: 400 }
		);
	}
}


