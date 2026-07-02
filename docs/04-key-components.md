# Key Components

## Entry Point: `src/index.ts`

- Initializes Discord client with intents: `Guilds`, `GuildMessages`, `MessageContent`, `GuildVoiceStates`
- Loads all commands (prefix + slash) and event handlers
- Starts optional Express HTTP server
- Compiles C++ native mixer on startup
- Logs in with `BOT_TOKEN`

## Configuration: `src/config.ts`

Loads environment variables. See [Configuration](03-configuration.md) for details.

## Audio System

### PlaybackEngine: `src/lib/audio/playbackEngine.ts`

Core audio mixing logic that:
- Manages lofi song playback
- Handles ambient sound layers
- Integrates with native C++ mixer

### NativeMixer: `src/lib/audio/nativeMixer.ts`

Wrapper for C++ mixer binary that handles real-time audio mixing.

### Native Mixer: `native/audio_mixer.cpp`

C++ code that mixes lofi + ambient in real-time. Compiled to `temp/native/audio_mixer`.

## Database: `temp/quickdb.json`

Simple JSON file-based storage using custom `SimpleJsonDb` class. Stores:
- Voice session data (`vc.{guildId}`)
- Current song index
- Ambient sound configurations
- 24/7 mode state
- Repeat state

### SimpleJsonDb API

```typescript
db.get(key)           // Retrieve value
db.set(key, value)    // Set value
db.has(key)           // Check if key exists
db.delete(key)        // Delete key
db.add(key, value)    // Numeric increment
```

## Core Libraries

| Module | File | Responsibility |
|--------|------|----------------|
| Audio | `src/lib/audio/playbackEngine.ts` | Audio mixing, song playback |
| Audio | `src/lib/audio/nativeMixer.ts` | C++ mixer wrapper |
| Voice | `src/lib/voice/playbackSession.ts` | Discord voice connections |
| Voice | `src/lib/voice/leaveVoice.ts` | Leave voice channel logic |
| Voice | `src/lib/voice/restoreSessions.ts` | Restore 24/7 sessions |
| Music | `src/lib/music/*.ts` | Music control operations |
| DB | `src/lib/SimpleJsonDb.ts` | JSON file database |

## Commands

This project has **18 commands** across 3 categories.

## Events

This project has **0 event handlers**.
