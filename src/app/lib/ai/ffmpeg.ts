// app/lib/ai/ffmpeg.ts
import { execa } from "execa";
import { promises as fs } from "fs";
import fsSync from "fs";
import path from "path";
import os from "os";
import ffmpeg from "ffmpeg-static";
import ffprobe from "ffprobe-static";

export const runtime = "nodejs";

/**
 * Fix Next.js /ROOT binary path bug
 */
function resolveBinary(
  binaryPath: string | null | undefined,
  fallback: string
) {
  if (!binaryPath) return fallback;

  // Next.js build bug fix
  if (binaryPath.startsWith("/ROOT")) {
    binaryPath = binaryPath.replace("/ROOT", process.cwd());
  }

  // ensure file exists
  if (fsSync.existsSync(binaryPath)) {
    return binaryPath;
  }

  return fallback;
}

// ---- RESOLVE FFMPEG ----
const FFMPEG_PATH = resolveBinary(
  ffmpeg as string,
  path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg")
);

// ---- RESOLVE FFPROBE ----
const FFPROBE_PATH = resolveBinary(
  ffprobe.path,
  path.join(
    process.cwd(),
    "node_modules",
    "ffprobe-static",
    "bin",
    process.platform === "darwin"
      ? "darwin"
      : process.platform,
    process.arch,
    process.platform === "win32" ? "ffprobe.exe" : "ffprobe"
  )
);

console.log("✅ FFMPEG PATH:", FFMPEG_PATH);
console.log("✅ FFPROBE PATH:", FFPROBE_PATH);

// Create temp file
export async function writeTempFile(
  prefix: string,
  ext: string,
  data: Buffer
): Promise<string> {
  const tmp = path.join(
    os.tmpdir(),
    `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`
  );
  await fs.writeFile(tmp, data);
  return tmp;
}

// Check audio stream
export async function hasAudioStream(inputPath: string): Promise<boolean> {
  try {
    const { stdout } = await  execa(FFPROBE_PATH as string, [
      "-v",
      "error",
      "-select_streams",
      "a",
      "-show_entries",
      "stream=index",
      "-of",
      "csv=p=0",
      inputPath,
    ]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

// Lossless audio extract
export async function extractAudioCopy(
  inputPath: string,
  outExt = "m4a"
): Promise<string> {
  const out =
    inputPath.replace(/\.[a-z0-9]+$/i, "") + `-audio.${outExt}`;

  try {
    await execa(
      FFMPEG_PATH as string,
      ["-y", "-i", inputPath, "-vn", "-map", "0:a:0", "-c:a", "copy", out],
      { timeout: 30000,
        reject:true
       }
    );
  } catch {
    await execa(
      FFMPEG_PATH as string,
      [
        "-y",
        "-i",
        inputPath,
        "-vn",
        "-map",
        "0:a:0",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        out,
      ],
      { timeout: 30000,
        reject:true
       }
    );
  }

  return out;
}

// MP3 extract
export async function extractMp3(
  inputPath: string,
  bitrate = "128k"
): Promise<string> {
  const out =
    inputPath.replace(/\.[a-z0-9]+$/i, "") + "-audio.mp3";

  await execa(
    FFMPEG_PATH as string,
    [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-map",
      "0:a:0",
      "-c:a",
      "libmp3lame",
      "-b:a",
      bitrate,
      out,
    ],
    { timeout: 30000 ,
      reject:true
    }
  );

  return out;
}

// Whisper-friendly WAV
export async function extractMono16kWav(
  inputPath: string
): Promise<string> {
  const out =
    inputPath.replace(/\.[a-z0-9]+$/i, "") + "-16k.wav";
console.log("FFMPEG converting:", inputPath);

  await execa(
    FFMPEG_PATH as string,
    [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-f",
      "wav",
      out,
    ],
    { timeout: 30000 ,
      reject:true
    }
  );

  return out;
}

// Read buffer
export async function readFileBuffer(p: string): Promise<Buffer> {
  return fs.readFile(p);
}

// Cleanup
export async function deleteTempFile(p: string): Promise<void> {
  await fs.rm(p, { force: true }).catch(() => {});
}
