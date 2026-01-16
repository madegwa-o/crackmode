import { Schema, model, models, type Model, Document, Types } from "mongoose";

export interface ISubscription extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        endpoint: {
            type: String,
            required: true,
            unique: true,
        },
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true },
        },
    },
    { timestamps: true }
);

// Create compound index for efficient queries
SubscriptionSchema.index({ userId: 1, endpoint: 1 });

export const Subscription: Model<ISubscription> =
    models.Subscription || model<ISubscription>("Subscription", SubscriptionSchema);