import fs from "fs";
import Groq from "groq-sdk";
export const runtime = "nodejs";

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export type TranscriptionResult = {
  text: string;
};

/**
 * Transcribes audio using Groq's Whisper API.
 * This replaces the heavy local Transformers.js pipeline.
 */
export async function transcribeFile(filePath: string): Promise<TranscriptionResult> {
  try {
    // Check if file exists
    await fs.promises.access(filePath);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath), // Stream the file directly
      model: "whisper-large-v3",           // SOTA model (much better than local tiny/small)
      response_format: "json",
      language: "en",                      // Optional: Remove to auto-detect language
      temperature: 0.0,                    // Deterministic output
    });

    return { text: transcription.text };
  } catch (error) {
    console.error("Groq Transcription failed:", error);
    // Return empty string on failure so the rest of the flow continues
    return { text: "" };
  }
}

export async function transcribeWithGroq(
  filePath: string
): Promise<string> {
  try {
    const response = await groq.audio.translations.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3",
      response_format: "json",
    });

    console.log("response from groq",response)
    return response.text?.trim() || "";
  } catch (err) {   
    console.error("Groq transcription failed:", err);
    return "";
  }
}
