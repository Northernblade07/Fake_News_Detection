// app/lib/ai/gemini.ts
export async function geminiSummarizeMedia(mediaUrl: string): Promise<string | null> {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return null;
    const genai = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent([
      { text: "Summarize the main factual claims and context from this media in 5-10 sentences." },
      { fileData: { mimeType: "application/octet-stream", fileUri: mediaUrl } },
    ]);
    return res.response.text();
  } catch (e) {
    console.warn("Gemini summarize failed:", e);
    return null;
  }
}
