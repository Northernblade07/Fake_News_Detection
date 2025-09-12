// lib/ai/transformers-pipeline.ts
import { pipeline } from "@huggingface/transformers";

type Task = "text-classification" | "feature-extraction" | "automatic-speech-recognition";

function P<T extends Task>(task: T, model: string) {
  return class PipelineSingleton {
    private static instance: unknown | null = null;
    static async get(progress_callback?: (d: unknown) => void) {
      if (!this.instance) {
        this.instance = await pipeline(task, model, { progress_callback });
      }
      return this.instance as unknown;
    }
  };
}

const TextClassifier = P("text-classification", "Xenova/distilbert-base-uncased-finetuned-sst-2-english"); // fast [1]
const Embedder      = P("feature-extraction", "Xenova/all-MiniLM-L6-v2"); // 384-dims [1]
const Transcriber   = P("automatic-speech-recognition", "Xenova/whisper-tiny.en"); // tiny model [2]

export async function classifyText(text: string) {
  const clf = (await TextClassifier.get()) as (input: string) => Promise<Array<{label: string; score: number}>>;
  return clf(text);
}

export async function embedText(text: string) {
  const emb = (await Embedder.get()) as (input: string) => Promise<number[] | number[][]>;
  const out = await emb(text);
  return Array.isArray(out) ? (out as number[]) : (out as number[]); // flatten to 1D [1]
}

export async function transcribeUrl(url: string) {
  const asr = (await Transcriber.get()) as (src: string, opts?: Record<string, unknown>) => Promise<unknown>;
  return asr(url, { return_timestamps: "word" }); // whisper-tiny.en [2]
}
