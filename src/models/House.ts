// models/House.ts
import { Schema, model, models, type Model, Document } from "mongoose";

export interface IHouse extends Document {
	apartment: Schema.Types.ObjectId;
	doorNumber: string;
	status: "vacant" | "occupied";
	tenant?: Schema.Types.ObjectId;
	withDeposit: boolean;
	depositAmount?: number;
	rentAmount: number;
	additionalCharges: {
		water?: number;
		electricity?: number;
		other?: { label: string; amount: number }[];
	};
	createdAt: Date;
	updatedAt: Date;
}

const HouseSchema = new Schema<IHouse>(
	{
		apartment: { type: Schema.Types.ObjectId, ref: "Apartment", required: true },
		doorNumber: { type: String, required: true },
		status: { type: String, enum: ["vacant", "occupied"], default: "vacant" },
		tenant: { type: Schema.Types.ObjectId, ref: "User" },
		rentAmount: { type: Number, required: true },
		depositAmount: { type: Number, default: 0},
		additionalCharges: {
			water: { type: Number, default: 0 },
			electricity: { type: Number, default: 0 },
			other: [
				{
					label: { type: String },
					amount: { type: Number },
				},
			],
		},
	},
	{ timestamps: true }
);

export const House: Model<IHouse> = models.House || model<IHouse>("House", HouseSchema);