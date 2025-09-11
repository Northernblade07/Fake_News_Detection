// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") throw new Error(`Missing env: ${name}`);
  return v;
}

cloudinary.config({
  cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
  api_key: requireEnv("CLOUDINARY_API_KEY"),
  api_secret: requireEnv("CLOUDINARY_API_SECRET"),
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
  resource_type?: "image" | "video" | "raw" | "auto";
  public_id?: string;
};

/**
 * Ensure Cloudinary resource_type is normalized
 */
export function narrowResourceType(rt: string): "image" | "video" | "raw" {
  if (rt === "image" || rt === "video" || rt === "raw") return rt;
  // fallback → Cloudinary sometimes sends "auto"
  return "raw";
}

/**
 * Upload a buffer to Cloudinary
 */
export function uploadBufferToCloudinary(
  buffer: Buffer,
  opts: UploadOpts = {}
): Promise<CloudinaryUploadResult> {
  const { folder = "satyashield/uploads", resource_type = "auto", public_id } = opts;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type, public_id },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Unknown Cloudinary error"));
        }
        try {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: narrowResourceType(result.resource_type),
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            duration: result.duration,
          });
        } catch (e) {
          reject(e);
        }
      }
    );
    stream.end(buffer);
  });
}
