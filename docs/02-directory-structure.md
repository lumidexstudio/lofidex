# Directory Structure

```
lofidex/
├── src/                     # TypeScript source code
│   ├── index.ts             # Main entry point
│   ├── config.ts           # Environment config loader
│   ├── types.ts            # TypeScript type extensions
│   ├── ambient-sound/      # Ambient sound metadata (by category)
│   │   ├── animals/
│   │   ├── binaural/
│   │   ├── nature/
│   │   ├── noise/
│   │   ├── places/
│   │   ├── rain/
│   │   ├── things/
│   │   ├── transport/
│   │   ├── urban/
│   │   └── index.ts        # Loads all ambient sounds
│   ├── lofi/               # Lofi MP3 songs
│   ├── commands/
│   │   ├── prefixes/       # Message commands (lumi, ldx)
│   │   │   ├── general/
│   │   │   ├── lofi/
│   │   │   └── owner/
│   │   └── slash/          # Slash commands (/)
│   ├── events/             # Discord event handlers
│   │   ├── ClientReady.ts
│   │   ├── InteractionCreate.ts
│   │   ├── MessageCreate.ts
│   │   ├── VoiceStateUpdate.ts
│   └── lib/                # Core utilities
│       ├── audio/
│       ├── voice/
│       ├── music/
│       └── SimpleJsonDb.ts
├── native/                  # C++ audio mixer source
│   └── audio_mixer.cpp
├── dist/                    # Compiled JavaScript output
├── temp/                    # Runtime data (db, mixer binary)
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env
└── .env.example
```

## Important File Locations

| Purpose | File |
|---------|------|
| Main entry | `src/index.ts` |
| Config | `src/config.ts` |
| Types | `src/types.ts` |
| Ambient sounds | `src/ambient-sound/index.ts` |
| Database | `temp/quickdb.json` |
| Native mixer | `temp/native/audio_mixer` (compiled binary) |
