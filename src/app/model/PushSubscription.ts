// app/models/PushSubscription.ts
import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: Types.ObjectId; // link to the authenticated user
  endpoint: string;       // unique per subscription
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: Date | null; // from subscription.expirationTime (if provided)
  userAgent?: string;           // optional analytics/debug
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    expirationTime: { type: Date, default: null },
    userAgent: { type: String },
  },
  { timestamps: true }
);

// Indexes
// PushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
PushSubscriptionSchema.index({ userId: 1 });

export default mongoose.models.PushSubscription ||
  model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
