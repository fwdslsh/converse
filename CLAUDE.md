# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**Converse** is a lightweight Model Context Protocol (MCP) server providing voice interaction capabilities for AI-augmented development workflows. It enables AI assistants like Claude to speak and listen through OpenAI-compatible TTS/STT APIs and system audio devices. Part of the fwdslsh ecosystem, it follows the philosophy of minimal, readable, and effective tools designed to work together.

## Commands

### Development
```bash
bun install                    # Install dependencies (requires Bun for development)
npm run build                  # Build Node.js bundle and Bun executables
npm start                      # Start MCP server with Node.js
npm run start:bun              # Start MCP server with Bun
```

### Production
```bash
npm install -g @fwdslsh/converse    # Install globally
converse                            # Start MCP server (stdio transport)
```

### Testing
```bash
# Test TTS endpoint
curl -X POST "$TTS_API_URL" \
  -H "Authorization: Bearer $TTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"tts-1","input":"test","voice":"alloy","response_format":"wav"}' \
  --output test.wav && aplay test.wav

# Test STT endpoint
curl -X POST "$STT_API_URL" \
  -H "Authorization: Bearer $STT_API_KEY" \
  -F "file=@audio.wav" \
  -F "model=whisper-1"
```

## Architecture

The codebase follows a clean separation of concerns with minimal dependencies:

### Core Components

1. **`src/index.ts`** - Entry point and server lifecycle
   - Creates MCP server instance
   - Handles stdio transport initialization
   - Fatal error handling with proper exit codes
   - Lightweight startup logic

2. **`src/config.ts`** - Environment-based configuration
   - Loads all settings from process.env
   - Immutable config object (Object.freeze)
   - Sensible defaults for Linux audio commands
   - Environment variables:
     - `STT_MODE` - STT engine mode (default: "remote")
     - `STT_API_URL` - STT endpoint (required for remote mode)
     - `STT_API_KEY` - Optional bearer token
     - `TTS_API_URL` - TTS endpoint (required)
     - `TTS_API_KEY` - Optional bearer token
     - `TTS_VOICE` - Default voice (default: "alloy")
     - `TTS_MODEL` - Default model (default: "tts-1")
     - `RECORD_CMD` - Recording command (default: "arecord -f cd -t wav -q")
     - `PLAY_CMD` - Playback command (default: "aplay -q")

3. **`src/mcp/server.ts`** - MCP server creation and wiring
   - Creates McpServer instance from @modelcontextprotocol/sdk
   - Initializes VoiceOrchestrator with config
   - Registers all voice tools
   - Connects stdio transport
   - Exports start() function for lifecycle control

4. **`src/mcp/tools/voiceTools.ts`** - MCP tool registration
   - Registers three tools with zod schemas:
     - `listen_for_speech` - Record and transcribe audio
     - `speak_text` - Synthesize and play text
     - `converse` - Two-way conversation (speak + listen)
   - Input/output schema validation
   - Structured JSON responses
   - Passes through future hints (tts_provider, tts_model, tts_instructions)

### Voice Engine Components

5. **`src/voice/orchestrator.ts`** - High-level voice operations coordinator
   - Implements VoiceOrchestrator interface
   - Wires together STT, TTS, and audio I/O
   - Three main operations:
     - `listenForSpeech()` - Record → Transcribe
     - `speakText()` - Synthesize → Play
     - `converse()` - Speak → Listen (optional)
   - Stateless design (no state between calls)
   - Closures capture config and engines

6. **`src/voice/tts.ts`** - Text-to-speech engine
   - `TtsEngine` interface with `synthesize()` method
   - `RemoteTtsEngine` implementation for OpenAI-compatible APIs
   - POST request to TTS endpoint with JSON payload
   - Returns Uint8Array audio bytes (WAV format)
   - Configurable voice, model, language, instructions
   - Bearer token authentication support

7. **`src/voice/stt.ts`** - Speech-to-text engine
   - `SttEngine` interface with `transcribe()` method
   - `RemoteSttEngine` implementation for OpenAI-compatible APIs
   - Multipart/form-data upload with audio file
   - Returns { text, language } result
   - Fixed model: "whisper-1" for OpenAI compatibility
   - Optional language hint support

