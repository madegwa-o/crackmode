import axios from "axios";

export type StkPushRequest = {
	phone: string;
	amount: number;
	accountReference: string; // door number or tenant id
	description?: string;
};

const DARAJA_BASE_URL = process.env.MPESA_BASE_URL ?? "https://api.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
	const consumerKey = process.env.MPESA_CONSUMER_KEY ?? "";
	const consumerSecret = process.env.MPESA_CONSUMER_SECRET ?? "";
	const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
	const url = `${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
	const { data } = await axios.get(url, {
		headers: { Authorization: `Basic ${auth}` },
	});
	return data.access_token as string;
}

function generatePassword(shortCode: string, passkey: string, timestamp: string) {
	return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");
}

export async function initiateStkPush(payload: StkPushRequest) {
	const token = await getAccessToken();
	const shortCode = process.env.MPESA_SHORT_CODE ?? "";
	const passkey = process.env.MPESA_PASSKEY ?? "";
	const callbackUrl = process.env.NEXT_PUBLIC_BASE_URL
		? `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/callback`
		: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/payments/callback`;
	const timestamp = new Date()
		.toISOString()
		.replace(/[-:TZ.]/g, "")
		.slice(0, 14);
	const password = generatePassword(shortCode, passkey, timestamp);

	const url = `${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`;
	const body = {
		BusinessShortCode: shortCode,
		Password: password,
		Timestamp: timestamp,
		TransactionType: "CustomerPayBillOnline",
		Amount: payload.amount,
		PartyA: payload.phone,
		PartyB: shortCode,
		PhoneNumber: payload.phone,
		CallBackURL: callbackUrl,
		AccountReference: payload.accountReference,
		TransactionDesc: payload.description ?? "Rent Payment",
	};

	const { data } = await axios.post(url, body, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return data as {
		MerchantRequestID: string;
		CheckoutRequestID: string;
		ResponseCode: string;
		ResponseDescription: string;
		CustomerMessage: string;
	};
}


