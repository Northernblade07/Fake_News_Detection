// app/api/detect/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { promises as fs } from "fs";

import { auth } from "@/../auth";
import { connectToDatabase } from "@/app/lib/db";
import NewsDetection, { INewsMedia } from "@/app/model/News";
import DetectionLog from "@/app/model/detectionlog";
import { uploadBufferToCloudinary, normalizeResourceType } from "@/app/lib/cloudinary";
import { validateType, validateText, validateOptionalUrl, readAndValidateFile } from "@/app/lib/validation";
import { translateText, type LangISO } from "@/app/lib/ai/translate";
import { ocrImageBuffer } from "@/app/lib/ai/ocr";
import { detectLanguage } from "@/app/lib/ai/langDetect";
import { extractTextFromPdf } from "@/app/lib/pdf/extract";
import { writeTempFile } from "@/app/lib/ai/ffmpeg";
import { sendPushNotification } from "@/app/lib/push";
import { runFactCheck } from "@/app/lib/ai/factCheck";
import { transcribeMedia } from "@/app/lib/ai/asr";

type Classification = { label: "fake" | "real" | "unknown"; probability: number };

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid user id");
  return new mongoose.Types.ObjectId(id);
}

const SUPPORTED_LANGS: ReadonlyArray<LangISO> = [
  "en","hi","bn","mr","te","ta","gu","ur","kn","or","ml","pa"
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function pickCloudinaryResourceType(mime: string): "image" | "video" | "raw" {
  if (!mime) return "raw";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "raw"; // PDFs as raw for reliable upload
  if (mime.startsWith("audio/")) return "video";
  if (mime.startsWith("video/")) return "video";
  return "raw";
}

export async function POST(req: Request) {
  const tmpFiles: string[] = [];
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const form = await req.formData();
    console.log(form)
    const type = validateType(form.get("type")?.toString() ?? null);
    const title = form.get("title")?.toString()?.trim() || undefined;
    const sourceUrl = validateOptionalUrl(form.get("sourceUrl")?.toString() ?? null);

    let textContent: string | undefined;
    const media: INewsMedia[] = [];


    // extract and upload files
    if (type === "text") {
      textContent = validateText(form.get("text")?.toString() ?? null);
    } else {
      const files = form.getAll("file");
      if (!files.length) {
        return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
      }

      for (const f of files) {
        if (!(f instanceof File)) continue;
        if (f.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: `File too large: ${f.name}` }, { status: 400 });
        }

        // Read once and freeze as originalBuffer
        const { buffer: originalBuffer, mime } = await readAndValidateFile(f);
        const resource_type = pickCloudinaryResourceType(mime);

        console.log(originalBuffer)
        console.log(mime)
        // Upload original first, using the frozen buffer
        if (!originalBuffer || originalBuffer.byteLength === 0) {
          return NextResponse.json({ error: "Empty file uploaded" }, { status: 400 });
        }

        const uploaded = await uploadBufferToCloudinary(originalBuffer, {
          folder: "satyashield/uploads",
          resource_type,
          use_filename: true,
          unique_filename: true,
          filename_override: f.name.replace(/\s+/g, "_").slice(0, 200),
        });
          console.log(uploaded)
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

        // Then extract text, never mutating originalBuffer
        if (mime.startsWith("image/")) {
          try {
            const extractedText = await ocrImageBuffer(originalBuffer);
            console.log(extractedText)
            if (extractedText?.trim()) {
              textContent = (textContent ?? "") + (textContent ? "\n\n" : "") + extractedText.trim();
            }
            console.log(textContent)
          } catch (e) {
            console.warn(`OCR failed for ${f.name}:`, e);
          }
        } else if (mime === "application/pdf") {
          try {
            const { text } = await extractTextFromPdf(originalBuffer);
            console.log(text,'text')
            if (text?.trim()) {
              textContent = (textContent ?? "") + (textContent ? "\n\n" : "") + text.trim();
              console.log(textContent,"textcontent")
              }
          } catch (e) {
            console.warn(`PDF extraction failed for ${f.name}:`, e);
          }
        } else if (mime.startsWith("audio/") || mime.startsWith("video/")) {
          console.log("MEDIA TYPE:", mime);
          try {
             // A. Write to temp disk
             const inPath = await writeTempFile("media", mime.split("/")[1] || "bin", originalBuffer);
             tmpFiles.push(inPath); // Add to cleanup list

             // B. Transcribe (Handles conversion -> Groq internally)
             const transcript = await transcribeMedia(inPath);
             
             if (transcript) {
               textContent = (textContent ? textContent + "\n\n" : "") + transcript;
             }
           } catch (e) {
            console.warn(`ASR failed for ${f.name}:`, e);
          }
        }
      }
    }

    // Language normalization
    const rawLang = form.get("lang")?.toString() ?? null;
    let userLang: LangISO = "en";
    const analysisLang: LangISO = "en";

    if (rawLang && (SUPPORTED_LANGS as readonly string[]).includes(rawLang)) {
      userLang = rawLang as LangISO;
    } else if (textContent) {
      try {
        const detection = await detectLanguage(textContent);
        if (detection.isReliable && (SUPPORTED_LANGS as readonly string[]).includes(detection.language)) {
          userLang = detection.language as LangISO;
        }
      } catch (e) {
        console.warn("Language detection failed:", e);
      }
    }

    let normalizedText = textContent;
    if (textContent && userLang !== analysisLang) {
      try {
        normalizedText = await translateText(textContent, userLang, analysisLang);
      } catch {
        normalizedText = textContent;
      }
    }

    //classification
