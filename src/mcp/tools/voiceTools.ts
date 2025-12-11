import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { VoiceOrchestrator } from "../../voice/orchestrator.js";

/**
 * Register all voice-related tools with the provided MCP server.
 * Tools describe their inputs and outputs using zod schemas. When
 * called via MCP, the handler functions coordinate with the
 * orchestrator to perform the requested behaviour.
 *
 * @param server The MCP server instance to register tools on
 * @param orchestrator The orchestrator that implements the voice primitives
 */
export function registerVoiceTools(server: McpServer, orchestrator: VoiceOrchestrator): void {
  // Tool: listen_for_speech
  server.registerTool("listen_for_speech", {
    description: "Record short audio from the microphone and transcribe it to text.",
    inputSchema: z.object({
      maxDurationSeconds: z
        .number()
        .int()
        .positive()
        .max(60)
        .default(5)
        .describe("Maximum length of the recording in seconds."),
      language: z
        .string()
        .optional()
        .describe("Language hint for the STT engine (e.g. 'en' for English).")
    }),
    outputSchema: z.object({
      text: z.string(),
      language: z.string().optional()
    })
  }, async (args) => {
    const { text, language } = await orchestrator.listenForSpeech({
      maxDurationSeconds: args.maxDurationSeconds,
      language: args.language
    });
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ text, language })
        }
      ],
      structuredContent: { text, language }
    };
  });

  // Tool: speak_text
  server.registerTool("speak_text", {
    description: "Convert text to speech and play it through the speakers.",
    inputSchema: z.object({
      text: z.string().describe("The message to speak."),
      voiceId: z.string().optional().describe("Voice identifier to use for TTS."),
      language: z.string().optional().describe("Language hint for the TTS engine.")
    }),
    outputSchema: z.object({
      ok: z.boolean()
    })
  }, async (args) => {
    await orchestrator.speakText({
      text: args.text,
      voiceId: args.voiceId,
      language: args.language
    });
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ ok: true })
        }
      ],
      structuredContent: { ok: true }
    };
  });

  // Tool: converse
  server.registerTool("converse", {
    description:
      "Speak a message aloud to the user and optionally listen for a spoken response.",
    inputSchema: z.object({
      message: z.string().describe("The assistant message to speak aloud."),
      wait_for_response: z
        .boolean()
        .default(true)
        .describe(
          "Whether to listen for a reply after speaking. If false, the tool will return immediately after speaking."
        ),
      listen_duration: z
        .number()
        .positive()
        .max(120)
        .default(30)
        .describe("Maximum time to listen for a response, in seconds."),
      min_listen_duration: z
        .number()
        .positive()
        .max(60)
        .default(1)
        .describe(
          "Minimum recording time before silence detection can end listening. This parameter is ignored in the current implementation."
        ),
      voice: z.string().optional().describe("Voice identifier to use for TTS."),
      tts_provider: z
        .string()
        .optional()
        .describe(
          "Hint for the TTS provider (e.g. 'openai' or 'elevenlabs'). Currently unused."
        ),
      tts_model: z
        .string()
        .optional()
        .describe(
          "Hint for a specific TTS model. Passed through as a hint but unused by default."
        ),
      tts_instructions: z
        .string()
        .optional()
        .describe(
          "Stylistic instructions for TTS generation. Passed through as a hint but unused by default."
        )
    }),
    outputSchema: z.object({
      spoken_message: z.string(),
      heard_text: z.string().optional(),
      heard_language: z.string().optional()
    })
  }, async (args) => {
    const result = await orchestrator.converse({
      message: args.message,
      waitForResponse: args.wait_for_response,
      listenDurationSeconds: args.listen_duration,
      minListenDurationSeconds: args.min_listen_duration,
      voiceId: args.voice,
      // Future hints are passed through; your orchestrator may choose to
      // inspect these values when you extend the TTS engine to support
      // multiple providers or models.
      ttsProvider: args.tts_provider,
      ttsModel: args.tts_model,
      ttsInstructions: args.tts_instructions
    });
    const structuredData = {
      spoken_message: result.spokenMessage,
      heard_text: result.heardText,
      heard_language: result.heardLanguage
    };
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(structuredData)
        }
      ],
      structuredContent: structuredData
    };
  });
}