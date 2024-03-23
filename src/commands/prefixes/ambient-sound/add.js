const { VoiceConnectionStatus, enterState, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require("@discordjs/voice");

const addAmbient = async (message, player) => {
  let ambientList = require("../../../ambient-sound");
  let checkNow = await message.client.db.has(`vc.${message.guild.id}.now`);

  if (!checkNow) {
    const ambient = ambientList.rains[0];
    console.log(ambient);
    const res = createAudioResource(ambient.path, {
      metadata: { title: ambient.title, author: ambient.author, source: ambient.source },
    });

    player.play(res);
    await message.client.db.set(`vc.${message.guild.id}.now`, 0);
  } else {
    let now = await message.client.db.get(`vc.${message.guild.id}.now`);
    let ambient = ambientList.rains[now + 1];
    const res = createAudioResource(ambient.path, {
      metadata: { title: ambient.title, author: ambient.author, source: ambient.source },
    });

    player.play(res);
    await message.client.db.set(`vc.${message.guild.id}.now`, now + 1);
  }
};

module.exports = {
  name: "add-ambient",
  description: "adding ambient sound effect",
  cooldown: 1,
  category: "ambient sound",

  async execute(message) {
    const voiceChannelId = message.member.voice.channelId;
    if (!voiceChannelId) return message.reply("You are not in voice channel");

    const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel) return message.reply("No voice channel were found");

    const connection = getVoiceConnection(message.guild.id);

    const player = createAudioPlayer();
    player.state;
    connection.subscribe(player);
    addAmbient(message, player, connection);

    player.on(AudioPlayerStatus.Buffering, () => {
      message.reply("buffering...");
    });

    player.on(AudioPlayerStatus.Playing, () => {
      message.reply("adding ambient");
    });

    player.on("error", (error) => {
      console.log(error);
    });
  },
};
