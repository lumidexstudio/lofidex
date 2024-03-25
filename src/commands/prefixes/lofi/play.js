const { joinVoiceChannel, VoiceConnectionStatus, entersState, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { ActionRowBuilder } = require("discord.js");
const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getAudioDurationInSeconds } = require("get-audio-duration");

async function genMusic(message, player) {
  let list = require("../../../lofi");
  let checkNow = await message.client.db.has(`vc.${message.guild.id}.now`);

  if (!checkNow) {
    const song = list[Math.floor(Math.random() * list.length)];
    const res = createAudioResource(song.path, {
      metadata: { title: song.title, author: song.author, source: song.source, cover: song.cover, path: song.path, index: list.findIndex((item) => item.title == song.title) },
      inlineVolume: true,
    });

    player.play(res);
    await message.client.db.set(`vc.${message.guild.id}.now`, 0);
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
      metadata: { title: song.title, author: song.author, source: song.source, cover: song.cover, path: song.path, index: list.findIndex((item) => item.title == song.title) },
      inlineVolume: true,
    });

    player.play(res);
  }
}

module.exports = {
  name: "play",
  description: "start playing!",
  cooldown: 1,
  category: "lofi",
  async execute(message) {
    const voiceChannelId = message.member.voice.channelId;
    if (!voiceChannelId) return message.reply("You are not in the voice channel rn");

    const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel) return message.reply("Voice channel not found!");

    if (message.client.voice.adapters.has(message.guild.id)) return message.reply(`I already joined`);

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
      message.client.db.set(`vc.${message.guild.id}`, { channel: voiceChannel.id, master: message.member.user.id, ambients: [], filtergraph: ["[0:a]volume=3[a0]"], filtergraph_last: 0, filtergraph_mix: "", filtergraph_mix_count: 1 });
      console.log("bot connected - ready to play");

      const player = createAudioPlayer();
      connection.subscribe(player);
      genMusic(message, player, connection);

      let embed = new EmbedBuilder().setColor("Random");
      player.on(AudioPlayerStatus.Buffering, () => {
        embed = embed.setTitle("Buffering").setDescription("Please wait until song are played");
        message.replyWithoutMention({ embeds: [embed] });
      });

      player.on(AudioPlayerStatus.Playing, async () => {
        let song = connection.state.subscription.player.state.resource.metadata;
        let songDuration = await getAudioDurationInSeconds(song.path);
        let sourceButton = new ButtonBuilder().setLabel("Source").setURL(song.source).setStyle(ButtonStyle.Link);

        let row = new ActionRowBuilder().addComponents(sourceButton);

        embed = embed
          .setTitle(`Playing ${song.title}`)
          .setDescription(`By: ${song.author}\nDuration: ${Math.ceil(songDuration)} Seconds`)
          .setThumbnail(song.cover)
          .setTimestamp();

        message.replyWithoutMention({ embeds: [embed], components: [row] });
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
