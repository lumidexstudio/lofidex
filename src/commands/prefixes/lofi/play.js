const { joinVoiceChannel, VoiceConnectionStatus, entersState, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { ActionRowBuilder } = require("discord.js");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, italic } = require("discord.js");
const { getAudioDurationInSeconds } = require("get-audio-duration");
const humanizeTime = require("../../../lib/humanizeTime");
const { errorEmbed, infoEmbed } = require("../../../lib/embed");
const fs = require("fs");

async function genMusic(message, player) {
  let list = require("../../../lofi");
  let checkNow = await message.client.db.has(`vc.${message.guild.id}.now`);

  if (!checkNow) {
    const idx = Math.floor(Math.random() * list.length);
    const song = list[idx];
    const res = createAudioResource(song.path, {
      metadata: {
        ...song,
        shouldSendEmbed: true,
        index: list.findIndex((item) => item.title == song.title),
      },
      inlineVolume: true,
    });

    player.play(res);
    await message.client.db.set(`vc.${message.guild.id}.now`, idx);
  } else {
    let now = await message.client.db.get(`vc.${message.guild.id}.now`);
    let song = list[now + 1];

    if (!song) {
      song = list[0];
      await message.client.db.set(`vc.${message.guild.id}.now`, 0);
    } else {
      await message.client.db.set(`vc.${message.guild.id}.now`, now + 1);
    }

    const res = createAudioResource(song.path, {
      metadata: {
        ...song,
        shouldSendEmbed: true,
        index: list.findIndex((item) => item.title == song.title),
      },
      inlineVolume: true,
    });

    player.play(res);
  }
}

module.exports = {
  name: "play",
  description: "start playing a song.",
  aliases: ['p'],
  cooldown: 3,
  category: "lofi",
  async execute(message) {
    const voiceChannelId = message.member.voice.channelId;
    if (!voiceChannelId) return message.replyWithoutMention({ embeds: [errorEmbed("You must be on the voice channel first!")] });

    const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel) return message.replyWithoutMention({ embeds: [errorEmbed(`Voice channel not found`)] });

    if (message.client.voice.adapters.has(message.guild.id)) return message.replyWithoutMention({ embeds: [infoEmbed("Lofidex is already on the voice channel and is probably playing lofi.")] });

    if (!fs.existsSync(`temp/${message.guild.id}`)) {
      fs.mkdirSync(`temp/${message.guild.id}`);
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Ready, async () => {
      message.client.db.set(`vc.${message.guild.id}`, { channel: voiceChannel.id, master: message.member.user.id, ambients: [], filtergraph: ["[0:a]volume=3[a0]"], filtergraph_last: 0, filtergraph_mix: "", filtergraph_mix_count: 1 });
      console.log("bot connected - ready to play");

      const player = createAudioPlayer();
      connection.subscribe(player);
      genMusic(message, player, connection);

      let embed = new EmbedBuilder().setColor("Random").setAuthor({ name: "Loading" }).setDescription(italic("Preparing..."));
      player.on(AudioPlayerStatus.Buffering, async () => {
        let song = connection.state.subscription.player.state.resource.metadata;

        if (!song.shouldSendEmbed) return;
        embed.setAuthor({ name: "Buffering" }).setDescription("Please wait until song are played").setThumbnail(null);
        message.replyWithoutMention({ embeds: [embed] });
      });

      player.on(AudioPlayerStatus.Playing, async () => {
        let song = connection.state.subscription.player.state.resource.metadata;

        if (!song.shouldSendEmbed) return;
        let songDuration = await getAudioDurationInSeconds(song.path);
        let sourceButton = new ButtonBuilder().setLabel("Source").setURL(song.source).setStyle(ButtonStyle.Link);

        let row = new ActionRowBuilder().addComponents(sourceButton);

        embed = embed
          .setAuthor({ name: `Playing ${song.title}` })
          .setDescription(`By: ${song.author}\nDuration: ${humanizeTime(Math.ceil(songDuration))}`)
          .setThumbnail(song.cover)
          .setTimestamp();

        message.channel.send({ embeds: [embed], components: [row] });
      });

      player.on("error", (error) => {
        console.error(error);
      });

      player.on(AudioPlayerStatus.Idle, () => {
        genMusic(message, player, connection);
      });
    });

    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      try {
        await Promise.race([entersState(connection, VoiceConnectionStatus.Signalling, 5_000), entersState(connection, VoiceConnectionStatus.Connecting, 5_000)]);

        console.log("bot pindah vc?");
      } catch (error) {
        connection.destroy();
        console.log("bot disconnected");
      }
    });
  },
};
