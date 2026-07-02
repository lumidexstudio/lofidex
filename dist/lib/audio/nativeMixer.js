"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureBinary = ensureBinary;
exports.spawnMixerProcess = spawnMixerProcess;
exports.getAudioDuration = getAudioDuration;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_child_process_1 = require("node:child_process");
const PROJECT_ROOT = process.cwd();
const SOURCE_PATH = node_path_1.default.join(PROJECT_ROOT, "native/audio_mixer.cpp");
const OUTPUT_DIR = node_path_1.default.join(PROJECT_ROOT, "temp/native");
const BINARY_PATH = node_path_1.default.join(OUTPUT_DIR, "audio_mixer");
const COMPILERS = ["clang++", "g++"];
function ensureOutputDir() {
    if (!node_fs_1.default.existsSync(OUTPUT_DIR)) {
        node_fs_1.default.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
}
function binaryIsFresh() {
    if (!node_fs_1.default.existsSync(BINARY_PATH)) {
        return false;
    }
    const binaryStats = node_fs_1.default.statSync(BINARY_PATH);
    const sourceStats = node_fs_1.default.statSync(SOURCE_PATH);
    return binaryStats.mtimeMs >= sourceStats.mtimeMs;
}
function compileBinary() {
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
        const result = (0, node_child_process_1.spawnSync)(compiler, args, { encoding: "utf8" });
        if (result.status === 0) {
            node_fs_1.default.chmodSync(BINARY_PATH, 0o755);
            return;
        }
        if (result.stderr?.trim()) {
            console.error(`[native-mixer] ${compiler} failed:\n${result.stderr.trim()}`);
        }
    }
    throw new Error("Failed to compile native audio mixer. Install Xcode/clang or g++.");
}
function ensureBinary() {
    if (!binaryIsFresh()) {
        compileBinary();
    }
    return BINARY_PATH;
}
function spawnMixerProcess(options) {
    const binary = ensureBinary();
    const args = [];
    if (options.songPath) {
        args.push("--song", options.songPath, "--song-volume", String(options.songVolume ?? 1), "--offset", String(Math.max(0, options.startOffsetSeconds ?? 0)));
    }
    for (const ambient of options.ambients ?? []) {
        args.push("--ambient", ambient.path, "--ambient-volume", String(ambient.volume ?? 0.4));
    }
    const process = (0, node_child_process_1.spawn)(binary, args, {
        stdio: ["ignore", "pipe", "pipe"],
    });
    process.stderr.setEncoding("utf8");
    process.stderr.on("data", (chunk) => {
        if (chunk.trim()) {
            console.error(`[native-mixer] ${chunk.trim()}`);
        }
    });
    return process;
}
function getAudioDuration(filePath) {
    const binary = ensureBinary();
    const result = (0, node_child_process_1.execFileSync)(binary, ["--probe", filePath], {
        encoding: "utf8",
        timeout: 10000,
    });
    return parseFloat(result.trim());
}
//# sourceMappingURL=nativeMixer.js.map