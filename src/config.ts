/**
 * Configuration loading for the voice MCP server.
 *
 * The server behaviour can be customised entirely via environment
 * variables. This allows operators to change endpoints or keys
 * without recompiling or changing code. See README for a list
 * of supported variables.
 */

export type SttMode = "remote" | "os_cli";

export interface AppConfig {
  /**
   * Which STT engine to use. Currently only the "remote" engine
   * is implemented; passing "os_cli" will raise at runtime.
   */
  sttMode: SttMode;
  /** Base URL for the remote STT API. Required when sttMode is
   *  "remote".
   */
  sttApiUrl?: string;
  /** Optional bearer token for STT API. */
  sttApiKey?: string;

  /** Base URL for the remote TTS API. */
  ttsApiUrl?: string;
  /** Optional bearer token for TTS API. */
  ttsApiKey?: string;
  /** Default voice identifier for TTS requests. */
  ttsVoice?: string;
  /** Default TTS model to use. */
  ttsModel?: string;

  /** Command used to record audio. Example: ["arecord", "-f", "cd", "-t", "wav", "-q"]. */
  recordCmd: string[];
  /** Command used to play audio. Example: ["aplay", "-q"]. */
  playCmd: string[];
}

/**
 * Load configuration values from the process environment. When
 * optional variables are missing, sensible defaults are used. The
 * returned object is immutable so that code cannot accidentally
 * mutate configuration at runtime.
 */
export function loadConfig(): AppConfig {
  const {
    STT_MODE = "remote",
    STT_API_URL,
    STT_API_KEY,
    TTS_API_URL,
    TTS_API_KEY,
    TTS_VOICE,
    TTS_MODEL,
    RECORD_CMD,
    PLAY_CMD
  } = process.env;

  // Split record/play commands on whitespace. Use sensible defaults
  // that work well on most Linux installations. When overriding
  // RECORD_CMD or PLAY_CMD in the environment, the caller must
  // ensure the commands and flags are space‑separated.
  const recordCmd = RECORD_CMD
    ? RECORD_CMD.split(" ").filter((part) => part.length > 0)
    : ["arecord", "-f", "cd", "-t", "wav", "-q"];
  const playCmd = PLAY_CMD
    ? PLAY_CMD.split(" ").filter((part) => part.length > 0)
    : ["aplay", "-q"];

  return Object.freeze({
    sttMode: STT_MODE as SttMode,
    sttApiUrl: STT_API_URL,
    sttApiKey: STT_API_KEY,
    ttsApiUrl: TTS_API_URL,
    ttsApiKey: TTS_API_KEY,
    ttsVoice: TTS_VOICE,
    ttsModel: TTS_MODEL,
    recordCmd,
    playCmd
  });
}