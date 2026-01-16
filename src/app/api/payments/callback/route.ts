import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { Apartment } from "@/models/Apartment";
import { House } from "@/models/House";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
	try {
		await connectToDatabase();
		const body = await req.json();
		// Daraja sends nested callbacks; extract success result
		const stkCallback = body?.Body?.stkCallback;
		if (!stkCallback) return NextResponse.json({ received: true });
		const resultCode = stkCallback.ResultCode;
		if (resultCode !== 0) {
			return NextResponse.json({ received: true, status: "ignored" });
		}
		const items: Array<{ Name: string; Value: string | number }> = stkCallback.CallbackMetadata?.Item || [];
		const amount = Number(items.find((i) => i.Name === "Amount")?.Value || 0);
		const mpesaReceiptNumber = String(items.find((i) => i.Name === "MpesaReceiptNumber")?.Value || "");
		const phoneNumber = String(items.find((i) => i.Name === "PhoneNumber")?.Value || "");
		const transactionDateRaw = String(items.find((i) => i.Name === "TransactionDate")?.Value || "");
		const accountReference = String(items.find((i) => i.Name === "AccountReference")?.Value || "");
		const transactionDate = new Date(
			`${transactionDateRaw.slice(0, 4)}-${transactionDateRaw.slice(4, 6)}-${transactionDateRaw.slice(6, 8)}T${transactionDateRaw.slice(8, 10)}:${transactionDateRaw.slice(10, 12)}:${transactionDateRaw.slice(12, 14)}Z`
		);

		// The accountReference is expected to be `${apartmentId}:${houseId}:${paymentType}`
		const [apartmentId, houseId, paymentType] = accountReference.split(":");
		const apartment = await Apartment.findById(apartmentId);
		if (!apartment) return NextResponse.json({ received: true, status: "apartment_not_found" });

		const house = await House.findById(houseId);
		if (!house) return NextResponse.json({ received: true, status: "house_not_found" });

		const tenant = await User.findById(house.tenant);
		if (!tenant) return NextResponse.json({ received: true, status: "tenant_not_found" });

		// Generate period for rent payments (current month)
		const period = paymentType === "rent"
			? new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
			: "Deposit";

		// Persist payment
		await Payment.findOneAndUpdate(
			{ mpesaReceiptNumber },
			{
				tenant: tenant._id,
				apartment: apartment._id,
				house: house._id,
				landlord: apartment.landlord,
				amount,
				type: paymentType as "deposit" | "rent",
				period,
				mpesaReceiptNumber,
				phoneNumber,
				status: "success",
				transactionDate,
			},
			{ upsert: true }
		);

		return NextResponse.json({ received: true, status: "saved" });
	} catch {
		return NextResponse.json({ received: true }, { status: 200 });
	}
}