# converse

A lightweight Model Context Protocol (MCP) server that provides voice capabilities using remote OpenAI-compatible TTS/STT APIs. Enables AI assistants like Claude to speak and listen through your system's audio devices.

## Features

- **Text-to-Speech (TTS)**: Convert text to natural-sounding speech
- **Speech-to-Text (STT)**: Transcribe spoken audio to text
- **Two-Way Conversation**: Speak and listen in a single interaction
- **OpenAI-Compatible**: Works with any OpenAI-compatible TTS/STT API
- **System Audio**: Uses standard Linux audio utilities (`aplay`, `arecord`)

## Installation

```bash
npm install -g @fwdslsh/converse
```

## Quick Start

### 1. Configure Environment Variables

The converse server requires API endpoints for TTS and STT services:

```bash
export STT_API_URL="https://your-api.example.com/v1/audio/transcriptions"
export STT_API_KEY="your-stt-api-key"
export TTS_API_URL="https://your-api.example.com/v1/audio/speech"
export TTS_API_KEY="your-tts-api-key"
export TTS_VOICE="alloy"  # Optional: default voice
export TTS_MODEL="tts-1"  # Optional: default model
```

### 2. Add to MCP Client Configuration

For Claude Code, add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "converse": {
      "command": "converse",
      // Optionally set configuration here instead of ENV
      //"env": {
      //  "STT_API_URL": "https://your-api.example.com/v1/audio/transcriptions",
      //  "STT_API_KEY": "your-stt-api-key",
      //  "TTS_API_URL": "https://your-api.example.com/v1/audio/speech",
      //  "TTS_API_KEY": "your-tts-api-key",
      //  "TTS_VOICE": "alloy",
      //  "TTS_MODEL": "tts-1"
      //}
    }
  }
}
```

### 3. Start Your MCP Client

The converse server will automatically start when your MCP client connects.

## Available Tools

### `speak_text`

Convert text to speech and play through speakers.

**Parameters:**

- `text` (string, required): The message to speak
- `voiceId` (string, optional): Voice identifier (default: "alloy")
- `language` (string, optional): Language hint for TTS

**Example:**

```javascript
await mcp.call('speak_text', {
  text: 'Hello! I can speak now.',
  voiceId: 'alloy'
});
```

### `listen_for_speech`

Record audio from microphone and transcribe to text.

**Parameters:**

- `maxDurationSeconds` (number, optional): Maximum recording length (default: 5, max: 60)
- `language` (string, optional): Language hint for STT (e.g., 'en')

**Returns:**

- `text` (string): Transcribed text
- `language` (string, optional): Detected language

**Example:**

```javascript
const result = await mcp.call('listen_for_speech', {
  maxDurationSeconds: 10,
  language: 'en'
});
console.log('You said:', result.text);
```

### `converse`

Speak a message and optionally listen for a response (two-way conversation).

**Parameters:**

- `message` (string, required): The message to speak
- `wait_for_response` (boolean, optional): Whether to listen after speaking (default: true)
- `listen_duration` (number, optional): Max listen time in seconds (default: 30, max: 120)
- `voice` (string, optional): Voice identifier
- `tts_model` (string, optional): TTS model hint
- `tts_provider` (string, optional): TTS provider hint

**Returns:**

- `spoken_message` (string): The message that was spoken
- `heard_text` (string, optional): Transcribed response (if `wait_for_response` is true)
- `heard_language` (string, optional): Detected language of response

**Example:**

```javascript
const result = await mcp.call('converse', {
  message: 'Can you hear me?',
  wait_for_response: true,
  listen_duration: 15
});
console.log('I said:', result.spoken_message);
console.log('You said:', result.heard_text);
```

## Environment Variables

### Required

- `TTS_API_URL`: OpenAI-compatible TTS API endpoint (e.g., `https://api.example.com/v1/audio/speech`)
- `STT_API_URL`: OpenAI-compatible STT API endpoint (e.g., `https://api.example.com/v1/audio/transcriptions`)

### Optional

- `TTS_API_KEY`: Bearer token for TTS API authentication
- `STT_API_KEY`: Bearer token for STT API authentication
- `TTS_VOICE`: Default voice for TTS (default: "alloy")
- `TTS_MODEL`: Default TTS model to use (default: "tts-1")
- `PLAY_CMD`: Custom audio playback command (default: `aplay -q`)
- `RECORD_CMD`: Custom audio recording command (default: `arecord -f cd -t wav -q`)
- `STT_MODE`: STT engine mode (default: "remote", only "remote" is currently supported)

## System Requirements

### Linux

- **Audio Playback**: `aplay` (from ALSA utils) or custom command via `PLAY_CMD`
- **Audio Recording**: `arecord` (from ALSA utils) or custom command via `RECORD_CMD`
- **Node.js**: Version 18 or higher

### Installation on Ubuntu/Debian

```bash
sudo apt-get install alsa-utils
```

### macOS/Windows

Audio recording and playback require system-specific commands. Configure via environment variables:

**macOS:**

```bash
export PLAY_CMD="afplay"
export RECORD_CMD="sox -d -t wav -"
```

## API Compatibility

