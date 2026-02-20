// app/lib/ai/transformers-pipeline.ts
import path from "path";
import { pipeline, env } from "@huggingface/transformers";

// Force local mode (no hub downloads)
env.allowRemoteModels = false;
env.localModelPath = path.join(process.cwd(), "models");

// Force Node backend (onnxruntime-node)
env.backends = {
  onnx: {
    // Explicitly prefer onnxruntime-node backend
    // (transformers.js automatically loads it if available in Node)
    preferBackend: "onnxruntime-node",
  },
};

// === Type definitions ===
type Task =
  | "text-classification"
  | "feature-extraction"
  | "automatic-speech-recognition"
  | "zero-shot-classification";

export type TextClassificationResult = { label: string; score: number };
export type EmbeddingResult = number[] | number[][];
export type TranscriptionResult = {
  text: string;
  chunks?: Array<{ text: string; timestamp: [number, number] }>;
};
export type ZeroShotResult = { sequence: string; labels: string[]; scores: number[] };

// === Generic typed pipeline loader ===
function P<T extends Task>(task: T, model: string) {
  return class PipelineSingleton {
    private static instance: unknown | null = null;

    static async get(progress_callback?: (d: unknown) => void): Promise<unknown> {
      if (!this.instance) {
        this.instance = await pipeline(task, model, { progress_callback });
      }
      return this.instance;
    }
  };
}

// === Base pipelines ===
const TextClassifier = P("text-classification", "Xenova/distilbert-base-uncased-finetuned-sst-2-english");
const Embedder = P("feature-extraction", "Xenova/all-MiniLM-L6-v2");
const ZeroShotClf = P("zero-shot-classification", "Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7");

// === Helper: classify text ===
export async function classifyText(text: string): Promise<TextClassificationResult[]> {
  const clf = (await TextClassifier.get()) as (input: string) => Promise<TextClassificationResult[]>;
  return clf(text);
}

// === Helper: embed text ===
export async function embedText(text: string): Promise<number[]> {
  const emb = (await Embedder.get()) as (input: string) => Promise<EmbeddingResult>;
  const out = await emb(text);
  if (Array.isArray(out) && Array.isArray(out[0])) {
    const mat = out as number[][];
    const dim = mat[0]?.length ?? 0;
    const sum = new Array(dim).fill(0);
    for (const row of mat) for (let i = 0; i < dim; i++) sum[i] += row[i];
    return sum.map(v => v / mat.length);
  }
  return out as number[];
}

// === Helper: transcribe ===
export async function transcribeFile(pathOrUrl: string | File | Blob): Promise<TranscriptionResult> {
  const asr = (await Transcriber.get()) as (
    src: string | File | Blob,
    opts?: { return_timestamps?: "word" | "chunk" }
  ) => Promise<TranscriptionResult>;
  return asr(pathOrUrl, { return_timestamps: "word" });
}

// === Local zero-shot fallback classifier ===
export type TriLabel = "fake" | "real" | "unknown";
export type LocalClassification = {
  label: TriLabel;
  probability: number;
  scores: Record<Exclude<TriLabel, "unknown">, number>;
};

const MIN_CONF = 0.65;
const MARGIN = 0.4;

export async function classifyLocalFakeRealUnknown(text?: string): Promise<LocalClassification> {
  if (!text?.trim()) return { label: "unknown", probability: 0, scores: { fake: 0, real: 0 } };

  const clf = (await ZeroShotClf.get()) as (
    input: string,
    labels: string[],
    opts?: { multi_label?: boolean; hypothesis_template?: string }
  ) => Promise<ZeroShotResult>;

  const out = await clf(text, ["fake", "real"], {
    hypothesis_template: "This claim is {label}.",
  });

  const scores: Record<Exclude<TriLabel, "unknown">, number> = { fake: 0, real: 0 };
  out.labels.forEach((l, i) => {
    const k = l.toLowerCase() as "fake" | "real";
    scores[k] = out.scores[i];
  });

  const pairs = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topLabel, topScore] = pairs[0] as [Exclude<TriLabel, "unknown">, number];
  const secondScore = pairs[1]?.[1] ?? 0;
  const confident = topScore >= MIN_CONF && topScore - secondScore >= MARGIN;

  return {
    label: confident ? topLabel : "unknown",
    probability: confident ? topScore : secondScore,
    scores,
  };
}

// === Local ONNX Fake News Classification ===
// export async function classifyFakeNews(text: string): Promise<TextClassificationResult[]> {
//   if (!text?.trim()) return [{ label: "unknown", score: 0 }];

//   try {
//     const clf = (await LocalFakeNewsClassifier.get()) as (input: string) => Promise<TextClassificationResult[]>;
//     const results = await clf(text);
//     return results.map(r => ({
//       label: r.label.toLowerCase(),
//       score: Number(r.score),
//     }));
//   } catch (err) {
//     console.error("Failed to classify with local ONNX model:", err);
//     return [{ label: "unknown", score: 0 }];
//   }
// }

//==temporary gemini classification ==
export async function classifyFakeNews(text: string): Promise<TextClassificationResult[]> {
  if (!text?.trim()) return [{ label: "unknown", score: 0 }];

  try {
    // Temporary: Use Gemini instead of local ONNX model
    const { classifyWithGemini } = await import('./gemini-classifier');
    const geminiResult = await classifyWithGemini(text);
    
    console.log("gemini result" , geminiResult);
    // Convert Gemini format to your expected format
    return [{
      label: geminiResult.label,
      score: geminiResult.probability
    }];
    
  } catch (err) {
    console.error("Gemini classification failed:", err);
    // Fallback to your original zero-shot
    const zeroShotResult = await classifyLocalFakeRealUnknown(text);
    return [{
      label: zeroShotResult.label,
      score: zeroShotResult.probability
    }];
  }
}
