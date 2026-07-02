# Events

Discord event handlers are located in `src/events/`.

## Event List

| Event | File | Once |
|-------|------|------|


## Event Handler Pattern

```typescript
export = {
  name: string,
  once?: boolean,
  execute(client, ...args): Promise<void>
};
```

## Event Details

### ClientReady

- Runs once when bot connects to Discord
- Registers slash commands globally
- Restores 24/7 sessions from database
- Sets bot activity/status

### InteractionCreate

- Handles slash command interactions
- Routes to appropriate command handler

### MessageCreate

- Handles prefix command messages
- Parses command prefix and arguments
- Routes to appropriate command handler

### VoiceStateUpdate

- Monitors voice channel state changes
- Auto-leaves when channel is empty (after `EMPTY_CHANNEL_LEAVE_MS`)
- Handles 24/7 mode persistence
