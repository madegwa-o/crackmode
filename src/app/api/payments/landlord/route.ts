import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { Apartment } from "@/models/Apartment";
import { User } from "@/models/User";
import {getServerSession} from "next-auth/next";

export async function GET(req: NextRequest) {
	try {
		await connectToDatabase();
		const session = await getServerSession();
		const { searchParams } = new URL(req.url);
		const apartmentId = searchParams.get("apartmentId");

		// const user = await User.findOne({ email: session.user?.email });
		// if (!user) throw new Error("User not found");
        //
		// // Get apartments owned by this landlord
		// const apartments = await Apartment.find({ landlord: user._id }).lean();
		// const apartmentIds = apartments.map(apt => apt._id);
        //
		// // Build query
		// const query: Record<string, unknown> = { landlord: user._id };
		// if (apartmentId) {
		// 	query.apartment = apartmentId;
		// }
        //
		// // Get payments
		// const payments = await Payment.find(query)
		// 	.populate("tenant", "name email")
		// 	.populate("apartment", "name")
		// 	.populate("house", "doorNumber")
		// 	.sort({ transactionDate: -1 })
		// 	.limit(100)
		// 	.lean();
        //
		// // Calculate summary
		// const totalIncome = payments
		// 	.filter(p => p.status === "success")
		// 	.reduce((sum, p) => sum + p.amount, 0);
        //
		// const monthlyIncome = payments
		// 	.filter(p => p.status === "success" && p.type === "rent")
		// 	.reduce((sum, p) => sum + p.amount, 0);
        //
		// const depositIncome = payments
		// 	.filter(p => p.status === "success" && p.type === "deposit")
		// 	.reduce((sum, p) => sum + p.amount, 0);
        //
		// return NextResponse.json({
		// 	payments,
		// 	summary: {
		// 		totalIncome,
		// 		monthlyIncome,
		// 		depositIncome,
		// 		totalPayments: payments.length,
		// 	},
		// 	apartments,
		// });

        return NextResponse.json({message: 'unda vitu broo'});
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
