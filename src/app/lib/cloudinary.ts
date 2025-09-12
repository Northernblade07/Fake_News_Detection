// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") throw new Error(`Missing env: ${name}`);
  return v;
}

const CLOUD_NAME = requireEnv("CLOUDINARY_CLOUD_NAME");
const API_KEY = requireEnv("CLOUDINARY_API_KEY");
const API_SECRET = requireEnv("CLOUDINARY_API_SECRET");

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  resource_type: "image" | "video" | "raw";
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
};

export type UploadOpts = {
  folder?: string;
  resource_type?: "image" | "video" | "raw" | "auto"; // allow auto on upload
  public_id?: string;
};

export function normalizeResourceType(rt: string): "image" | "video" | "raw" {
  if (rt === "image" || rt === "video" || rt === "raw") return rt;
  // If Cloudinary gives something weird, fallback to raw
  return "raw";
}

export function uploadBufferToCloudinary(
  buffer: Buffer,
  opts: UploadOpts = {}
): Promise<CloudinaryUploadResult> {
  const { folder = "satyashield/uploads", resource_type = "auto", public_id } = opts;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type, public_id },
      (error, result) => {
        if (error || !result) return reject(error);
        try {
          const out: CloudinaryUploadResult = {
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: normalizeResourceType(result.resource_type),
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            duration: result.duration,
          };
          resolve(out);
        } catch (e) {
          reject(e);
        }
      }
    );
    stream.end(buffer);
  });
}
