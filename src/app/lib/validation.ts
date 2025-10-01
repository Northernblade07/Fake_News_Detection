// lib/validation.ts
const DEFAULT_MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_FILE_BYTES = Number(process.env.MAX_FILE_BYTES ?? DEFAULT_MAX_FILE_BYTES);

const DEFAULT_ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
];
const ALLOWED_MIME = new Set(
  (process.env.ALLOWED_MIME ?? DEFAULT_ALLOWED_MIME.join(",")).split(",")
);

export type DetectType = "text" | "file";

export function validateType(v: string | null): DetectType {
  const t = (v ?? "text").toLowerCase();
  if (t !== "text" && t !== "file") throw new Error("Invalid type");
  return t as DetectType;
}

export function validateText(s: string | null): string {
  const v = (s ?? "").trim();
  if (!v) throw new Error("Text is required");
  if (v.length > 100_000) throw new Error("Text too long (max 100k characters)");
  return v;
}

export function validateOptionalUrl(u: string | null): string | undefined {
  const v = (u ?? "").trim();
  if (!v) return undefined;
  try {
    const url = new URL(v);
    if (!/^https?:$/.test(url.protocol)) {
      throw new Error("URL must be http or https");
    }
    return url.toString();
  } catch {
    throw new Error("Invalid source URL");
  }
}

export async function readAndValidateFile(
  file: File
): Promise<{ buffer: Buffer; mime: string }> {
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) throw new Error(`Unsupported file type: ${mime}`);

  // Fail fast if the browser-reported size is zero
  if (typeof file.size === "number" && file.size === 0) {
    throw new Error("Empty file");
  }

  const arrayBuf = await file.arrayBuffer();
  if (!arrayBuf || arrayBuf.byteLength === 0) {
    throw new Error("Empty file");
  }

  const buffer = Buffer.from(arrayBuf);
  if (buffer.byteLength > MAX_FILE_BYTES) {
    throw new Error(
      `File too large (max ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB)`
    );
  }
    console.log(mime , buffer)
  return { buffer, mime };
}
