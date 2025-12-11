#!/usr/bin/env node

/**
 * Quick test script for TTS API
 * Run with: node .claude/skills/voice-mcp/test-tts.js
 */

const url = 'http://192.168.1.195:9090/v1/audio/speech';
const apiKey = '2c66f8a4717ffa8dccatd71fefe5f9ae67a86919f8d56c6b';

const body = {
  model: 'tts-1',
  input: 'Testing the voice TTS API!',
  voice: 'alloy',
  response_format: 'wav'
};

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`
};

console.log('Testing TTS API...');
console.log('URL:', url);
console.log('Body:', JSON.stringify(body, null, 2));

fetch(url, {
  method: 'POST',
  headers,
  body: JSON.stringify(body)
})
  .then(async (response) => {
    console.log('Response status:', response.status, response.statusText);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Request failed: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    console.log('✓ Success! Received audio data, size:', arrayBuffer.byteLength, 'bytes');
  })
  .catch((error) => {
    console.error('✗ Fetch error:', error.message);
    console.error('Stack:', error.stack);
  });
