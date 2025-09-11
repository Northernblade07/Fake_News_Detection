// models/NewsDetection.ts
import mongoose, { Schema, Model } from "mongoose";

export interface INewsDetection {
  _id?: mongoose.Types.ObjectId;
  type: "text" | "file";
  title?: string;
  textContent?: string;
  media?: {
    url: string;
    publicId: string;
    resourceType: "image" | "video" | "raw" | "auto";
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
    duration?: number;
  }[];
  source?: { url?: string };
  result?: { label: "fake" | "real" | "unknown"; probability: number };
  user: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const NewsDetectionSchema = new Schema<INewsDetection>(
  {
    type: { type: String, enum: ["text", "file"], required: true },
    title: String,
    textContent: String,
    media: [
      {
        url: String,
        publicId: String,
        resourceType: { type: String, enum: ["image", "video", "raw", "auto"] },
        format: String,
        bytes: Number,
        width: Number,
        height: Number,
        duration: Number,
      },
    ],
    source: {
      url: String,
    },
    result: {
      label: { type: String, enum: ["fake", "real", "unknown"], default: "unknown" },
      probability: { type: Number, default: 0 },
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const NewsDetection: Model<INewsDetection> =
  mongoose.models.NewsDetection || mongoose.model<INewsDetection>("NewsDetection", NewsDetectionSchema);

export default NewsDetection;
