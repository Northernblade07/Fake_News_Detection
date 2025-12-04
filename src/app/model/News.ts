// models/News.ts
import mongoose, { Schema, Model, Document } from "mongoose";


export interface INewsMedia {
  url: string;
  publicId: string;
  resourceType: "image" | "video" | "raw" | "auto";
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
}

export type FactLabel = "fake" | "real" | "unsure";

export interface IFactSource {
  title?: string;
  link?: string;
  snippet?: string;
}


export interface IFactCheck {
  label: FactLabel;
  confidence: number;               // 0–1
  explanation?: string;             // LLM explanation
  evidenceSummary?: string;         // Summarized evidence
  sources?: IFactSource[];          // Search results used
  checkedAt?: Date;                 // Helpful for UI sorting
}


export interface INewsDetection extends Document {
  _id: mongoose.Types.ObjectId;
  type: "text" | "file";
  title?: string;
  textContent?: string;       // original user input or OCR result
  normalizedText?: string;    // translated/cleaned for AI analysis
  media?: INewsMedia[];
  source?: {
    url?: string;
    domain?: string;
    credibilityScore?: number;
  };
  status: "pending" | "processing" | "done" | "error";
  result?: {
    label: "fake" | "real" | "unknown";
    probability: number;
  };

  factCheck?: IFactCheck;

  user: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const NewsDetectionSchema = new Schema<INewsDetection>(
  {
    type: { type: String, enum: ["text", "file"], required: true },
    title: { type: String, trim: true },
    textContent: { type: String, trim: true },
    normalizedText: { type: String, trim: true }, // ✅ added field

    media: [
      {
        url: { type: String, required: function () { return this.type === "file"; } },
        publicId: { type: String, required: function () { return this.type === "file"; } },
        resourceType: {
          type: String,
          enum: ["image", "video", "raw", "auto"],
          required: true,
        },
        format: String,
        bytes: Number,
        width: Number,
        height: Number,
        duration: Number,
      },
    ],

    source: {
      url: String,
      domain: String,
      credibilityScore: Number,
    },
    

    result: {
      label: {
        type: String,
        enum: ["fake", "real", "unknown"],
        default: "unknown",
      },
      probability: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
    },

      factCheck: {
      label: { type: String, enum: ["fake", "real", "unsure"], default: "unsure" },
      confidence: { type: Number, min: 0, max: 1, default: 0 },

      explanation: { type: String },
      evidenceSummary: { type: String },

      sources: [
        {
          title: String,
          link: String,
          snippet: String,
        },
      ],

      checkedAt: { type: Date, default: null },
    },

    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// 🔹 Indexes for faster queries
NewsDetectionSchema.index({ user: 1, createdAt: -1 });
NewsDetectionSchema.index({ "result.label": 1 });
NewsDetectionSchema.index({ status: 1 });
NewsDetectionSchema.index({ "factCheck.label": 1 });
// 🔹 Pre-save hook to sanitize text
NewsDetectionSchema.pre("save", function (next) {
  if (this.textContent) {
    this.textContent = this.textContent.trim();
  }
  if (this.normalizedText) {
    this.normalizedText = this.normalizedText.trim();
  }
  if (this.title) {
    this.title = this.title.trim();
  }
  next();
});

const NewsDetection: Model<INewsDetection> =
  mongoose.models.NewsDetection ||
  mongoose.model<INewsDetection>("NewsDetection", NewsDetectionSchema);

export default NewsDetection;
