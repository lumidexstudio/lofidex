const { VoiceConnectionStatus, enterState, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require("@discordjs/voice");
const ambientList = require("../../../ambient-sound");
const { mixAudio } = require("ffmpeg-audio-mixer");
const { StreamType } = require("@discordjs/voice");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { getAudioDurationInSeconds } = require('get-audio-duration')

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
  let ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);

  let ambient = ambientList[argsAmbient][0];
  let list = require("../../../lofi");

  ambients.push(ambient.name);
  await message.client.db.set(`vc.${message.guild.id}.ambients`, ambients)

  console.log("39", ambients)

  // Mendapatkan lagu yang sedang diputar
  let song = list[con.state.subscription.player.state.resource.metadata.index];

  // Tentukan titik waktu mulai mixing
  const startOffset = getCurrentlyPlayingTime(con);
  if (!startOffset) return message.reply("No song were played!");
  con.state.subscription.player.pause();

  message.reply(`adding ${argsAmbient} on playback ${startOffset} seconds`);

  let songdur = await getAudioDurationInSeconds(song.path)
  let ambientdur = await getAudioDurationInSeconds(ambient.path)
  let loops = Math.ceil(songdur / ambientdur); // Jumlah loop

  let hasfiltergraph = await message.client.db.get(`vc.${message.guild.id}.filtergraph`);
  let lastfvar = await message.client.db.get(`vc.${message.guild.id}.filtergraph_last`);
  let fmix = await message.client.db.get(`vc.${message.guild.id}.filtergraph_mix`);
  let filtergraph = hasfiltergraph

  let fmix2 = fmix ? fmix : '';

  filtergraph.push(`[${ambients.length}:a]volume=1[a${lastfvar + 1}]`);
  filtergraph.push(`[${ambients.length}:a]aloop=loop=${loops}:size=1e6[a${lastfvar + 2}]`);
  filtergraph.push(`[a${lastfvar + 2}]apad=whole_dur=10000,atrim=0:duration=${songdur}[a${lastfvar + 3}]`);

  await message.client.db.set(`vc.${message.guild.id}.filtergraph_last`, lastfvar + 3);
  await message.client.db.set(`vc.${message.guild.id}.filtergraph`, filtergraph)

  fmix2 +=`[a${lastfvar+1}][a${lastfvar+3}]`
  await message.client.db.set(`vc.${message.guild.id}.filtergraph_mix`, fmix2)
  await message.client.db.add(`vc.${message.guild.id}.filtergraph_mix_count`, 2)
  
  let path = `temp/tersimpan-${message.guild.id}.mp3`;

  let fg = await message.client.db.get(`vc.${message.guild.id}.filtergraph`);
  let fgm = await message.client.db.get(`vc.${message.guild.id}.filtergraph_mix`);
  let fgmc = await message.client.db.get(`vc.${message.guild.id}.filtergraph_mix_count`);

  fg.push(`[a0]${fgm}amix=inputs=${fgmc}:duration=longest`)

  console.log("137", fg)
  ffmpeg(song.path)
    .setStartTime(startOffset)
    .outputOptions("-preset", "fast")
    .output(`temp/${song.title}-cut.mp3`)
    .on("end", () => {
      // Setelah selesai memotong, mix audio dengan ambient sound
      let command = ffmpeg().input(`temp/${song.title}-cut.mp3`)

      for (const ambient of ambients) {
        command.input(ambientList[ambient][0].path);
      }
      
      command.complexFilter(fg)
        .outputOptions("-preset", "fast")
        .output(path)
        .on("end", () => {
          // Setelah mixing selesai, putar hasil mixing
          const res = createAudioResource(path, {
            inputType: StreamType.Raw,
            inlineVolume: true,
            metadata: { title: song.title, author: song.author, source: song.source, index: list.findIndex((item) => item.title == song.title) },
          });

          con.state.subscription.player.play(res);
          message.client.db.set(`vc.${message.guild.id}.now_path`, path)
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
