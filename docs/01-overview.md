# Lofidex - Project Overview

**Lofidex** is a Discord bot that plays lofi music mixed with ambient sounds (rain, nature, binaural beats, etc.) in Discord voice channels.

## Basic Info

| Property | Value |
|----------|-------|
| Language | TypeScript → JavaScript |
| Framework | Discord.js v14.14.1 |
| Package Manager | pnpm |
| Platform | Self-hosted Discord bot with Docker support |
| Node.js | v22 |

## What It Does

- Plays lofi music in Discord voice channels
- Mixes ambient sounds (rain, nature, binaural beats, etc.) in real-time
- Supports two command interfaces: prefix (`ldx`) and slash (`/`)
- Provides 24/7 playback mode (gated by Top.gg voting)
- Auto-leaves empty voice channels

## Key Features

1. **Dual audio mixing** - Lofi music + ambient sounds mixed in real-time via C++ native addon
2. **Two command interfaces** - Prefix commands and slash commands
3. **24/7 mode** - Continuous playback even when no users in VC
4. **Auto-leave** - Leaves voice channel after timeout when empty
5. **Custom client extensions** - Extended Discord.js Client interface
6. **Native audio mixer** - C++ compiled binary for performance