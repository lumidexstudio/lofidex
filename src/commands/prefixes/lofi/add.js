const { VoiceConnectionStatus, enterState, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require("@discordjs/voice");
const ambientList = require("../../../ambient-sound");

const addAmbient = async (message, player, argsAmbient) => {
  let ambient = ambientList[argsAmbient][0];

  const res = createAudioResource(ambient.path, {
    metadata: { title: ambient.title, author: ambient.author, source: ambient.source },
  });

  player.play(res);
};

module.exports = {
  name: "add",
  description: "adding ambient sound effect",
  cooldown: 1,
  category: "lofi",
  args: ['<ambient>'],
  async execute(message, args) {
    const voiceChannelId = message.member.voice.channelId;
    if (!voiceChannelId) return message.reply("You are not in voice channel");

    const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel) return message.reply("No voice channel were found");

    if(!ambientList[args[0]]) return message.reply("ambient not found")

    const connection = getVoiceConnection(message.guild.id);

    const player = createAudioPlayer();
    connection.subscribe(player);
    addAmbient(message, player, args[0]);

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