This server expects OpenAI-compatible API endpoints:

### TTS Request Format

```json
{
  "model": "tts-1",
  "input": "Text to speak",
  "voice": "alloy",
  "response_format": "wav"
}
```

### STT Request Format

```json
{
  "file": "<audio file>",
  "model": "whisper-1"
}
```

Compatible services include:

- OpenAI API
- LocalAI
- FastAPI-based TTS/STT servers
- Any OpenAI-compatible speech service

## Example: Using with LocalAI

[LocalAI](https://localai.io/) provides OpenAI-compatible TTS/STT endpoints that run locally on your machine.

### 1. Install and Start LocalAI

```bash
# Using Docker
docker run -p 8080:8080 -v $PWD/models:/models localai/localai:latest

# Or install locally
# See https://localai.io/basics/getting_started/
```

### 2. Configure Converse for LocalAI

```bash
export STT_API_URL="http://localhost:8080/v1/audio/transcriptions"
export TTS_API_URL="http://localhost:8080/v1/audio/speech"
export TTS_MODEL="tts-1"  # Or your LocalAI TTS model name
export TTS_VOICE="alloy"
# No API keys needed for local deployment
```

### 3. Update .mcp.json

```json
{
  "mcpServers": {
    "converse": {
      "command": "converse",
      "env": {
        "STT_API_URL": "http://localhost:8080/v1/audio/transcriptions",
        "TTS_API_URL": "http://localhost:8080/v1/audio/speech",
        "TTS_MODEL": "tts-1",
        "TTS_VOICE": "alloy"
      }
    }
  }
}
```

### 4. Test the Setup

```bash
# Test TTS endpoint
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "Hello from LocalAI",
    "voice": "alloy",
    "response_format": "wav"
  }' \
  --output test.wav && aplay test.wav
```

**Note:** Make sure LocalAI has the appropriate TTS and STT models installed. See the [LocalAI models documentation](https://localai.io/models/) for setup instructions.

### Finding Available Voices in LocalAI

LocalAI supports multiple TTS backends (Piper, Coqui, etc.), each with different voices:

**List All Available Models:**

```bash
# Query LocalAI's models endpoint (adjust port if needed)
curl http://localhost:8080/v1/models | jq -r '.data[].id'

# Filter for TTS models only
curl http://localhost:8080/v1/models | jq -r '.data[].id' | grep -i tts
```

**Common Voice Naming Patterns:**

- **Kokoro TTS**: `af_heart`, `am_heart`, `bf_heart`, `bm_heart`, `af_sky`, `af_bella`
  - See [Kokoro TTS Documentation](https://github.com/hexgrad/kokoro) for complete voice list
- **Piper TTS**: `en_US_lessac_medium`, `en_GB_alan_low`, `en_US_amy_low`
  - See [Piper Voices](https://rhasspy.github.io/piper-samples/) for samples
- **Coqui TTS**: Depends on installed models
  - Check LocalAI config or [Coqui TTS Models](https://github.com/coqui-ai/TTS)

**4. Test a Specific Voice:**

```bash
# Replace "en_US_lessac_medium" with your voice name
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kokoro",
    "input": "Testing this voice",
    "voice": "af_heart",
    "response_format": "wav"
  }' \
  --output test.wav && aplay test.wav
```

**5. Configure Multiple Voices:**

You can switch voices dynamically per conversation, or set a default:

```json
{
  "mcpServers": {
    "converse": {
      "command": "converse",
      "env": {
        "STT_API_URL": "http://localhost:8080/v1/audio/transcriptions",
        "TTS_API_URL": "http://localhost:8080/v1/audio/speech",
        "TTS_VOICE": "en_US_lessac_medium",  // Your preferred Piper voice
        "TTS_MODEL": "tts-1"
      }
    }
  }
}
```

**Note:** The backend (Piper vs. Coqui) is determined automatically by LocalAI based on the voice name you specify, as each voice is tied to a specific backend in LocalAI's configuration.

## Troubleshooting

### No audio playback

- Verify `aplay` works: `aplay test.wav`
- Check audio devices: `aplay -l`
- Try different device: `export PLAY_CMD="aplay -D hw:0,0 -q"`

### No audio recording

- Verify `arecord` works: `arecord -d 5 test.wav && aplay test.wav`
- Check input devices: `arecord -l`
- Try different device: `export RECORD_CMD="arecord -D hw:1,0 -f cd -t wav -q"`

### API connection errors

- Verify API URLs are correct and accessible
- Check API keys are valid
- Test endpoints directly with `curl`:

  ```bash
  curl -X POST "$TTS_API_URL" \
    -H "Authorization: Bearer $TTS_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model":"tts-1","input":"test","voice":"alloy","response_format":"wav"}' \
    --output test.wav
  ```

## Development

### Build from source

```bash
git clone https://github.com/fwdslsh/converse.git
cd converse
npm install
npm run build
```

### Run locally

```bash
export STT_API_URL="..."
export TTS_API_URL="..."
npm start
```

## License

CC-BY

## Contributing

Contributions welcome! Please open an issue or PR at <https://github.com/fwdslsh/converse>

## Acknowledgments

Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
