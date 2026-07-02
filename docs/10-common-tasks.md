# Common Tasks

This guide covers common tasks for AI agents working on this project.

## Adding a New Ambient Sound Category

1. Create folder in `src/ambient-sound/<category>/`
2. Add MP3 files to the folder
3. Add entry in `src/ambient-sound/index.ts` with category metadata

Example entry in `src/ambient-sound/index.ts`:
```typescript
{
  id: "rain_light",
  name: "Light Rain",
  category: "rain",
  file: "rain_light.mp3"
}
```

## Adding a New Command

1. Add file to `src/commands/prefixes/<category>/`
2. Export command object with name, description, aliases, execute function
3. Command auto-loads on startup

Example:
```typescript
export = {
  name: "commandname",
  description: "Command description",
  aliases: ["alias1", "alias2"],
  cooldown: 3,
  category: "categoryname",
  async execute(message, args, client): Promise<void> {
    // command logic
  }
};
```

## Modifying Audio Mixing

### High-level logic
Edit `src/lib/audio/playbackEngine.ts`

### C++ mixing logic
Edit `native/audio_mixer.cpp`

### Rebuild mixer
```bash
pnpm build:mixer
```

## Modifying Configuration

1. Edit `src/config.ts` to add/change variables
2. Update `.env.example` with new variables

## Adding a New Event Handler

1. Create file in `src/events/`
2. Export event object with name, once?, execute function
3. Event auto-loads on startup

Example:
```typescript
export = {
  name: "eventName",
  once: false,
  async execute(client, ...args): Promise<void> {
    // event logic
  }
};
```