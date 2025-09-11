// app/api/detect/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/../auth";
import { connectToDatabase } from "@/app/lib/db";
import NewsDetection, { INewsMedia } from "@/app/models/News";
import DetectionLog from "@/app/models/detectionlog";
import { uploadBufferToCloudinary, narrowResourceType } from "@/app/lib/cloudinary";
import {
  validateType,
  validateText,
  validateOptionalUrl,
  readAndValidateFile,
} from "@/app/lib/validation";

type Classification = { label: "fake" | "real" | "unknown"; probability: number };

async function classifyPlaceholder(_text?: string): Promise<Classification> {
  // 🔹 Replace later with HuggingFace, Gemini, or LangChain pipeline
  return { label: "unknown", probability: 0 };
}

function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid user id");
  return new mongoose.Types.ObjectId(id);
}

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
      // 🔹 Handle multiple file uploads
      const files = form.getAll("file");
      if (!files.length) {
        return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
      }

      for (const f of files) {
        if (!(f instanceof File)) continue;

        // Guardrail: limit file size (5 MB per file)
        if (f.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
        }

        const { buffer } = await readAndValidateFile(f);
        const uploaded = await uploadBufferToCloudinary(buffer, {
          folder: "satyashield/uploads",
          resource_type: "auto",
        });

        media.push({
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          resourceType: narrowResourceType(uploaded.resource_type),
          format: uploaded.format,
          bytes: uploaded.bytes,
          width: uploaded.width,
          height: uploaded.height,
          duration: uploaded.duration,
        });
      }
    }

    const ai = await classifyPlaceholder(textContent);
    const userObjId = toObjectId(String(session.user.id));

    // Save news detection
    const newsDoc = await NewsDetection.create({
      type,
      title,
      textContent,
      media,
      source: { url: sourceUrl },
      result: ai,
      user: userObjId,
    });

    // Save detection log
    const logDoc = await DetectionLog.create({
      user: userObjId,
      news: newsDoc._id,
      result: ai,
    });

    return NextResponse.json({ news: newsDoc, log: logDoc }, { status: 201 });
  } catch (err) {
    console.error("❌ Detect API Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
