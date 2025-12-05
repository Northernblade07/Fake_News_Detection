export interface GeminiClassification {
  label: "fake" | "real" | "unknown";
  probability: number;
  confidence?: "high" | "medium" | "low";
}

export async function classifyWithGemini(text: string): Promise<GeminiClassification> {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_KEY) {
      throw new Error("Gemini API key not configured");
    }

    const genai = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 512,
      }
    });


    // CRITERIA:
    // - "real": Factual, verifiable claims, credible sources, neutral language
    // - "fake": Misinformation, unverified claims, sensationalist language, logical inconsistencies
    // - "unknown": Insufficient information, ambiguous, or balanced arguments
    const prompt = `
    
    You are a JSON-only classifier. Output valid JSON only.
    Classify the following news text as "fake", "real", or "unknown".
Format:
{
  "label": "fake" | "real",
  "probability": 0.0–1.0,
  "reasoning": "brief explanation"
}

Text:
${text.substring(0, 3000)}
`;

    const result = await model.generateContent(prompt);
    console.log("result",result)
    
    // --- Extract text safely from Gemini response ---
let responseText = "";
try {
  // Try primary method
  if (typeof result.response.text === "function") {
    responseText = result.response.text().trim();
  }

  // Fallback for candidate-based responses
  if (!responseText && result.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    responseText = result.response.candidates[0].content.parts[0].text.trim();
  }

  // Still empty? Log entire structure for debugging
  if (!responseText) {
    console.warn("⚠️ Gemini returned empty text. Full response object:", JSON.stringify(result, null, 2));
  }

  console.log("🔹 Gemini raw response:", responseText);
} catch (err) {
  console.error("❌ Error extracting Gemini response text:", err);
}


    console.log("🔹 Gemini raw response:", responseText);

    // --- Step 1: Clean and extract possible JSON
    const cleanResponse = responseText.replace(/```json|```/g, '').trim();
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.warn("⚠️ No JSON object detected — using text fallback");
      return parseTextResponse(cleanResponse);
    }

    // --- Step 2: Attempt JSON parse
    let classification;
    try {
      classification = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.warn("⚠️ JSON parse failed — using text fallback:", err);
      return parseTextResponse(cleanResponse);
    }

    // --- Step 3: Normalize and validate
    let label: "fake" | "real" | "unknown" = "unknown";
    if (classification.label === "fake" || classification.label === "real") {
      label = classification.label;
    }

    const probability = Math.min(Math.max(Number(classification.probability) || 0.5, 0), 1);
    const confidence = probability > 0.8 ? "high" : probability > 0.6 ? "medium" : "low";

    console.log(`✅ Gemini classification: ${label} (${probability}) - ${classification.reasoning}`);

    return { label, probability, confidence };

  } catch (error) {
    console.error("❌ Gemini classification error:", error);
    return { label: "unknown", probability: 0.5, confidence: "low" };
  }
}

/**
 * Fallback text parser when Gemini fails to return valid JSON
 */
function parseTextResponse(response: string): GeminiClassification {
  const lower = response.toLowerCase();

  if (lower.includes('"label": "fake"') || lower.includes("label: 'fake'") || (lower.includes("fake") && !lower.includes("not fake"))) {
    return { label: "fake", probability: 0.75, confidence: "medium" };
  } else if (lower.includes('"label": "real"') || lower.includes("label: 'real'") || (lower.includes("real") && !lower.includes("not real"))) {
    return { label: "real", probability: 0.75, confidence: "medium" };
  } else if (lower.includes("unknown") || lower.includes("insufficient") || lower.includes("ambiguous")) {
    return { label: "unknown", probability: 0.5, confidence: "low" };
  }

  // Default fallback
  return { label: "unknown", probability: 0.5, confidence: "low" };
}
