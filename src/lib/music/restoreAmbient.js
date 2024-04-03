const { createAudioResource } = require("@discordjs/voice");
const ambientList = require("../../ambient-sound");
const { StreamType } = require("@discordjs/voice");
const ffmpeg = require("fluent-ffmpeg");
const { getAudioDurationInSeconds } = require("get-audio-duration");
const { errorEmbed, loadingEmbed, successEmbed } = require("../embed");

const restoreAmbient = async (message, songIndex) => {
  let ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);
  if (!ambients) return;

  let list = require("../../lofi");

  console.log("39", ambients);

  // Mendapatkan lagu yang sedang diputar
  let song = list[songIndex];

  let songdur = await getAudioDurationInSeconds(song.path);

  await message.client.db.set(`vc.${message.guild.id}.filtergraph`, ["[0:a]volume=3[a0]"]);
  await message.client.db.set(`vc.${message.guild.id}.filtergraph_last`, 0);
  await message.client.db.set(`vc.${message.guild.id}.filtergraph_mix`, "");
  await message.client.db.set(`vc.${message.guild.id}.filtergraph_mix_count`, 1);

  for (let ambient of ambients) {
    ambient = ambientList[ambient][0];
    let ambientdur = await getAudioDurationInSeconds(ambient.path);
    let loops = Math.ceil(songdur / ambientdur); // Jumlah loop

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
  }

  let path = `temp/${message.guild.id}/${Date.now()}.mp3`;

  let fg = await message.client.db.get(`vc.${message.guild.id}.filtergraph`);
  let fgm = await message.client.db.get(`vc.${message.guild.id}.filtergraph_mix`);
  let fgmc = await message.client.db.get(`vc.${message.guild.id}.filtergraph_mix_count`);

  fg.push(`[a0]${fgm}amix=inputs=${fgmc}:duration=longest`);

  console.log("137", fg);
  let command = ffmpeg().input(song.path);

  return new Promise((resolve, reject) => {
    let res;

    for (const ambient of ambients) {
      command.input(ambientList[ambient][0].path);
    }

    command
      .complexFilter(fg)
      .outputOptions("-preset", "fast")
      .output(path)
      .on("end", () => {
        res = createAudioResource(path, {
          inputType: StreamType.Raw,
          inlineVolume: true,
          metadata: {
            ...song,
            index: list.findIndex((item) => item.title == song.title),
          },
        });

        message.client.db.set(`vc.${message.guild.id}.now_path`, path);
        resolve(res); // Resolve Promise with the created audio resource
      })
      .run();
  });
};

module.exports = restoreAmbient;
