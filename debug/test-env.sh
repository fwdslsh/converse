#!/bin/bash
# export STT_API_URL="http://192.168.1.195:9090/v1/audio/transcriptions"
# export STT_API_KEY="2c66f8a4717ffa8dccatd71fefe5f9ae67a86919f8d56c6b"
# export TTS_API_URL="http://192.168.1.195:9090/v1/audio/speech"
# export TTS_API_KEY="2c66f8a4717ffa8dccatd71fefe5f9ae67a86919f8d56c6b"
# export TTS_VOICE="alloy"

# echo "Environment variables set:"
# echo "STT_API_URL=$STT_API_URL"
# echo "TTS_API_URL=$TTS_API_URL"
# echo "API keys set"

# node dist/index.js


curl -X POST http://localhost:9090/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kokoro",
    "input": "Testing this voice",
    "voice": "af_heart",
    "response_format": "wav"
  }' \
  --output test.wav && aplay test.wav