8. **`src/voice/audio.ts`** - System audio I/O via CLI commands
   - `recordWavToBuffer()` - Spawn recording command, capture stdout
   - `playAudioBuffer()` - Spawn playback command, pipe to stdin
   - Uses Node.js child_process spawn
   - Configurable commands via environment
   - Duration control with `-d` flag
   - Promise-based error handling

## MCP Tools

### `listen_for_speech`
Record audio from microphone and transcribe to text.

**Input:**
- `maxDurationSeconds` (number, default: 5, max: 60) - Recording length
- `language` (string, optional) - Language hint (e.g., 'en')

**Output:**
- `text` (string) - Transcribed text
- `language` (string, optional) - Detected language

### `speak_text`
Convert text to speech and play through speakers.

**Input:**
- `text` (string, required) - Message to speak
- `voiceId` (string, optional) - Voice identifier
- `language` (string, optional) - Language hint

**Output:**
- `ok` (boolean) - Success indicator

### `converse`
Speak a message and optionally listen for a response.

**Input:**
- `message` (string, required) - Assistant message to speak
- `wait_for_response` (boolean, default: true) - Listen after speaking
- `listen_duration` (number, default: 30, max: 120) - Max listen time
- `min_listen_duration` (number, default: 1) - Min recording time (unused)
- `voice` (string, optional) - Voice identifier
- `tts_provider` (string, optional) - TTS provider hint (unused)
- `tts_model` (string, optional) - TTS model hint (unused)
- `tts_instructions` (string, optional) - Stylistic instructions (unused)

**Output:**
- `spoken_message` (string) - The message that was spoken
- `heard_text` (string, optional) - Transcribed response
- `heard_language` (string, optional) - Detected language

## API Compatibility

Converse requires OpenAI-compatible TTS and STT endpoints:

### TTS Request Format
```json
{
  "model": "tts-1",
  "input": "Text to speak",
  "voice": "alloy",
  "response_format": "wav"
}
```

Response: Binary audio data (WAV format)

### STT Request Format
Multipart form-data with:
- `file` - Audio file (WAV recommended)
- `model` - "whisper-1"
- `language` (optional) - Language hint

Response:
```json
{
  "text": "Transcribed text",
  "language": "en"
}
```

Compatible services:
- OpenAI API
- LocalAI
- LMStudio
- Ollama with voice models
- Any OpenAI-compatible speech service

## Integration Patterns

### MCP Client Configuration (.mcp.json)

#### With Environment Variables
```json
{
  "mcpServers": {
    "converse": {
      "command": "converse"
    }
  }
}
```

Set environment:
```bash
export STT_API_URL="https://api.openai.com/v1/audio/transcriptions"
export STT_API_KEY="sk-..."
export TTS_API_URL="https://api.openai.com/v1/audio/speech"
export TTS_API_KEY="sk-..."
export TTS_VOICE="alloy"
```

#### With Inline Configuration
```json
{
  "mcpServers": {
    "converse": {
      "command": "converse",
      "env": {
        "STT_API_URL": "http://localhost:8080/v1/audio/transcriptions",
        "TTS_API_URL": "http://localhost:8080/v1/audio/speech",
        "TTS_VOICE": "alloy",
        "TTS_MODEL": "tts-1"
      }
    }
  }
}
```

#### With LocalAI (Self-Hosted)
```json
{
  "mcpServers": {
    "converse": {
      "command": "converse",
      "env": {
        "STT_API_URL": "http://localhost:8080/v1/audio/transcriptions",
        "TTS_API_URL": "http://localhost:8080/v1/audio/speech",
        "TTS_MODEL": "kokoro",
        "TTS_VOICE": "af_heart"
      }
    }
  }
}
```

### Custom Audio Commands

#### macOS
```bash
export PLAY_CMD="afplay"
export RECORD_CMD="sox -d -t wav -"
```

#### Linux with PulseAudio
```bash
export PLAY_CMD="paplay"
export RECORD_CMD="parecord --format=s16le --rate=44100 --channels=1"
```

