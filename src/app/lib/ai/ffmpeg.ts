// app/lib/ai/ffmpeg.ts
import { execa } from "execa";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

export async function writeTempFile(prefix: string, ext: string, data: Buffer): Promise<string> {
  const tmp = path.join(os.tmpdir(), `${prefix}-${Date.now()}${Math.random().toString(36).slice(2)}.${ext}`);
  await fs.writeFile(tmp, data);
  return tmp;
}

export async function extractMono16kWav(inputPath: string): Promise<string> {
  const out = inputPath.replace(/\.[a-z0-9]+$/i, "") + "-16k.wav";
  await execa("ffmpeg", ["-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "16000", out]);
  return out;
}
