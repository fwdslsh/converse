import { createServer } from "./mcp/server.js";

/**
 * Entry point for the Voice MCP server.
 *
 * This file simply creates an instance of the MCP server and
 * starts listening on stdio. It intentionally contains minimal
 * logic so that all of the interesting pieces live in the
 * separate modules under `src/mcp` and `src/voice`. Keeping
 * index.ts lightweight makes it easy to customise the server
 * behaviour without touching the startup code.
 */
async function main(): Promise<void> {
  const server = createServer();
  await server.start();
}

main().catch((err) => {
  // If something goes terribly wrong during startup, log the
  // error to stderr and exit with a non‑zero status code. The
  // surrounding MCP client (e.g. Claude) will surface this.
  console.error("voice-mcp fatal error", err);
  process.exit(1);
});