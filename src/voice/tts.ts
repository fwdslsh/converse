import type { AppConfig } from "../config.js";

/**
 * Options for synthesising speech from text.
 */
export interface TtsOptions {
  voiceId?: string;
  language?: string;
  ttsProvider?: string;
  ttsModel?: string;
  ttsInstructions?: string;
}

/**
 * Interface implemented by all TTS engines.
 */
export interface TtsEngine {
  synthesize(text: string, opts: TtsOptions): Promise<Uint8Array>;
}

/**
 * Create an appropriate TTS engine based on configuration. Only
 * remote TTS is supported in the initial implementation. If the
 * configuration omits the API URL, this function will throw.
 */
export function createTtsEngine(config: AppConfig): TtsEngine {
  if (!config.ttsApiUrl) {
    throw new Error("TTS_API_URL must be set for remote TTS");
  }
  return new RemoteTtsEngine(config.ttsApiUrl, config.ttsApiKey, config.ttsVoice, config.ttsModel);
}

/**
 * Implementation of TTS that makes a JSON request to a remote API
 * endpoint. The returned audio bytes are assumed to be in a format
 * that the playback command can handle (we request WAV by default).
 */
class RemoteTtsEngine implements TtsEngine {
  constructor(
    private url: string,
    private apiKey?: string,
    private defaultVoice?: string,
    private defaultModel?: string
  ) {}

  async synthesize(text: string, opts: TtsOptions): Promise<Uint8Array> {
    // Build the request payload for OpenAI-compatible TTS API
    // The OpenAI API expects "input" instead of "text" and "response_format" instead of "format"
    const body: Record<string, any> = {
      model: opts.ttsModel || this.defaultModel || "tts-1",
      input: text,
      response_format: "wav"
    };
    const voice = opts.voiceId ?? this.defaultVoice ?? "alloy";
    body.voice = voice;
    if (opts.language) body.language = opts.language;
    if (opts.ttsInstructions) body.instructions = opts.ttsInstructions;

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const response = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
}