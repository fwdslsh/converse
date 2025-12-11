import type { AppConfig } from "../config.js";
import { recordWavToBuffer, playAudioBuffer } from "./audio.js";
import { createSttEngine, type SttEngine } from "./stt.js";
import { createTtsEngine, type TtsEngine } from "./tts.js";

export interface ListenForSpeechOptions {
  maxDurationSeconds: number;
  language?: string;
}

export interface SpeakTextOptions {
  text: string;
  voiceId?: string;
  language?: string;
}

export interface ConverseOptions {
  message: string;
  waitForResponse?: boolean;
  listenDurationSeconds?: number;
  minListenDurationSeconds?: number;
  voiceId?: string;
  language?: string;
  ttsProvider?: string;
  ttsModel?: string;
  ttsInstructions?: string;
}

export interface ConverseResult {
  spokenMessage: string;
  heardText?: string;
  heardLanguage?: string;
}

/**
 * A voice orchestrator implements all of the behaviours exposed by
 * the MCP tools. It wires together STT, TTS and audio I/O and
 * hides the complexity of command invocation from the tool layer.
 */
export interface VoiceOrchestrator {
  listenForSpeech(opts: ListenForSpeechOptions): Promise<{ text: string; language?: string }>;
  speakText(opts: SpeakTextOptions): Promise<void>;
  converse(opts: ConverseOptions): Promise<ConverseResult>;
}

/**
 * Create a new orchestrator based on the supplied configuration. The
 * returned object contains closures that capture the STT and TTS
 * engines and the audio commands. Because no state is stored
 * between calls, multiple tool invocations can occur concurrently.
 */
export function createVoiceOrchestrator(config: AppConfig): VoiceOrchestrator {
  const stt: SttEngine = createSttEngine(config);
  const tts: TtsEngine = createTtsEngine(config);

  // The recording and playback commands are shared across calls. Copy
  // them to avoid mutating the original arrays.
  const recordCmd = [...config.recordCmd];
  const playCmd = [...config.playCmd];

  async function listenForSpeech(opts: ListenForSpeechOptions): Promise<{ text: string; language?: string }> {
    const audio = await recordWavToBuffer(recordCmd, opts.maxDurationSeconds);
    const { text, language } = await stt.transcribe(audio, { language: opts.language });
    return { text, language };
  }

  async function speakText(opts: SpeakTextOptions): Promise<void> {
    const audio = await tts.synthesize(opts.text, {
      voiceId: opts.voiceId,
      language: opts.language
    });
    await playAudioBuffer(playCmd, audio);
  }

  async function converse(opts: ConverseOptions): Promise<ConverseResult> {
    // Step 1: speak the assistant message
    await speakText({ text: opts.message, voiceId: opts.voiceId, language: opts.language });

    // Step 2: optionally listen for a user reply
    if (opts.waitForResponse === false) {
      return { spokenMessage: opts.message };
    }
    const listenDuration = opts.listenDurationSeconds ?? 30;
    const { text, language } = await listenForSpeech({
      maxDurationSeconds: listenDuration,
      language: opts.language
    });
    return {
      spokenMessage: opts.message,
      heardText: text,
      heardLanguage: language
    };
  }

  return {
    listenForSpeech,
    speakText,
    converse
  };
}