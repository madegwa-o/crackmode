// src/models/Payment.ts
import { Schema, model, models, type Model, Document } from "mongoose";

export interface IPayment extends Document {
	// Original fields
	tenant: Schema.Types.ObjectId;
	apartment: Schema.Types.ObjectId;
	house: Schema.Types.ObjectId;
	transactionDate: Date;

	// STK Push initiation fields
	merchantRequestId: string;
	checkoutRequestId: string;
	responseCode: string;
	responseDescription: string;
	customerMessage: string;
	totalAmount: number;
	phoneNumber: string;
	selectedCharges: Array<{
		id: string;
		label: string;
		amount: number;
	}>;

	// Callback fields (populated later)
	resultCode?: number;
	resultDesc?: string;
	mpesaReceiptNumber?: string;
	transactionId?: string;
	transactionAmount?: number;
	balance?: string;

	// Monthly tracking - null for joining payments (with deposit)
	paymentPeriod?: {
		month: number; // 1-12
		year: number;  // e.g., 2025
	} | null;

	// Payment type to distinguish
	paymentType: 'joining' | 'monthly';

	// Status tracking
	status: 'pending' | 'completed' | 'failed' | 'cancelled';

	// Timestamps (added by Mongoose timestamps: true)
	createdAt: Date;
	updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
	{
		// Original fields
		tenant: { type: Schema.Types.ObjectId, ref: "User", required: true },
		apartment: { type: Schema.Types.ObjectId, ref: "Apartment", required: true },
		house: { type: Schema.Types.ObjectId, ref: "House", required: true },
		transactionDate: { type: Date, default: Date.now },

		// STK Push initiation fields
		merchantRequestId: { type: String, required: true, index: true },
		checkoutRequestId: { type: String, required: true, index: true },
		responseCode: { type: String, required: true },
		responseDescription: { type: String, required: true },
		customerMessage: { type: String, required: true },
		totalAmount: { type: Number, required: true },
		phoneNumber: { type: String, required: true },
		selectedCharges: [{
			id: { type: String, required: true },
			label: { type: String, required: true },
			amount: { type: Number, required: true }
		}],

		// Callback fields
		resultCode: { type: Number },
		resultDesc: { type: String },
		mpesaReceiptNumber: { type: String },
		transactionId: { type: String },
		transactionAmount: { type: Number },
		balance: { type: String },

		// Monthly tracking
		paymentPeriod: {
			type: {
				month: { type: Number, min: 1, max: 12 },
				year: { type: Number }
			},
			default: null
		},

		paymentType: {
			type: String,
			enum: ['joining', 'monthly'],
			required: true
		},

		// Status
		status: {
			type: String,
			enum: ['pending', 'completed', 'failed', 'cancelled'],
			default: 'pending'
		}
	},
	{ timestamps: true }
);

// Compound indexes
PaymentSchema.index({ merchantRequestId: 1, checkoutRequestId: 1 });
PaymentSchema.index({ tenant: 1, house: 1, 'paymentPeriod.year': 1, 'paymentPeriod.month': 1 });
PaymentSchema.index({ house: 1, status: 1, paymentType: 1 });

export const Payment: Model<IPayment> = models.Payment || model<IPayment>("Payment", PaymentSchema);