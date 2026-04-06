const { createAudioResource, StreamType } = require("@discordjs/voice");
const ambientLibrary = require("../../ambient-sound");
const { spawnMixerProcess } = require("./nativeMixer");

function getGuildSessions(client) {
  if (!client.mixerSessions) {
    client.mixerSessions = new Map();
  }

  return client.mixerSessions;
}

function getAmbientEntries(names) {
  return names
    .map((name) => ambientLibrary.find((item) => item.name === name))
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
      resource: createAudioResource(song.path, {
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
    process: mixerProcess,
    startOffsetSeconds,
    songIndex: options.songIndex,
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

  const mixerProcess = spawnMixerProcess({
    // No songPath — ambient-only mode
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
    process: mixerProcess,
    startOffsetSeconds: 0,
    songIndex: null,
    ambientOnly: true,
  });

  player.play(resource);
  return resource;
}

module.exports = {
  createTrackResource,
  destroyGuildMixer,
  getAmbientEntries,
  getPlaybackOffsetSeconds,
  playAmbientOnly,
  playSong,
};
