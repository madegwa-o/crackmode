import { Schema, model, models, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";
import { Role } from "@/lib/roles";

export interface IUser extends Document {
	_id: Types.ObjectId;
	name: string;
	username: string;
	email: string;
	password?: string;
	image?: string;
	roles: Role[];
	phone?: string;
	joinedApartments?: Types.ObjectId[];
	ownedApartments?: Types.ObjectId[];
	rentedHouses?: { apartment: Types.ObjectId; houseId: Types.ObjectId }[];
	comparePassword(candidate: string): Promise<boolean>;
	hasRole(role: Role): boolean;
	addRole(role: Role): void;
	removeRole(role: Role): void;
}

const UserSchema = new Schema<IUser>(
	{
		name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
		username: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		password: { type: String, minlength: 6, select: false },
		image: { type: String, default: null },
		phone: { type: String, trim: true, default: null },
		roles: { type: [String], enum: Object.values(Role), default: [Role.USER] },
	},
	{ timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
	if (!this.isModified("password") || !this.password) return next();
	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error as Error);
	}
});

// Methods
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
	if (!this.password) return false;
	return bcrypt.compare(candidate, this.password);
};
UserSchema.methods.hasRole = function (role: Role): boolean {
	return this.roles.includes(role);
};
UserSchema.methods.addRole = function (role: Role): void {
	if (!this.roles.includes(role)) this.roles.push(role);
};
UserSchema.methods.removeRole = function (role: Role): void {
	this.roles = this.roles.filter((r: Role) => r !== role);
};

export const User = models.User || model<IUser>("User", UserSchema);