//     let aiResult: Classification = { label: "unknown", probability: 0 };
//     if (normalizedText?.trim()) {
//   const results = await classifyFakeNews(normalizedText);
//   const top = results[0]; // first prediction
//   aiResult = {
//     label: top.label.toLowerCase() as "fake" | "real" | "unknown",
//     probability: top.score,
//   };
// }
if (!normalizedText || normalizedText.trim().length < 5) {
  return NextResponse.json(
    { error: "No readable text found for fact-checking." },
    { status: 400 }
  );
}
 const factResult = await runFactCheck(normalizedText);

    const userId = toObjectId(String(session.user.id));
    const newsDoc = await NewsDetection.create({
      type,
      title,
      textContent,
      normalizedText,
      media,
      source: { url: sourceUrl },

      // store minimal RAG result
      factCheck: {
        label: factResult.label,
        confidence: factResult.confidence,
        explanation: factResult.explanation,
        checkedAt: new Date(),
        // summary + sources intentionally NOT saved
      },

      user: userId,
      status: "done",
    });

    const logDoc = await DetectionLog.create({
      user: userId,
      news: newsDoc._id,
      result: {
        label: factResult.label === "unsure" ? "unknown" : factResult.label,
        probability: factResult.confidence,
      },
    });


    try { // consistent with schema
 // user from session or auth
  await sendPushNotification(userId, {
  title: "Detection Completed",
  body: `The news you submitted was detected as ${factResult.label.toUpperCase()}.`,
  icon: "/icons-192x192.png",
  badge: "/icons-192x192.png",
  data: { url: "/dashboard/logs" },
});

} catch (err) {
  console.error("Push notify error:", err);
}


    return NextResponse.json({ news: newsDoc, log: logDoc ,  rag: {
          label: factResult.label,
          confidence: factResult.confidence,
          explanation: factResult.explanation,
          evidenceSummary: factResult.evidenceSummary,
          sources: factResult.sources,
        } }, { status: 201 });
  } catch (err) {
    console.error("Detect API Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await Promise.allSettled(tmpFiles.map(p => fs.rm(p, { force: true }).catch(() => {})));
  }
}