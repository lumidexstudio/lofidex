# Lofidex - AI Agent Documentation

**Lofidex** is a Discord bot that plays lofi music mixed with ambient sounds in Discord voice channels.

## Quick Start

- **Language**: TypeScript → JavaScript
- **Framework**: Discord.js v14.14.1
- **Package Manager**: pnpm
- **Main entry**: `src/index.ts`

## Documentation

Detailed documentation is in the `docs/` folder:

| # | Topic | File |
|---|-------|------|
| 1 | Project Overview | [docs/01-overview.md](docs/01-overview.md) |
| 2 | Directory Structure | [docs/02-directory-structure.md](docs/02-directory-structure.md) |
| 3 | Configuration | [docs/03-configuration.md](docs/03-configuration.md) |
| 4 | Key Components | [docs/04-key-components.md](docs/04-key-components.md) |
| 5 | Commands | [docs/05-commands.md](docs/05-commands.md) |
| 6 | Events | [docs/06-events.md](docs/06-events.md) |
| 7 | Dependencies | [docs/07-dependencies.md](docs/07-dependencies.md) |
| 8 | Build & Run Commands | [docs/08-build-run.md](docs/08-build-run.md) |
| 9 | Code Conventions | [docs/09-code-conventions.md](docs/09-code-conventions.md) |
| 10 | Common Tasks | [docs/10-common-tasks.md](docs/10-common-tasks.md) |

## Common Commands

```bash
pnpm install    # Install dependencies
pnpm dev        # Development mode
pnpm build      # Build TypeScript
pnpm start      # Run production
```

---

## AI Agent: Keep Docs in Sync

**IMPORTANT**: Whenever you make changes to the codebase (especially for feature updates, refactoring, or adding/removing commands/events), you MUST update the relevant documentation files in `docs/` to keep them in sync.

### What to Update

| If you change... | Update this doc file |
|------------------|---------------------|
| New/modified commands | [docs/05-commands.md](docs/05-commands.md) |
| New/modified events | [docs/06-events.md](docs/06-events.md) |
| New/modified components or core logic | [docs/04-key-components.md](docs/04-key-components.md) |
| New/modified config variables | [docs/03-configuration.md](docs/03-configuration.md) |
| Added new dependencies | [docs/07-dependencies.md](docs/07-dependencies.md) |
| Changed directory structure | [docs/02-directory-structure.md](docs/02-directory-structure.md) |
| New code patterns or conventions | [docs/09-code-conventions.md](docs/09-code-conventions.md) |
| New common tasks or how-to guides | [docs/10-common-tasks.md](docs/10-common-tasks.md) |

### How to Update Commands (05-commands.md)

Scan all command files and extract command info:

```bash
# Prefix commands - check these directories:
ls src/commands/prefixes/general/
ls src/commands/prefixes/lofi/
ls src/commands/prefixes/owner/

# Slash commands - check:
ls src/commands/slash/general/
```

Read each command file and extract:
- `name` - command name (use `/` prefix for slash commands)
- `description` - what the command does

Update the command tables in `docs/05-commands.md` with the current commands.

### How to Update Events (06-events.md)

Scan event files:

```bash
ls src/events/
```

Read each event file and extract:
- `name` - event name
- `once` - whether it runs once (true/false)

Update the event table in `docs/06-events.md`.

### How to Update Key Components (04-key-components.md)

After any significant code changes:
1. Review the modified files
2. Update the component descriptions if their responsibilities changed
3. Update command/event counts at the bottom

### Checklist Before Committing

Before completing your work, verify docs are up to date:
- [ ] Commands documented (if added/modified)
- [ ] Events documented (if added/modified)
- [ ] Configuration documented (if changed)
- [ ] Code conventions still accurate (if patterns changed)
- [ ] Common tasks still accurate (if process changed)