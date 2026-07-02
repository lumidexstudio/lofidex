# Dependencies

## Runtime Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `discord.js` | ^14.14.1 | Discord API wrapper |
| `@discordjs/voice` | ^0.19.2 | Voice handling |
| `express` | ^4.19.1 | HTTP server |
| `ffmpeg-ffprobe-static` | ^6.1.1 | FFmpeg binaries |
| `fluent-ffmpeg` | ^2.1.2 | FFmpeg wrapper |
| `dotenv` | ^16.4.5 | Environment variables |
| `axios` | ^1.6.8 | HTTP client |
| `libsodium-wrappers` | ^0.7.13 | Encryption |
| `opusscript` | ^0.0.8 | Opus codec |
| `quick.db` | ^9.1.7 | Database (installed but custom SimpleJsonDb used) |
| `better-sqlite3` | ^9.4.3 | SQLite (installed but not actively used) |
| `ms` | ^2.1.3 | Time parsing |

## Dev Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| `typescript` | ^6.0.3 | TypeScript compiler |
| `tsx` | ^4.22.4 | TypeScript executor |
| `@types/express` | ^5.0.7 | Express types |
| `@types/fluent-ffmpeg` | ^2.1.28 | FFmpeg types |
| `@types/ms` | ^2.1.0 | MS types |
| `@types/node` | ^26.1.0 | Node.js types |

## System Requirements

| Requirement | Description |
|-------------|-------------|
| FFmpeg | Required for audio processing (can use static from package) |
| C++ compiler | Required to compile `native/audio_mixer.cpp` (clang++ or g++) |
| Node.js | v22 |