"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrackResource = createTrackResource;
exports.destroyGuildMixer = destroyGuildMixer;
exports.getAmbientEntries = getAmbientEntries;
exports.getPlaybackOffsetSeconds = getPlaybackOffsetSeconds;
exports.playAmbientOnly = playAmbientOnly;
exports.playSong = playSong;
const voice_1 = require("@discordjs/voice");
const ambient_sound_1 = __importDefault(require("../../ambient-sound"));
const nativeMixer_1 = require("./nativeMixer");
function getGuildSessions(client) {
    if (!client.mixerSessions) {
        client.mixerSessions = new Map();
    }
    return client.mixerSessions;
}
function getAmbientEntries(names) {
    return names
        .map((name) => ambient_sound_1.default.find((item) => item.name === name))
        .filter(Boolean)
        .map((item) => ({
        name: item.name,
        path: item.path,
        volume: item.defaultVolume,
    }));
}
function destroyGuildMixer(client, guildId) {
    const sessions = getGuildSessions(client);
    const session = sessions.get(guildId);
    if (!session) {
        return;
    }
    if (session.process && !session.process.killed) {
        session.process.kill("SIGKILL");
    }
    sessions.delete(guildId);
}
function getPlaybackOffsetSeconds(client, guildId, player) {
    const sessions = getGuildSessions(client);
    const session = sessions.get(guildId);
    const liveOffset = Math.floor(player.state.playbackDuration / 1000);
    return (session?.startOffsetSeconds ?? 0) + liveOffset;
}
function createTrackResource(client, guildId, song, options = {}) {
    const startOffsetSeconds = Math.max(0, options.startOffsetSeconds ?? 0);
    const ambients = getAmbientEntries(options.ambientNames ?? []);
    destroyGuildMixer(client, guildId);
    if (ambients.length === 0 && startOffsetSeconds === 0) {
        return {
            resource: (0, voice_1.createAudioResource)(song.path, {
                metadata: {
                    ...song,
                    shouldSendEmbed: options.shouldSendEmbed ?? true,
                    index: options.songIndex,
                    ambientNames: [],
                    ambientOnly: false,
                },
                inlineVolume: true,
            }),
            mixerProcess: null,
        };
    }
    const mixerProcess = (0, nativeMixer_1.spawnMixerProcess)({
        songPath: song.path,
        songVolume: options.songVolume ?? 1,
        startOffsetSeconds,
        ambients,
    });
    const resource = (0, voice_1.createAudioResource)(mixerProcess.stdout, {
        inputType: voice_1.StreamType.Raw,
        inlineVolume: true,
        metadata: {
            ...song,
            shouldSendEmbed: options.shouldSendEmbed ?? true,
            index: options.songIndex,
            ambientNames: ambients.map((item) => item.name),
            liveMix: true,
            ambientOnly: false,
        },
    });
    getGuildSessions(client).set(guildId, {
        process: mixerProcess,
        startOffsetSeconds,
        songIndex: options.songIndex ?? null,
    });
    return { resource, mixerProcess };
}
function playSong(client, guildId, player, song, options = {}) {
    const { resource } = createTrackResource(client, guildId, song, options);
    player.play(resource);
    return resource;
}
function playAmbientOnly(client, guildId, player, ambientNames, options = {}) {
    const ambients = getAmbientEntries(ambientNames);
    if (ambients.length === 0) {
        throw new Error("No valid ambients provided");
    }
    destroyGuildMixer(client, guildId);
    const mixerProcess = (0, nativeMixer_1.spawnMixerProcess)({
        ambients,
    });
    const resource = (0, voice_1.createAudioResource)(mixerProcess.stdout, {
        inputType: voice_1.StreamType.Raw,
        inlineVolume: true,
        metadata: {
            shouldSendEmbed: options.shouldSendEmbed ?? true,
            ambientNames: ambients.map((item) => item.name),
            liveMix: true,
            ambientOnly: true,
        },
    });
    getGuildSessions(client).set(guildId, {
        process: mixerProcess,
        startOffsetSeconds: 0,
        songIndex: null,
        ambientOnly: true,
    });
    player.play(resource);
    return resource;
}
//# sourceMappingURL=playbackEngine.js.map