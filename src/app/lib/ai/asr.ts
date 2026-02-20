import {
  extractMono16kWav,
  hasAudioStream,
  deleteTempFile,
} from "./ffmpeg";
import { transcribeFile } from "./transcribe"; // Import from the new file

export async function transcribeMedia(inputPath: string): Promise<string> {
  let wavPath: string | null = null;

  try {
    // 1. Check if the file actually has audio
    // const hasAudio = await hasAudioStream(inputPath);
    // if (!hasAudio) {
    //   console.log("No audio stream found in file.");
    //   return "";
    // }



    // 2. Convert to 16k Mono WAV (Standardizes input for Groq & reduces file size)
    // Even though Groq accepts mp3/mp4, sending a small WAV is faster/safer
    wavPath = await extractMono16kWav(inputPath);

    console.log(wavPath)
    // 3. Send to Groq
    const result = await transcribeFile(wavPath);

    console.log(result)
    
    return result?.text?.trim() || "";

  } catch (err) {
    console.error("Media processing failed:", err);
    return "";
  } finally {
    // 4. Cleanup the intermediate WAV file
    if (wavPath) {
      await deleteTempFile(wavPath);
    }
    // Note: We do NOT delete inputPath here because the main route handles that
  }
}