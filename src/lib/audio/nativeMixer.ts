import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import type { MixerOptions } from "../../types";

const PROJECT_ROOT = process.cwd();
const SOURCE_PATH = path.join(PROJECT_ROOT, "native/audio_mixer.cpp");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "temp/native");
const BINARY_PATH = path.join(OUTPUT_DIR, "audio_mixer");
const COMPILERS = ["clang++", "g++"];

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function binaryIsFresh(): boolean {
  if (!fs.existsSync(BINARY_PATH)) {
    return false;
  }

  const binaryStats = fs.statSync(BINARY_PATH);
  const sourceStats = fs.statSync(SOURCE_PATH);
  return binaryStats.mtimeMs >= sourceStats.mtimeMs;
}

function compileBinary(): void {
  ensureOutputDir();

  const args = [
    SOURCE_PATH,
    "-std=c++17",
    "-O3",
    "-DNDEBUG",
    "-o",
    BINARY_PATH,
  ];

  for (const compiler of COMPILERS) {
    const result = spawnSync(compiler, args, { encoding: "utf8" });

    if (result.status === 0) {
      fs.chmodSync(BINARY_PATH, 0o755);
      return;
    }

    if (result.stderr?.trim()) {
      console.error(
        `[native-mixer] ${compiler} failed:\n${result.stderr.trim()}`
      );
    }
  }

  throw new Error(
    "Failed to compile native audio mixer. Install Xcode/clang or g++."
  );
}

function ensureBinary(): string {
  if (!binaryIsFresh()) {
    compileBinary();
  }

  return BINARY_PATH;
}

function spawnMixerProcess(options: MixerOptions) {
  const binary = ensureBinary();
  const args: string[] = [];

  if (options.songPath) {
    args.push(
      "--song",
      options.songPath,
      "--song-volume",
      String(options.songVolume ?? 1),
      "--offset",
      String(Math.max(0, options.startOffsetSeconds ?? 0))
    );
  }

  for (const ambient of options.ambients ?? []) {
    args.push(
      "--ambient",
      ambient.path,
      "--ambient-volume",
      String(ambient.volume ?? 0.4)
    );
  }

  const process = spawn(binary, args, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  process.stderr.setEncoding("utf8");
  process.stderr.on("data", (chunk: string) => {
    if (chunk.trim()) {
      console.error(`[native-mixer] ${chunk.trim()}`);
    }
  });

  return process;
}

function getAudioDuration(filePath: string): number {
  const binary = ensureBinary();
  const result = execFileSync(binary, ["--probe", filePath], {
    encoding: "utf8",
    timeout: 10000,
  });
  return parseFloat(result.trim());
}

export { ensureBinary, spawnMixerProcess, getAudioDuration };
