const { joinVoiceChannel, VoiceConnectionStatus, entersState, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");

async function genMusic(message, player) {
  let list = require("../../../lofi");
  let checkNow = await message.client.db.has(`vc.${message.guild.id}.now`);

  if (!checkNow) {
    const song = list[Math.floor(Math.random() * list.length)];
    const res = createAudioResource(song.path, {
      metadata: { title: song.title, author: song.author, source: song.source },
      inlineVolume: true
    });

    player.play(res);
    await message.client.db.set(`vc.${message.guild.id}.now`, 0);
    message.reply(`now playing: ${res.metadata.title} by ${res.metadata.author}`);
  } else {
    let now = await message.client.db.get(`vc.${message.guild.id}.now`);
    let song = list[now + 1];

    if (!song) song = list[0];
    const res = createAudioResource(song.path, {
      metadata: { title: song.title, author: song.author, source: song.source },
      inlineVolume: true
    });

    player.play(res);
    await message.client.db.set(`vc.${message.guild.id}.now`, now + 1);
    message.reply(`now playing: ${res.metadata.title} by ${res.metadata.author}`);
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
      message.client.db.set(`vc.${message.guild.id}`, { channel: voiceChannel.id, master: message.member.user.id });
      console.log("bot connected - ready to play");

      const player = createAudioPlayer();
      connection.subscribe(player);
      genMusic(message, player, connection);

      player.on(AudioPlayerStatus.Buffering, () => {
        message.reply("buffering");
      });

      player.on(AudioPlayerStatus.Playing, () => {
        message.reply("playing...");
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
