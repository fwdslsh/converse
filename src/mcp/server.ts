import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "../config.js";
import { createVoiceOrchestrator } from "../voice/orchestrator.js";
import { registerVoiceTools } from "./tools/voiceTools.js";

/**
 * Construct and return an MCP server. The caller must call
 * `server.start()` to begin processing requests on stdio. Splitting
 * server creation from startup allows integration tests to
 * manipulate the server before it begins processing.
 */
export function createServer() {
  const config = loadConfig();
  const orchestrator = createVoiceOrchestrator(config);
  const server = new McpServer({
    name: "voice-mcp",
    version: "0.1.0"
  });
  // Register all of our voice tools. Tools are pure functions that
  // orchestrate STT/TTS and audio behaviour; they do not keep
  // internal state.
  registerVoiceTools(server, orchestrator);

  // Wire up the stdio transport. The transport listens for JSON
  // messages on stdin and writes responses to stdout. MCP clients
  // such as Claude will spawn this process and communicate with it.
  const transport = new StdioServerTransport();

  return {
    /** Start handling requests. */
    async start() {
      await server.connect(transport);
    }
  };
}