// app/lib/ai/transformers-pipeline.ts
import { pipeline, env } from "@huggingface/transformers";

// Optional offline/local configuration (uncomment and set paths for air-gapped deployments)
// env.localModelPath = "/absolute/path/to/models"; // place model repos on disk
// env.allowRemoteModels = true;                    // set false to forbid hub downloads entirely
// // Optionally pin ONNX WASM binaries locally
// // @ts-ignore
// env.backends ??= {};
// // @ts-ignore
// env.backends.onnx ??= { wasm: {} };
// // @ts-ignore
// env.backends.onnx.wasm.wasmPaths = "/absolute/path/to/wasm";

type Task =
  | "text-classification"
  | "feature-extraction"
  | "automatic-speech-recognition"
  | "zero-shot-classification";

// Narrow result types used by helpers
export type TextClassificationResult = { label: string; score: number };
export type EmbeddingResult = number[] | number[][];
export type TranscriptionResult = {
  text: string;
  chunks?: Array<{ text: string; timestamp: [number, number] }>;
};
export type ZeroShotResult = { sequence: string; labels: string[]; scores: number[] };

// Generic singleton factory with unknown storage to avoid Pipeline typing issues
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

// Pipelines (local ONNX-compatible models for Transformers.js)
const TextClassifier = P("text-classification", "Xenova/distilbert-base-uncased-finetuned-sst-2-english");
const Embedder      = P("feature-extraction", "Xenova/all-MiniLM-L6-v2");
const Transcriber   = P("automatic-speech-recognition", "Xenova/whisper-small");
const ZeroShotClf   = P("zero-shot-classification", "Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7");

// Helpers with strict call signatures

export async function classifyText(text: string): Promise<TextClassificationResult[]> {
  const clf = (await TextClassifier.get()) as (input: string) => Promise<TextClassificationResult[]>;
  return clf(text);
}

export async function embedText(text: string): Promise<number[]> {
  const emb = (await Embedder.get()) as (input: string) => Promise<EmbeddingResult>;
  const out = await emb(text);
  // Mean-pool to a single vector if a 2D token-by-dim matrix is returned
  if (Array.isArray(out) && Array.isArray((out)[0])) {
    const mat = out as number[][];
    const dim = mat[0]?.length ?? 0;
    const sum = new Array(dim).fill(0);
    for (const row of mat) for (let i = 0; i < dim; i++) sum[i] += row[i];
    return sum.map(v => v / mat.length);
  }
  return out as number[];
}

export async function transcribeFile(
  pathOrUrl: string | File | Blob
): Promise<TranscriptionResult> {
  const asr = (await Transcriber.get()) as (
    src: string | File | Blob,
    opts?: { return_timestamps?: "word" | "chunk" }
  ) => Promise<TranscriptionResult>;
  return asr(pathOrUrl, { return_timestamps: "word" });
}

// Local zero-shot Fake/Real/Unknown using multilingual NLI
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
    console.log(scores)
    console.log(pairs)
    console.log(confident)
  return {
    label: confident ? topLabel : "unknown",
    probability: confident ? topScore : secondScore,
    scores,
  };
}
