import {
  createAudioResource,
  StreamType,
  type AudioPlayer,
} from "@discordjs/voice";
import type { Client } from "discord.js";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import ambientLibrary from "../../ambient-sound";
import { spawnMixerProcess } from "./nativeMixer";
import type { AmbientLayer, LofiSong, PlaybackOptions } from "../../types";

function getGuildSessions(
  client: Client
): Map<string, { process: ChildProcessWithoutNullStreams; startOffsetSeconds: number; songIndex: number | null; ambientOnly?: boolean }> {
  if (!client.mixerSessions) {
    client.mixerSessions = new Map();
  }
  return client.mixerSessions as Map<string, { process: ChildProcessWithoutNullStreams; startOffsetSeconds: number; songIndex: number | null; ambientOnly?: boolean }>;
}

function getAmbientEntries(names: string[]): AmbientLayer[] {
  return names
    .map((name) => ambientLibrary.find((item) => item.name === name))
    .filter(Boolean)
    .map((item) => ({
      name: item!.name,
      path: item!.path,
      volume: item!.defaultVolume,
    }));
}

function destroyGuildMixer(
  client: Client,
  guildId: string
): void {
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

function getPlaybackOffsetSeconds(
  client: Client,
  guildId: string,
  player: AudioPlayer
): number {
  const sessions = getGuildSessions(client);
  const session = sessions.get(guildId);
  const liveOffset = Math.floor(
    (player.state as { playbackDuration: number }).playbackDuration / 1000
  );
  return (session?.startOffsetSeconds ?? 0) + liveOffset;
}

function createTrackResource(
  client: Client,
  guildId: string,
  song: LofiSong,
  options: PlaybackOptions = {}
) {
  const startOffsetSeconds = Math.max(
    0,
    options.startOffsetSeconds ?? 0
  );
  const ambients = getAmbientEntries(options.ambientNames ?? []);

  destroyGuildMixer(client, guildId);

  if (ambients.length === 0 && startOffsetSeconds === 0) {
    return {
      resource: createAudioResource(song.path, {
        metadata: {
          ...song,
          shouldSendEmbed: options.shouldSendEmbed ?? true,
          index: options.songIndex,
          ambientNames: [] as string[],
          ambientOnly: false,
        },
        inlineVolume: true,
      }),
      mixerProcess: null,
    };
  }

  const mixerProcess = spawnMixerProcess({
    songPath: song.path,
    songVolume: options.songVolume ?? 1,
    startOffsetSeconds,
    ambients,
  });

  const resource = createAudioResource(mixerProcess.stdout, {
    inputType: StreamType.Raw,
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
    process: mixerProcess as unknown as ChildProcessWithoutNullStreams,
    startOffsetSeconds,
    songIndex: options.songIndex ?? null,
  });

  return { resource, mixerProcess };
}

function playSong(
  client: Client,
  guildId: string,
  player: AudioPlayer,
  song: LofiSong,
  options: PlaybackOptions = {}
) {
  const { resource } = createTrackResource(
    client,
    guildId,
    song,
    options
  );
  player.play(resource as Parameters<typeof player.play>[0]);
  return resource;
}

function playAmbientOnly(
  client: Client,
  guildId: string,
  player: AudioPlayer,
  ambientNames: string[],
  options: PlaybackOptions = {}
) {
  const ambients = getAmbientEntries(ambientNames);

  if (ambients.length === 0) {
    throw new Error("No valid ambients provided");
  }

  destroyGuildMixer(client, guildId);

  const mixerProcess = spawnMixerProcess({
    ambients,
  });

  const resource = createAudioResource(mixerProcess.stdout, {
    inputType: StreamType.Raw,
    inlineVolume: true,
    metadata: {
      shouldSendEmbed: options.shouldSendEmbed ?? true,
      ambientNames: ambients.map((item) => item.name),
      liveMix: true,
      ambientOnly: true,
    },
  });

  getGuildSessions(client).set(guildId, {
    process: mixerProcess as unknown as ChildProcessWithoutNullStreams,
    startOffsetSeconds: 0,
    songIndex: null,
    ambientOnly: true,
  });

  player.play(resource as Parameters<typeof player.play>[0]);
  return resource;
}

export {
  createTrackResource,
  destroyGuildMixer,
  getAmbientEntries,
  getPlaybackOffsetSeconds,
  playAmbientOnly,
  playSong,
};
