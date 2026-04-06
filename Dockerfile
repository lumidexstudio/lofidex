# Stage 1: Builder — compile C++ mixer and install deps
FROM node:22-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends g++ python3 make && rm -rf /var/lib/apt/lists/*
RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN mkdir -p temp/native && \
    g++ native/audio_mixer.cpp -std=c++17 -O3 -DNDEBUG -o temp/native/audio_mixer && \
    chmod 755 temp/native/audio_mixer

# Prune dev dependencies
RUN pnpm prune --prod

# Stage 2: Runtime — slim image with ffmpeg only
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app .

ENV USE_STATIC_FFMPEG=false

ARG PORT
EXPOSE ${PORT:-3000}

CMD ["node", "src/index.js"]