#### Custom ALSA Device
```bash
export PLAY_CMD="aplay -D hw:0,0 -q"
export RECORD_CMD="arecord -D hw:1,0 -f cd -t wav -q"
```

## System Requirements

### Required Software
- **Node.js**: Version 18 or higher (for runtime)
- **Bun**: Version 1.3+ (for development only)
- **Audio Playback**: `aplay` (Linux), `afplay` (macOS), or custom
- **Audio Recording**: `arecord` (Linux), `sox` (macOS), or custom

### Linux Audio Setup
```bash
# Ubuntu/Debian
sudo apt-get install alsa-utils

# Verify installation
aplay -l      # List playback devices
arecord -l    # List recording devices

# Test recording
arecord -d 5 test.wav && aplay test.wav
```

### macOS Audio Setup
```bash
# Install sox for recording
brew install sox

# Test playback (built-in)
afplay test.wav

# Test recording
sox -d -t wav test.wav trim 0 5 && afplay test.wav
```

## Key Implementation Details

### Security
- No execution of untrusted code
- Environment-based configuration only
- No file system writes (audio piped through stdin/stdout)
- Bearer token authentication for API requests
- Input validation via zod schemas

### Performance
- Stateless operation (no session state)
- Concurrent tool calls supported
- Streaming audio via pipes (no temporary files)
- Minimal memory footprint
- Single-purpose process (MCP stdio model)

### Error Handling
- Fatal errors exit with code 1
- API failures throw with descriptive messages
- Child process errors propagated via promises
- HTTP error responses include status and body
- Graceful degradation (optional fields)

### Extensibility
Future hints supported but currently unused:
- `tts_provider` - For multi-provider TTS routing
- `tts_model` - For model-specific features
- `tts_instructions` - For stylistic control
- `min_listen_duration` - For silence detection

## Troubleshooting

### No audio playback
- Verify `aplay` works: `aplay test.wav`
- Check devices: `aplay -l`
- Try specific device: `export PLAY_CMD="aplay -D hw:0,0 -q"`
- Check volume levels: `alsamixer`

### No audio recording
- Verify `arecord` works: `arecord -d 5 test.wav && aplay test.wav`
- Check devices: `arecord -l`
- Try specific device: `export RECORD_CMD="arecord -D hw:1,0 -f cd -t wav -q"`
- Check input levels: `alsamixer` (select capture device with F4)

### API connection errors
- Verify URLs are accessible: `curl "$TTS_API_URL"`
- Check API keys are valid
- Test endpoints directly (see Testing section above)
- Verify network connectivity and firewalls

### MCP server not starting
- Check Node.js version: `node --version` (must be 18+)
- Verify converse binary is in PATH: `which converse`
- Check MCP client logs for stderr output
- Test manually: `converse` (should wait for stdin)

### Audio format errors
- Ensure TTS returns WAV format: `response_format: "wav"`
- Verify recording produces valid WAV: `file test.wav`
- Check sample rate compatibility (44100 Hz recommended)
- Try different audio backend if available

## Related Documentation

- [Main project CLAUDE.md](../../CLAUDE.md) - Hyph3n PAI architecture
- [CLI Constitution](../../docs/cli-constitution.md) - Exit codes and standards
- [MCP Specification](https://modelcontextprotocol.io) - Protocol details
- [OpenAI TTS API](https://platform.openai.com/docs/guides/text-to-speech) - TTS reference
- [OpenAI STT API](https://platform.openai.com/docs/guides/speech-to-text) - STT reference
- [LocalAI Documentation](https://localai.io/) - Self-hosted alternative

## Future Enhancements

Potential improvements for future versions:
- OS-native TTS/STT (macOS say, Windows SAPI)
- Local whisper.cpp integration for offline STT
- WebRTC for real-time streaming
- Voice activity detection for natural conversation flow
- Multiple language support with auto-detection
- Audio preprocessing (noise reduction, normalization)
- Conversation history and context management
- Voice cloning and custom model training
- Emotion detection and sentiment analysis
