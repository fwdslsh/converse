import { spawn } from "child_process";

/**
 * Record audio from the system microphone and return the raw WAV bytes.
 *
 * The recording command is provided as an array of strings and
 * should point to a utility such as `arecord` or `parec`. The
 * duration parameter is appended to the command via a `-d` flag
 * where supported. The command must emit a complete WAV to stdout.
 *
 * @param baseCmd The command to execute, e.g. ["arecord", "-f", "cd", "-t", "wav", "-q"]
 * @param durationSeconds Maximum recording duration in seconds
 */
export async function recordWavToBuffer(
  baseCmd: string[],
  durationSeconds: number
): Promise<Uint8Array> {
  // Copy the base command so we don't modify the caller's array.
  const cmd = [...baseCmd, "-d", String(durationSeconds)];
  const [bin, ...args] = cmd;

  return new Promise<Uint8Array>((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "inherit"] });

    const chunks: Buffer[] = [];
    proc.stdout?.on("data", (chunk) => {
      chunks.push(chunk as Buffer);
    });
    proc.on("error", (err) => {
      reject(err);
    });
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`record command exited with code ${code}`));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });
  });
}

/**
 * Play raw audio bytes through the system speakers.
 *
 * The playback command is provided as an array of strings and should point
 * to a utility such as `aplay` or `paplay`. Audio data is piped to
 * the command's stdin. The caller must ensure the audio format matches
 * what the playback command expects (e.g. WAV for `aplay`).
 *
 * @param cmd The command to execute, e.g. ["aplay", "-q"]
 * @param audio The raw audio data to play
 */
export async function playAudioBuffer(cmd: string[], audio: Uint8Array): Promise<void> {
  const [bin, ...args] = cmd;
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ["pipe", "inherit", "inherit"] });
    proc.on("error", (err) => {
      reject(err);
    });
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`play command exited with code ${code}`));
      } else {
        resolve();
      }
    });
    // Write the audio data to stdin and close the stream.
    proc.stdin?.write(Buffer.from(audio));
    proc.stdin?.end();
  });
}