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
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100,
      }
    });

    const prompt = `
    Analyze this news text for authenticity. Classify it as ONLY one of: "fake", "real", or "unknown".
    
    CRITERIA:
    - "real": Factual, verifiable claims, credible sources, neutral language
    - "fake": Misinformation, unverified claims, sensationalist language, logical inconsistencies
    - "unknown": Insufficient information, ambiguous, or balanced arguments
    
    Respond with ONLY valid JSON in this exact format:
    {
      "label": "fake|real|unknown",
      "probability": 0.95,
      "reasoning": "brief explanation"
    }
    
    Text to analyze: "${text.substring(0, 3000)}"
    
    JSON Response:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Parse JSON response
    try {
      const cleanResponse = responseText.replace(/```json|```/g, '').trim();
      const classification = JSON.parse(cleanResponse);
      
      // Validate and normalize the response
      let label: "fake" | "real" | "unknown" = "unknown";
      if (classification.label === "fake" || classification.label === "real") {
        label = classification.label;
      }
      
      const probability = Math.min(Math.max(Number(classification.probability) || 0.5, 0), 1);
      const confidence = probability > 0.8 ? "high" : probability > 0.6 ? "medium" : "low";
      
      console.log(`Gemini classification: ${label} (${probability}) - ${classification.reasoning}`);
      
      return {
        label,
        probability,
        confidence
      };
    } catch (parseError) {
      console.warn("Gemini JSON parse failed, using text fallback:", parseError);
      return parseTextResponse(responseText);
    }
  } catch (error) {
    console.error("Gemini classification error:", error);
    throw error;
  }
}

function parseTextResponse(response: string): GeminiClassification {
  const lower = response.toLowerCase();
  
  if (lower.includes('"label": "fake"') || lower.includes("label: 'fake'") || (lower.includes('fake') && !lower.includes('not fake'))) {
    return { label: "fake", probability: 0.75, confidence: "medium" };
  } else if (lower.includes('"label": "real"') || lower.includes("label: 'real'") || (lower.includes('real') && !lower.includes('not real'))) {
    return { label: "real", probability: 0.75, confidence: "medium" };
  } else if (lower.includes('unknown') || lower.includes('insufficient') || lower.includes('ambiguous')) {
    return { label: "unknown", probability: 0.5, confidence: "low" };
  }
  
  // Default fallback
  return { label: "unknown", probability: 0.5, confidence: "low" };
}