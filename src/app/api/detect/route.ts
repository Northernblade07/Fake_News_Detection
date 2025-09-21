// app/api/detect/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/../auth";
import { connectToDatabase } from "@/app/lib/db";
import NewsDetection, { INewsMedia } from "@/app/model/News";
import DetectionLog from "@/app/model/detectionlog";
import { uploadBufferToCloudinary, normalizeResourceType } from "@/app/lib/cloudinary";
import { validateType, validateText, validateOptionalUrl, readAndValidateFile } from "@/app/lib/validation";
import { translateText, type LangISO } from "@/app/lib/ai/translate";
import { ocrImageBuffer } from "@/app/lib/ai/ocr";
import { detectLanguage } from "@/app/lib/ai/langDetect";

type Classification = { label: "fake" | "real" | "unknown"; probability: number };

// Placeholder AI classification – replace with HuggingFace / Gemini later
async function classifyPlaceholder(_text?: string): Promise<Classification> {
  return { label: "unknown", probability: 0 };
}

// Helper: cast string to Mongoose ObjectId
function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid user id");
  return new mongoose.Types.ObjectId(id);
}

const SUPPORTED_LANGS: ReadonlyArray<LangISO> = [
  "en","hi","bn","mr","te","ta","gu","ur","kn","or","ml","pa"
];

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const form = await req.formData();
    const type = validateType(form.get("type")?.toString() ?? null);
    const title = form.get("title")?.toString()?.trim() || undefined;
    const sourceUrl = validateOptionalUrl(form.get("sourceUrl")?.toString() ?? null);

    let textContent: string | undefined;
    const media: INewsMedia[] = [];

    if (type === "text") {
      textContent = validateText(form.get("text")?.toString() ?? null);
    } else {
      const files = form.getAll("file");
      if (!files.length) {
        return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
      }

      for (const f of files) {
        if (!(f instanceof File)) continue;
        if (f.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: `File too large: ${f.name}` }, { status: 400 });
        }

        const { buffer } = await readAndValidateFile(f);

        // OCR if image or pdf
        if (f.type.startsWith("image/") || f.type === "application/pdf") {
          try {
            const extractedText = await ocrImageBuffer(buffer);
            if (extractedText) {
              textContent = (textContent ?? "") + "\n" + extractedText;
            }
          } catch (e) {
            console.warn(`OCR failed for ${f.name}:`, e);
          }
        }

        const uploaded = await uploadBufferToCloudinary(buffer, {
          folder: "satyashield/uploads",
          resource_type: "auto",
        });

        media.push({
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          resourceType: normalizeResourceType(uploaded.resource_type),
          format: uploaded.format,
          bytes: uploaded.bytes,
          width: uploaded.width,
          height: uploaded.height,
          duration: uploaded.duration,
        });
      }
    }

    // Normalize text for analysis
    const rawLang = form.get("lang")?.toString() ?? null;
    let userLang: LangISO = "en"; // Default to English
    const analysisLang: LangISO = "en";

    // Priority 1: Use the language explicitly selected by the user, if it's supported.
    if (rawLang && (SUPPORTED_LANGS as readonly string[]).includes(rawLang)) {
      userLang = rawLang as LangISO;
    }
    // Priority 2: If no language was selected AND we have text, auto-detect it.
    else if (textContent) {
      try {
        const detection = await detectLanguage(textContent);
        // Use the detected language only if it's reliable and in our supported list.
        if (detection.isReliable && (SUPPORTED_LANGS as readonly string[]).includes(detection.language)) {
          userLang = detection.language as LangISO;
        }
      } catch (e) {
        console.warn("Language detection with cld3-wasm failed:", e);
        // Fallback to the default 'en' if detection fails.
      }
    }

    // Finally, normalize to English for AI analysis if the determined language is not English.
    let normalizedText = textContent;
    if (textContent && userLang !== analysisLang) {
      try {
        normalizedText = await translateText(textContent, userLang, analysisLang);
      } catch {
        normalizedText = textContent; // Fallback to original text if translation fails
      }
    }
    // Classification (placeholder for now)
    const aiResult = await classifyPlaceholder(normalizedText);

    const userId = toObjectId(String(session.user.id));
    const newsDoc = await NewsDetection.create({
      type,
      title,
      textContent,    // original
      normalizedText, // translated/cleaned for analysis
      media,
      source: { url: sourceUrl },
      result: aiResult,
      user: userId,
    });

    const logDoc = await DetectionLog.create({
      user: userId,
      news: newsDoc._id,
      result: aiResult,
    });

    return NextResponse.json({ news: newsDoc, log: logDoc }, { status: 201 });
  } catch (err) {
    console.error("Detect API Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
