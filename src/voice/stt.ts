import type { AppConfig } from "../config.js";

/**
 * Options for transcribing speech to text.
 */
export interface SttTranscribeOptions {
  language?: string;
}

/**
 * Result returned from the STT engine.
 */
export interface SttResult {
  text: string;
  language?: string;
}

/**
 * Interface implemented by all STT engines.
 */
export interface SttEngine {
  transcribe(audio: Uint8Array, opts: SttTranscribeOptions): Promise<SttResult>;
}

/**
 * Create an appropriate STT engine based on configuration. Currently
 * only the remote engine is supported; additional engines may be
 * implemented later (e.g. whisper.cpp CLI). When the configuration
 * requests an unsupported engine, this function will throw.
 */
export function createSttEngine(config: AppConfig): SttEngine {
  if (config.sttMode === "remote") {
    if (!config.sttApiUrl) {
      throw new Error("STT_API_URL must be set when using remote STT");
    }
    return new RemoteSttEngine(config.sttApiUrl, config.sttApiKey);
  }
  throw new Error(`Unsupported STT mode: ${config.sttMode}`);
}

/**
 * Implementation of STT that makes a multipart request to a remote
 * API endpoint. This implementation is intentionally minimal:
 * - it always uses the OpenAI whisper format (model = whisper-1)
 * - it optionally passes the language hint from the caller
 *
 * If you wish to support other providers, extend this class or
 * introduce additional engine implementations.
 */
class RemoteSttEngine implements SttEngine {
  constructor(private url: string, private apiKey?: string) {}

  async transcribe(audio: Uint8Array, opts: SttTranscribeOptions): Promise<SttResult> {
    // Assemble multipart form data. Node 18+ provides FormData and Blob
    // globally. The filename is arbitrary but some APIs require one.
    const form = new FormData();
    form.append("file", new Blob([audio as Uint8Array<ArrayBuffer>]), "audio.wav");
    // A default model name for OpenAI's Whisper endpoint. Most
    // providers require a model parameter; adapt as needed.
    form.append("model", "whisper-1");
    if (opts.language) form.append("language", opts.language);

    const headers: Record<string, string> = {};
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const response = await fetch(this.url, {
      method: "POST",
      headers,
      body: form
    });
    if (!response.ok) {
      throw new Error(`STT request failed: ${response.status} ${response.statusText}`);
    }
    // Many STT APIs return { text: "..." } or similar. We cast
    // the response to any and pick common fields. Unknown fields are
    // ignored to keep the surface area minimal.
    const data: any = await response.json();
    return {
      text: data.text ?? data.transcript ?? "",
      language: data.language ?? data.lang
    };
  }
}