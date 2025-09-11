// models/DetectionLog.ts
import mongoose, { Schema, Model } from "mongoose";

export interface IDetectionLog {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  news: mongoose.Types.ObjectId;
  result: { label: "fake" | "real" | "unknown"; probability: number };
  createdAt?: Date;
}

const DetectionLogSchema = new Schema<IDetectionLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    news: { type: Schema.Types.ObjectId, ref: "NewsDetection", required: true },
    result: {
      label: { type: String, enum: ["fake", "real", "unknown"], default: "unknown" },
      probability: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const DetectionLog: Model<IDetectionLog> =
  mongoose.models.DetectionLog || mongoose.model<IDetectionLog>("DetectionLog", DetectionLogSchema);

export default DetectionLog;
