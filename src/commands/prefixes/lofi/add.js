const { VoiceConnectionStatus, enterState, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require("@discordjs/voice");
const ambientList = require("../../../ambient-sound");
const { mixAudio } = require("ffmpeg-audio-mixer");
const { StreamType } = require("@discordjs/voice");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { getAudioDurationInSeconds } = require('get-audio-duration')

// async function simpanStreamKeFile(stream, path) {
//   return new Promise((resolve, reject) => {
//     const writeStream = fs.createWriteStream(path);
//     stream.pipe(writeStream);
//     writeStream.on("finish", resolve);
//     writeStream.on("error", reject);
//   });
// }

const getCurrentlyPlayingTime = (connection) => {
  const audioPlayer = connection.state.subscription.player;
  if (audioPlayer.state.status === AudioPlayerStatus.Playing) {
    const currentTime = audioPlayer.state.playbackDuration;
    // Konversi waktu dari milidetik ke detik
    const currentTimeInSeconds = Math.floor(currentTime / 1000);
    return currentTimeInSeconds;
  } else {
    return null;
  }
};

const addAmbient = async (message, con, argsAmbient) => {
  let ambient = ambientList[argsAmbient][0];
  let list = require("../../../lofi");

  // Mendapatkan lagu yang sedang diputar
  let checkNow = await message.client.db.has(`vc.${message.guild.id}.now`);
  let song = list[con.state.subscription.player.state.resource.metadata.index];

  // Tentukan titik waktu mulai mixing
  const startOffset = getCurrentlyPlayingTime(con);
  if (!startOffset) return message.reply("No song were played!");
  con.state.subscription.player.pause();

  message.reply(`adding ${argsAmbient} on playback ${startOffset} seconds`);

  let songdur = await getAudioDurationInSeconds(song.path)
  let ambientdur = await getAudioDurationInSeconds(ambient.path)
  let loops = Math.ceil(songdur / ambientdur); // Jumlah loop

  let filtergraph = [
    "[0:a]volume=1[a0]", // Atur volume lagu
    "[1:a]volume=0.5[a1]", // Atur volume ambient
    "[1:a]aloop=loop="+loops+":size=1e6[a2]", // Loop ambient
    "[a2]apad=whole_dur=10000,atrim=0:duration="+songdur+"[a3]", // biar smooth loopingannya
    "[a0][a1][a3]amix=inputs=3:duration=longest" // Mix ambient + lagu utama
  ];

  // Lakukan pemotongan audio lagu dari titik waktu yang ditentukan
  ffmpeg(song.path)
    .setStartTime(startOffset)
    .outputOptions("-preset", "fast")
    .output(`temp/${song.title}-cut.mp3`)
    .on("end", () => {
      // Setelah selesai memotong, mix audio dengan ambient sound
      ffmpeg()
        .input(`temp/${song.title}-cut.mp3`)
        .input(ambient.path)
        .complexFilter(filtergraph)
        .outputOptions("-preset", "fast")
        .output(`temp/tersimpan-${message.guild.id}.mp3`)
        .on("end", () => {
          // Setelah mixing selesai, putar hasil mixing
          const res = createAudioResource(`temp/tersimpan-${message.guild.id}.mp3`, {
            inputType: StreamType.Raw,
            inlineVolume: true,
            metadata: { title: song.title, author: song.author, source: song.source, index: list.findIndex((item) => item.title == song.title) },
          });
          con.state.subscription.player.play(res);
        })
        .run();
    })
    .run();
};

module.exports = {
  name: "add",
  description: "adding ambient sound effect",
  cooldown: 1,
  category: "lofi",
  args: ["<ambient>"],
  async execute(message, args) {
    const voiceChannelId = message.member.voice.channelId;
    if (!voiceChannelId) return message.reply("You are not in voice channel");

    const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel) return message.reply("No voice channel were found");

    if (!ambientList[args[0]]) return message.reply("ambient not found");

    const connection = getVoiceConnection(message.guild.id);
    addAmbient(message, connection, args[0]);
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
