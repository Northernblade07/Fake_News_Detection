// app/lib/cloudinary.ts
import { v2 as cloudinary, type UploadApiErrorResponse, type UploadApiResponse } from "cloudinary";
import { Readable } from "stream";
 
/* ============================= */
/* Configuration + Validations   */
/* ============================= */

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

/* ============================= */
/* Types                         */
/* ============================= */

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
  use_filename?: boolean;
  unique_filename?: boolean;
  filename_override?: string;
  tags?: string[];
  context?: Record<string, string>;
  overwrite?: boolean;
  invalidate?: boolean;
  timeoutMs?: number;
};

/* ============================= */
/* Errors                        */
/* ============================= */

export class NonEmptyBufferError extends Error {
  constructor() {
    super("Empty file");
    this.name = "NonEmptyBufferError";
  }
}

export class CloudinaryUploadError extends Error {
  http_code?: number;
  constructor(message: string, http_code?: number) {
    super(message);
    this.name = "CloudinaryUploadError";
    this.http_code = http_code;
  }
}

/* ============================= */
/* Helpers                       */
/* ============================= */

export function normalizeResourceType(rt: string): "image" | "video" | "raw" {
  return rt === "image" || rt === "video" || rt === "raw" ? rt : "raw";
}

function bufferToReadable(buffer: Buffer): Readable {
  return Readable.from(buffer);
}

function isRetriableError(err: unknown): boolean {
  const e = err as Partial<UploadApiErrorResponse> & { code?: string; message?: string; http_code?: number };
  if (!e) return false;
  if (e.http_code && e.http_code >= 500) return true;
  const msg = (e.message || "").toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("etimedout") ||
    msg.includes("econnreset") ||
    msg.includes("socket hang up")
  );
}

/* ============================= */
/* Core uploader (stream-based)  */
/* ============================= */

function createUploadStream(
  opts: UploadOpts
): { promise: Promise<CloudinaryUploadResult>; sink: NodeJS.WritableStream } {
  const {
    folder = "satyashield/uploads",
    resource_type = "auto",
    public_id,
    use_filename,
    unique_filename,
    filename_override,
    tags,
    context,
    overwrite,
    invalidate,
    timeoutMs,
    
  } = opts;

  const cloudinaryOptions = {
    folder,
    resource_type,
    public_id,
    use_filename,
    unique_filename,
    filename_override,
    tags,
    context,
    overwrite,
    invalidate,
    timeout: typeof timeoutMs === "number" ? timeoutMs : undefined,
    type: resource_type === "raw" ? "authenticated" : "upload",
  };

  let resolveFn!: (val: CloudinaryUploadResult) => void;
  let rejectFn!: (err: Error) => void;

  const promise = new Promise<CloudinaryUploadResult>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  const sink = cloudinary.uploader.upload_stream(
    cloudinaryOptions,
    (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
      if (error || !result) {
        const httpCode = error?.http_code;
        const msg = error?.message || "Cloudinary upload failed";
        return rejectFn(new CloudinaryUploadError(msg, httpCode));
      }
      resolveFn({
        secure_url: result.secure_url,
        public_id: result.public_id,
        resource_type: normalizeResourceType(result.resource_type),
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: (result).duration,
      });
    }
  );

  return { promise, sink };
}

/* ============================= */
/* Public APIs                   */
/* ============================= */

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  opts: UploadOpts = {}
): Promise<CloudinaryUploadResult> {
  if (!buffer || buffer.byteLength === 0) {
    // throw new NonEmptyBufferError();
    console.log(buffer,"cloudinary")
  }

  // Let the caller choose resource_type; default to "auto"
  if (!opts.resource_type) {
    opts.resource_type = "auto";
  }

  const maxRetries = 2;
  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= maxRetries) {
    try {
      const { promise, sink } = createUploadStream(opts);
      bufferToReadable(buffer).pipe(sink);
      return await promise;
    } catch (err) {
      lastErr = err;
      if (attempt === maxRetries || !isRetriableError(err)) break;
      const backoff = 250 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
      attempt += 1;
    }
  }

  const e = lastErr as CloudinaryUploadError | Error | undefined;
  if (e instanceof CloudinaryUploadError) {
    throw new CloudinaryUploadError(e.message, e.http_code);
  }
  throw new CloudinaryUploadError((e && e.message) || "Cloudinary upload failed");
}

export async function uploadStreamToCloudinary(
  stream: Readable,
  opts: UploadOpts = {}
): Promise<CloudinaryUploadResult> {
  const { promise, sink } = createUploadStream(opts);
  stream.pipe(sink);
  return promise;
}
