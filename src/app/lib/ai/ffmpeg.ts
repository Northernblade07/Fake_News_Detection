// app/lib/ai/ffmpeg.ts
import { execa } from "execa";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import ffmpegPath from "ffmpeg-static";         // portable ffmpeg binary
import ffprobePath from "ffprobe-static";       // portable ffprobe binary

// Create a temp file from a Buffer
export async function writeTempFile(prefix: string, ext: string, data: Buffer): Promise<string> {
  const tmp = path.join(os.tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
  await fs.writeFile(tmp, data);
  return tmp;
}

// Check if input has at least one audio stream
export async function hasAudioStream(inputPath: string): Promise<boolean> {
  try {
    const { stdout } = await execa(ffprobePath as unknown as string, [
      "-v", "error",
      "-select_streams", "a",
      "-show_entries", "stream=index",
      "-of", "csv=p=0",
      inputPath,
    ]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

// Lossless audio extract (container remux); falls back to AAC encode if copy fails
export async function extractAudioCopy(inputPath: string, outExt = "m4a"): Promise<string> {
  const out = inputPath.replace(/\.[a-z0-9]+$/i, "") + `-audio.${outExt}`;
  try {
    await execa(ffmpegPath as unknown as string, ["-y", "-i", inputPath, "-vn", "-map", "0:a:0", "-c:a", "copy", out]);
    return out;
  } catch {
    await execa(ffmpegPath as unknown as string, ["-y", "-i", inputPath, "-vn", "-map", "0:a:0", "-c:a", "aac", "-b:a", "128k", out]);
    return out;
  }
}

// Encode MP3 at a target bitrate
export async function extractMp3(inputPath: string, bitrate = "128k"): Promise<string> {
  const out = inputPath.replace(/\.[a-z0-9]+$/i, "") + "-audio.mp3";
  await execa(ffmpegPath as unknown as string, ["-y", "-i", inputPath, "-vn", "-map", "0:a:0", "-c:a", "libmp3lame", "-b:a", bitrate, out]);
  return out;
}

// ASR-friendly mono 16 kHz WAV (ideal for Whisper)
export async function extractMono16kWav(inputPath: string): Promise<string> {
  const out = inputPath.replace(/\.[a-z0-9]+$/i, "") + "-16k.wav";
  await execa(ffmpegPath as unknown as string, ["-y", "-i", inputPath, "-vn", "-ac", "1", "-ar", "16000", "-f", "wav", out]);
  return out;
}

// Read a file to Buffer
export async function readFileBuffer(p: string): Promise<Buffer> {
  return fs.readFile(p);
}

// Cleanup a temp file
export async function deleteTempFile(p: string): Promise<void> {
  await fs.rm(p, { force: true }).catch(() => {});
}
