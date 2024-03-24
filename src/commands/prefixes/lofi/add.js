const { VoiceConnectionStatus, enterState, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require("@discordjs/voice");
const ambientList = require("../../../ambient-sound");
const { mixAudio } = require('ffmpeg-audio-mixer');
const { StreamType } = require("@discordjs/voice");
const fs = require('fs')

async function simpanStreamKeFile(stream, path) {
  return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(path);
      stream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
  });
}

const addAmbient = async (message, con, argsAmbient) => {
  let ambient = ambientList[argsAmbient][0];
  let list = require("../../../lofi");

  // belum di cek posisi mana lagu berjalan
  let checkNow = await message.client.db.has(`vc.${message.guild.id}.now`);
  let song = list[0]

  let d = await mixAudio([
    song.path,
    ambient.path
  ]).toStream('mp3')
  const outputPath = './tersimpan.mp3'; 
  await simpanStreamKeFile(d, outputPath);

  const res = createAudioResource(outputPath, { inputType: StreamType.Raw });
  con.state.subscription.player.play(res);
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
    addAmbient(message, connection, args[0])
    // const player = new PlaySong().player
    // player.pause();

    // const player = createAudioPlayer();
    // connection.subscribe(player);
    // addAmbient(message, player, args[0]);

    // player.on(AudioPlayerStatus.Buffering, () => {
    //   message.reply("buffering...");
    // });

    // player.on(AudioPlayerStatus.Playing, () => {
    //   message.reply("adding ambient");
    // });

    // player.on("error", (error) => {
    //   console.log(error);
    // });
  },
};
