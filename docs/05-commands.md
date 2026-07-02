# Commands

## Prefix Commands (message-based)

### General Commands

| Command | Description |
|---------|-------------|
| `help` | Bot command list or help menu. |
| `ping` | Pong! |
| `report` | Bug report |
| `support` | Need a help? |

### Music/Lofi Commands

| Command | Description |
|---------|-------------|
| `247` | Keep the bot in the voice channel even when it |
| `add` | Adds ambient to the currently playing song. |
| `ambients` | List all available ambient sounds by category. |
| `list` | list of all song |
| `nowplaying` | Get details of the currently playing song. |
| `pause` | Pauses the currently playing song. |
| `play` | start playing a song. |
| `remove` | Removes ambient on the currently playing song. |
| `repeat` | Repeating current song |
| `resume` | Resume the song that was paused. |
| `skip` | Skips the currently playing song and continues to the song after it. |
| `stop` | Stops the music being played. |
| `volume` | Controls the volume of the music being played. |

### Owner Only Commands

| Command | Description |
|---------|-------------|
| `bot` | Lihat informasi dan statistik bot. |
| `eval` | Evaluate JavaScript code |
| `sayembed` | Send embed as bot |

## Slash Commands

| Command | Description |
|---------|-------------|
| `/ping` | pong! |


## Adding New Commands

1. Add file to `src/commands/prefixes/<category>/`
2. Export command object with name, description, aliases, execute function
3. Command auto-loads on startup

### Command Structure Pattern

```typescript
export = {
  name: string,
  description: string,
  aliases?: string[],
  cooldown?: number,
  category: string,
  execute(message, args, client): Promise<void>
};
```
