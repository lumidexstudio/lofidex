# Configuration

## Environment Variables

Configuration is stored in environment variables (`.env` file).

## Required Variables

| Variable | Description |
|----------|-------------|
| `BOT_TOKEN` | Discord bot token |
| `BOT_CLIENT_ID` | Discord application ID |
| `BOT_OWNER_ID` | Comma-separated owner user IDs |
| `REPORT_TO_GUILD_ID` | Guild ID for reports |
| `REPORT_TO_CHANNEL_ID` | Channel ID for reports |
| `ERROR_TO_GUILD_ID` | Guild ID for error logs |
| `ERROR_TO_CHANNEL_ID` | Channel ID for error logs |

## Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BOT_PREFIX` | `"lumi, ldx, <@BOT_CLIENT_ID>"` | Command prefixes |
| `TOPGG_TOKEN` | - | Top.gg API token (for voter 24/7) |
| `TOPGG_VOTE_URL` | Default Top.gg link | Top.gg vote URL |
| `HASTE_SERVER` | `https://haste.lumidex.id` | Hastebin server for logs |
| `SUPPORT_SERVER` | Default support server | Support server invite link |
| `ACTIVITY_NAME` | `"ldxhelp"` | Bot status activity name |
| `ACTIVITY_TYPE` | `"Listening"` | Activity type (Playing/Listening/etc.) |
| `EMPTY_CHANNEL_LEAVE_MS` | `30000` | Time before leaving empty voice channel (ms) |
| `USE_STATIC_FFMPEG` | `false` | Use static ffmpeg from package |
| `PORT` | `3000` | HTTP server port |
| `EMOJI_*` | Various | Custom emoji overrides |

## Configuration File Location

- Template: `.env.example`
- Actual: `.env`

## Loading Configuration

Configuration is loaded in `src/config.ts` which validates all required variables on startup.