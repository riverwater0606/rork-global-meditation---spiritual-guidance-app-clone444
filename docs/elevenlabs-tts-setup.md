# ElevenLabs TTS Setup

PSI-G now supports cloud narration for AI-generated meditation sessions through ElevenLabs Text to Speech.

## What it does

- Uses ElevenLabs `eleven_multilingual_v2`
- Uses a server-side Vercel proxy so the API key never appears in the app bundle
- Caches generated `.mp3` files on-device for repeat playback
- Falls back to `expo-speech` if the TTS backend is unavailable

## Required production env

Add these in Vercel Project `444`:

- `ELEVENLABS_API_KEY`

Optional overrides:

- `ELEVENLABS_BASE_URL`
  Default: `https://api.elevenlabs.io/v1`
- `ELEVENLABS_TTS_MODEL`
  Default: `eleven_multilingual_v2`
- `ELEVENLABS_TTS_VOICE_ID`
  Default: `JBFqnCBsd6RMkjVDRZzb`
- `ELEVENLABS_OUTPUT_FORMAT`
  Default: `mp3_44100_128`

## Current scope

This first version is wired to:

- AI-generated meditation sessions in [meditation/[id].tsx](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/app/meditation/%5Bid%5D.tsx)

When the user taps the voice guidance button:

1. PSI-G asks the backend for ElevenLabs speech
2. The returned MP3 is cached locally
3. Playback starts through `expo-av`
4. If ElevenLabs is unavailable, PSI-G falls back to `expo-speech`

## Backend route

- [api/tts/elevenlabs.js](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/api/tts/elevenlabs.js)

## Client helper

- [lib/elevenLabsTts.ts](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/lib/elevenLabsTts.ts)
