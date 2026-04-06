const { joinVoiceChannel, VoiceConnectionStatus, entersState, createAudioPlayer, AudioPlayerStatus, getVoiceConnection } = require("@discordjs/voice");
const { ActionRowBuilder } = require("discord.js");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, italic } = require("discord.js");
const humanizeTime = require("../../../lib/humanizeTime");
const { errorEmbed, infoEmbed } = require("../../../lib/embed");
const fs = require("fs");
const loop = require("../../../lib/music/loop");
const { playSong, playAmbientOnly, destroyGuildMixer } = require("../../../lib/audio/playbackEngine");
const { getAudioDuration } = require("../../../lib/audio/nativeMixer");
const ambientLibrary = require("../../../ambient-sound");

function findAmbient(name) {
  // Exact match first
  const exact = ambientLibrary.find((item) => item.name === name);
  if (exact) return exact;

  // Partial match — user may omit category prefix (e.g. "heavy-rain" instead of "rain-heavy-rain")
  return ambientLibrary.find((item) => {
    const parts = item.name.split("-");
    // Strip the category prefix if the name has one (e.g. "rain-heavy-rain" → "heavy-rain")
    if (item.category !== "root" && item.name.startsWith(item.category + "-")) {
      const withoutPrefix = item.name.slice(item.category.length + 1);
      if (withoutPrefix === name) return true;
    }
    return false;
  });
}

async function genMusic(message, player) {
  let list = require("../../../lofi");
  let ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);
  const idx = Math.floor(Math.random() * list.length);
  const song = list[idx];

  playSong(message.client, message.guild.id, player, song, {
    ambientNames: ambients ?? [],
    songIndex: idx,
    startOffsetSeconds: 0,
    shouldSendEmbed: true,
  });

  await message.client.db.set(`vc.${message.guild.id}.now`, idx);
}

module.exports = {
  name: "play",
  description: "start playing a song.",
  aliases: ["p"],
  cooldown: 3,
  category: "lofi",
  args: ["<ambient?>"],
  async execute(message, args) {
    const voiceChannelId = message.member.voice.channelId;
    if (!voiceChannelId) return message.replyWithoutMention({ embeds: [errorEmbed("You must be on the voice channel first!")] });

    const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel) return message.replyWithoutMention({ embeds: [errorEmbed(`Voice channel not found`)] });

    const existingConnection = getVoiceConnection(message.guild.id);
    if (existingConnection) {
      if (existingConnection.state.status !== VoiceConnectionStatus.Destroyed) {
        return message.replyWithoutMention({ embeds: [infoEmbed("Lofidex is already on the voice channel and is probably playing lofi.")] });
      }

      existingConnection.destroy();
    }

    if (!fs.existsSync(`temp/${message.guild.id}`)) {
      fs.mkdirSync(`temp/${message.guild.id}`);
    }

    // Check if the argument is an ambient name
    const ambientArg = args[0] ? findAmbient(args[0]) : null;
    const isAmbientOnly = !!ambientArg;

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      try {
        await Promise.race([entersState(connection, VoiceConnectionStatus.Signalling, 5_000), entersState(connection, VoiceConnectionStatus.Connecting, 5_000)]);

        console.log("bot pindah vc?");
      } catch (error) {
        destroyGuildMixer(message.client, message.guild.id);
        connection.destroy();
        await message.client.db.delete(`vc.${message.guild.id}`);
        console.log("bot disconnected");
      }
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch (error) {
      destroyGuildMixer(message.client, message.guild.id);
      connection.destroy();
      await message.client.db.delete(`vc.${message.guild.id}`);
      return message.replyWithoutMention({ embeds: [errorEmbed("Failed to join the voice channel.")] });
    }

    await message.client.db.set(`vc.${message.guild.id}`, {
      channel: voiceChannel.id,
      master: message.member.user.id,
      ambients: isAmbientOnly ? [ambientArg.name] : [],
      ambientOnly: isAmbientOnly,
      repeat: {
        state: false,
        song: null,
      },
    });
    console.log("bot connected - ready to play");

    const player = createAudioPlayer();
    connection.subscribe(player);

    if (isAmbientOnly) {
      playAmbientOnly(message.client, message.guild.id, player, [ambientArg.name], {
        shouldSendEmbed: true,
      });
    } else {
      await genMusic(message, player, connection);
    }

    let embed = new EmbedBuilder().setColor("Fuchsia").setAuthor({ name: "Loading" }).setDescription(italic("Preparing..."));
    player.on(AudioPlayerStatus.Buffering, async () => {
      let song = connection.state.subscription.player.state.resource.metadata;

      if (!song.shouldSendEmbed) return;
      embed.setAuthor({ name: "Buffering" }).setDescription("Please wait until song are played").setThumbnail(null);
      message.replyWithoutMention({ embeds: [embed] });
    });

    player.on(AudioPlayerStatus.Playing, async () => {
      let meta = connection.state.subscription.player.state.resource.metadata;

      if (!meta.shouldSendEmbed) return;

      if (meta.ambientOnly) {
        // Ambient-only embed — no duration or source button
        const ambientNames = meta.ambientNames.map((n) => `\`${n}\``).join(", ");
        embed = embed
          .setAuthor({ name: "Playing Ambient" })
          .setDescription(`Ambients: ${ambientNames}`)
          .setThumbnail(null)
          .setTimestamp();

        message.channel.send({ embeds: [embed] });
      } else {
        let songDuration = getAudioDuration(meta.path);
        let sourceButton = new ButtonBuilder().setLabel("Source").setURL(meta.source).setStyle(ButtonStyle.Link);

        let row = new ActionRowBuilder().addComponents(sourceButton);

        embed = embed
          .setAuthor({ name: `Playing ${meta.title}` })
          .setDescription(`By: ${meta.author}\nDuration: ${humanizeTime(Math.ceil(songDuration))}`)
          .setThumbnail(meta.cover)
          .setTimestamp();

        message.channel.send({ embeds: [embed], components: [row] });
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

      destroyGuildMixer(message.client, message.guild.id);

      let guildData = await message.client.db.get(`vc.${message.guild.id}`);

      if (guildData?.ambientOnly) {
        // Restart ambient playback (e.g. after unexpected stream end)
        playAmbientOnly(message.client, message.guild.id, player, guildData.ambients, {
          shouldSendEmbed: false,
        });
        return;
      }

      let repeat = await message.client.db.get(`vc.${message.guild.id}.repeat`);
      if (repeat?.state) {
        loop(message, player);
      } else {
        await genMusic(message, player, connection);
      }
    });

    // Expose skipNextIdle flag so add/remove ambient can suppress the idle restart
    player.skipNextIdle = () => { skipNextIdle = true; };
  },
};
