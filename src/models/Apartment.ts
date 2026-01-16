// Updated Apartment Schema
import { Schema, model, models, type Model, Document } from "mongoose";
import { IUser } from "./User";

export interface IApartment extends Document {
	name: string;
	landlord: Schema.Types.ObjectId | IUser;
	numberOfDoors: number;
	houseType: "bed_sitter" | "single_stone" | "single_wood";
	rentAmount: number;
	additionalCharges: {
		water?: number;
		electricity?: number;
		other?: { label: string; amount: number }[];
	};
	withDeposit: boolean;
	depositAmount?: number;
	landlordPhoneNumber: string;
	disbursementAccount: {
		type: "safaricom" | "bank";
		safaricomNumber?: string;
		bankPaybill?: string;
		bankAccountNumber?: string;
	};
	houses: Schema.Types.ObjectId[];
}

const ApartmentSchema = new Schema<IApartment>(
	{
		name: { type: String, required: true },
		landlord: { type: Schema.Types.ObjectId, ref: "User", required: true },
		numberOfDoors: { type: Number, required: true },
		houseType: {
			type: String,
			enum: ["bed_sitter", "single_stone", "single_wood"],
			required: true,
		},
		rentAmount: { type: Number, required: true },
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
		withDeposit: { type: Boolean, default: false },
		depositAmount: { type: Number },
		landlordPhoneNumber: { type: String, required: true },
		disbursementAccount: {
			type: {
				type: String,
				enum: ["safaricom", "bank"],
				required: true,
				default: "safaricom"
			},
			safaricomNumber: { type: String },
			bankPaybill: { type: String },
			bankAccountNumber: { type: String }
		},
		houses: [{ type: Schema.Types.ObjectId, ref: "House" }],
	},
	{ timestamps: true }
);

export const Apartment: Model<IApartment> = models.Apartment || model<IApartment>("Apartment", ApartmentSchema);