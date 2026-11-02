import { Schema, model, type InferSchemaType } from "mongoose";

export const FREQUENCIES = ["Monthly", "Yearly"] as const;
export const STATUSES = ["active", "paused", "cancelled"] as const;

const subscriptionSchema = new Schema(
  {
    // Clerk user ID — every query is scoped by this so users only see their own data
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", uppercase: true, minlength: 3, maxlength: 3 },
    frequency: { type: String, enum: FREQUENCIES, default: "Monthly" },
    category: { type: String, trim: true, default: "Other" },
    plan: { type: String, trim: true },
    paymentMethod: { type: String, trim: true },
    status: { type: String, enum: STATUSES, default: "active" },
    // Key into the app's bundled icon set (constants/icons.ts); unknown keys fall back to a default
    iconKey: { type: String, default: "plus" },
    color: { type: String },
    startDate: { type: Date, default: () => new Date() },
    renewalDate: { type: Date, required: true },
  },
  { timestamps: true }
);

subscriptionSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    delete ret.userId;
    return ret;
  },
});

export type SubscriptionDoc = InferSchemaType<typeof subscriptionSchema>;
export const Subscription = model("Subscription", subscriptionSchema);
