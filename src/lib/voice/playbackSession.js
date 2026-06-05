const fs = require("fs");
const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  createAudioPlayer,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, italic } = require("discord.js");
const humanizeTime = require("../humanizeTime");
const { playSong, playAmbientOnly, destroyGuildMixer } = require("../audio/playbackEngine");
const { getAudioDuration } = require("../audio/nativeMixer");
const loop = require("../music/loop");
const leaveVoice = require("./leaveVoice");
const list = require("../../lofi");

function ensureGuildTemp(guildId) {
  if (!fs.existsSync(`temp/${guildId}`)) {
    fs.mkdirSync(`temp/${guildId}`);
  }
}

// Picks a random song and starts playing it, persisting it as the current track.
async function genMusic(client, guildId, player) {
  const ambients = await client.db.get(`vc.${guildId}.ambients`);
  const idx = Math.floor(Math.random() * list.length);
  const song = list[idx];

  playSong(client, guildId, player, song, {
    ambientNames: ambients ?? [],
    songIndex: idx,
    startOffsetSeconds: 0,
    shouldSendEmbed: true,
  });

  await client.db.set(`vc.${guildId}.now`, idx);
}

// Resumes the persisted track from the start (used when restoring 24/7 sessions).
async function resumeSong(client, guildId, player) {
  const ambients = await client.db.get(`vc.${guildId}.ambients`);
  const now = await client.db.get(`vc.${guildId}.now`);
  const idx = Number.isInteger(now) ? now : 0;
  const song = list[idx] ?? list[0];

  playSong(client, guildId, player, song, {
    ambientNames: ambients ?? [],
    songIndex: idx,
    startOffsetSeconds: 0,
    shouldSendEmbed: false,
  });

  await client.db.set(`vc.${guildId}.now`, idx);
}

/**
 * Joins a voice channel and wires up the audio player for a guild's session.
 * Reads the already-persisted `vc.<guildId>` entry to decide what to play.
 *
 * @param {import('discord.js').Client} client
 * @param {object} opts
 * @param {import('discord.js').Guild} opts.guild
 * @param {import('discord.js').VoiceBasedChannel} opts.voiceChannel
 * @param {import('discord.js').TextBasedChannel|null} [opts.textChannel] where to post embeds (null = silent)
 * @param {boolean} [opts.announce] post status embeds for the first track
 * @param {boolean} [opts.resume] resume the saved track instead of picking a random one
 * @returns {Promise<{ connection, player }>}
 */
async function startPlaybackSession(client, { guild, voiceChannel, textChannel = null, announce = true, resume = false }) {
  const guildId = guild.id;
  ensureGuildTemp(guildId);

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId,
    adapterCreator: guild.voiceAdapterCreator,
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      // A brief reconnect window covers channel moves / transient drops.
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      await leaveVoice(client, guildId);
      console.log(`bot disconnected from guild ${guildId}`);
    }
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
  } catch (error) {
    await leaveVoice(client, guildId);
    throw error;
  }

  const player = createAudioPlayer();
  connection.subscribe(player);

  const session = await client.db.get(`vc.${guildId}`);
  if (session?.ambientOnly) {
    playAmbientOnly(client, guildId, player, session.ambients ?? [], { shouldSendEmbed: announce });
  } else if (resume) {
    await resumeSong(client, guildId, player);
  } else {
    await genMusic(client, guildId, player);
  }

  let embed = new EmbedBuilder().setColor("Fuchsia").setAuthor({ name: "Loading" }).setDescription(italic("Preparing..."));

  player.on(AudioPlayerStatus.Buffering, async () => {
    const meta = player.state.resource.metadata;
    if (!textChannel || !meta.shouldSendEmbed) return;

    embed.setAuthor({ name: "Buffering" }).setDescription("Please wait until song are played").setThumbnail(null);
    textChannel.send({ embeds: [embed] });
  });

  player.on(AudioPlayerStatus.Playing, async () => {
    const meta = player.state.resource.metadata;
    if (!textChannel || !meta.shouldSendEmbed) return;

    if (meta.ambientOnly) {
      const ambientNames = meta.ambientNames.map((n) => `\`${n}\``).join(", ");
      embed = embed.setAuthor({ name: "Playing Ambient" }).setDescription(`Ambients: ${ambientNames}`).setThumbnail(null).setTimestamp();

      textChannel.send({ embeds: [embed] });
    } else {
      const songDuration = getAudioDuration(meta.path);
      const sourceButton = new ButtonBuilder().setLabel("Source").setURL(meta.source).setStyle(ButtonStyle.Link);
      const row = new ActionRowBuilder().addComponents(sourceButton);

      embed = embed
        .setAuthor({ name: `Playing ${meta.title}` })
        .setDescription(`By: ${meta.author}\nDuration: ${humanizeTime(Math.ceil(songDuration))}`)
        .setThumbnail(meta.cover)
        .setTimestamp();

      textChannel.send({ embeds: [embed], components: [row] });
    }
  });

  player.on("error", (error) => {
    console.error(error);
  });

  let skipNextIdle = false;

  player.on(AudioPlayerStatus.Idle, async () => {
    if (skipNextIdle) {
      skipNextIdle = false;
      return;
    }

    destroyGuildMixer(client, guildId);

    const guildData = await client.db.get(`vc.${guildId}`);
    if (!guildData) return; // session was torn down (e.g. auto-leave) — do not restart

    if (guildData.ambientOnly) {
      // Restart ambient playback (e.g. after an unexpected stream end)
      playAmbientOnly(client, guildId, player, guildData.ambients, { shouldSendEmbed: false });
      return;
    }

    if (guildData.repeat?.state) {
      loop(client, guildId, player, textChannel);
    } else {
      await genMusic(client, guildId, player);
    }
  });

  // Expose skipNextIdle so add/remove ambient can suppress the idle restart.
  player.skipNextIdle = () => {
    skipNextIdle = true;
  };

  return { connection, player };
}

module.exports = { startPlaybackSession };
