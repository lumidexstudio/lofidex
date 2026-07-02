# Build & Run Commands

## Install Dependencies

```bash
pnpm install
```

## Development

```bash
pnpm dev
```
Runs TypeScript directly with tsx.

## Build

```bash
pnpm build
```
Compiles TypeScript + copies audio files to `dist/`.

## Build C++ Mixer Only

```bash
pnpm build:mixer
```
Compiles the C++ audio mixer to `temp/native/audio_mixer`.

## Production

```bash
pnpm start
```
Runs compiled JavaScript from `dist/`.

## Docker

```bash
docker-compose up --build
```

Or manually:

```bash
docker build -t lofidex .
docker run -d --env-file .env lofidex
```

## Manual Mixer Compilation

```bash
clang++ native/audio_mixer.cpp -std=c++17 -O3 -DNDEBUG -o temp/native/audio_mixer
```

## NPM Scripts Summary

| Command | Description |
|---------|-------------|
| `pnpm start` | Run compiled JavaScript |
| `pnpm dev` | Run in development mode |
| `pnpm build` | Compile TypeScript + copy audio files |
| `pnpm build:mixer` | Compile C++ audio mixer only |