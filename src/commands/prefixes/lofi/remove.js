const { createAudioResource, getVoiceConnection } = require("@discordjs/voice");
const ambientList = require("../../../ambient-sound");
const { StreamType } = require("@discordjs/voice");
const ffmpeg = require("fluent-ffmpeg");
const { getAudioDurationInSeconds } = require("get-audio-duration");
const { ActionRowBuilder, ButtonStyle, ButtonBuilder, ComponentType } = require("discord.js");
const { loadingEmbed } = require("../../../lib/embed");
const getCurrentlyPlayingTime = require("../../../lib/getCurrentPlayingTime");

const removeAmbient = async (message, con, argsAmbient) => {
  let ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);

  if (!ambients.includes(argsAmbient)) {
    return message.reply("Ambient not found in the active list.");
  }

  let ambient = ambientList[argsAmbient][0];
  let list = require("../../../lofi");

  ambients = ambients.filter((item) => item !== ambient.name);
  await message.client.db.set(`vc.${message.guild.id}.ambients`, ambients);

  let song = list[con.state.subscription.player.state.resource.metadata.index];

  // Tentukan titik waktu mulai mixing
  const startOffset = getCurrentlyPlayingTime(con);
  if (!startOffset) return message.reply("No song were played!");

  message.replyWithoutMention({ embeds: [loadingEmbed(`removing ${argsAmbient} on playback ${startOffset} seconds`)] });

  if (ambients <= 1) {
    con.state.subscription.player.pause();

    ffmpeg(song.path)
      .setStartTime(startOffset)
      .outputOptions("-preset", "fast")
      .output(`temp/${song.title}-cut.mp3`)
      .on("end", () => {
        const res = createAudioResource(`temp/${song.title}-cut.mp3`, {
          inputType: StreamType.Raw,
          inlineVolume: true,
          metadata: { title: song.title, author: song.author, source: song.source, path: song.path, cover: song.cover, index: list.findIndex((item) => item.title == song.title) },
        });
        con.state.subscription.player.play(res);
      })
      .run();

    return;
  }

  con.state.subscription.player.pause();

  let songdur = await getAudioDurationInSeconds(song.path);
  let ambientdur = await getAudioDurationInSeconds(ambient.path);
  let loops = Math.ceil(songdur / ambientdur); // Jumlah loop

  await message.client.db.set(`vc.${message.guild.id}.filtergraph`, ["[0:a]volume=3[a0]"]);
  await message.client.db.set(`vc.${message.guild.id}.filtergraph_last`, 0);
  await message.client.db.set(`vc.${message.guild.id}.filtergraph_mix`, "");
  await message.client.db.set(`vc.${message.guild.id}.filtergraph_mix_count`, 1);

  let hasfiltergraph = await message.client.db.get(`vc.${message.guild.id}.filtergraph`);
  let lastfvar = await message.client.db.get(`vc.${message.guild.id}.filtergraph_last`);
  let fmix = await message.client.db.get(`vc.${message.guild.id}.filtergraph_mix`);
  let filtergraph = hasfiltergraph;

  let fmix2 = fmix ? fmix : "";

  filtergraph.push(`[${ambients.length}:a]volume=${ambient.defaultVolume}[a${lastfvar + 1}]`);
  filtergraph.push(`[${ambients.length}:a]aloop=loop=${loops}:size=1e6[a${lastfvar + 2}]`);
  filtergraph.push(`[a${lastfvar + 2}]apad=whole_dur=10000,atrim=0:duration=${songdur}[a${lastfvar + 3}]`);

  await message.client.db.set(`vc.${message.guild.id}.filtergraph_last`, lastfvar + 3);
  await message.client.db.set(`vc.${message.guild.id}.filtergraph`, filtergraph);

  fmix2 += `[a${lastfvar + 1}][a${lastfvar + 3}]`;
  await message.client.db.set(`vc.${message.guild.id}.filtergraph_mix`, fmix2);
  await message.client.db.add(`vc.${message.guild.id}.filtergraph_mix_count`, 2);

  let path = `temp/tersimpan-${message.guild.id}.mp3`;

  let fg = await message.client.db.get(`vc.${message.guild.id}.filtergraph`);
  let fgm = await message.client.db.get(`vc.${message.guild.id}.filtergraph_mix`);
  let fgmc = await message.client.db.get(`vc.${message.guild.id}.filtergraph_mix_count`);

  fg.push(`[a0]${fgm}amix=inputs=${fgmc}:duration=longest`);

  console.log("137", fg);
  ffmpeg(song.path)
    .setStartTime(startOffset)
    .outputOptions("-preset", "fast")
    .output(`temp/${song.title}-cut.mp3`)
    .on("end", () => {
      // Setelah selesai memotong, mix audio dengan ambient sound
      let command = ffmpeg().input(`temp/${song.title}-cut.mp3`);

      for (const ambient of ambients) {
        command.input(ambientList[ambient][0].path);
      }

      command
        .complexFilter(fg)
        .outputOptions("-preset", "fast")
        .output(path)
        .on("end", () => {
          // Setelah mixing selesai, putar hasil mixing
          const res = createAudioResource(path, {
            inputType: StreamType.Raw,
            inlineVolume: true,
            metadata: { title: song.title, author: song.author, source: song.source, path: song.path, cover: song.cover, index: list.findIndex((item) => item.title == song.title) },
          });

          con.state.subscription.player.play(res);
          message.client.db.set(`vc.${message.guild.id}.now_path`, path);
        })
        .run();
    })
    .run();
};

module.exports = {
  name: "remove",
  description: "remove ambients from a song",

  async execute(message, args) {
    let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
    if (!isplaying) return message.reply("does'nt play any song rn");

    let host = await message.client.db.get(`vc.${message.guild.id}.master`);

    const voiceChannelId = message.member.voice.channelId;
    if (!voiceChannelId) return message.reply("You are not in voice channel");

    const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel) return message.reply("No voice channel were found");

    const connection = getVoiceConnection(message.guild.id);

    await removeAmbient(message, connection, args[0]);
  },
};
