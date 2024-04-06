const { createAudioResource } = require("@discordjs/voice");
const ambientList = require("../../ambient-sound");
const { StreamType } = require("@discordjs/voice");
const { getAudioDurationInSeconds } = require("get-audio-duration");
const { loadingEmbed, successEmbed, errorEmbed } = require("../embed");
const getCurrentlyPlayingTime = require("../getCurrentPlayingTime");

const removeAmbient = async (message, con, argsAmbient) => {
  let ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);

  if (!ambients.includes(argsAmbient)) {
    return message.replyWithoutMention({ embeds: [errorEmbed("Ambient not found in the active list.")] });
  }

  let list = require("../../lofi");

  ambients = ambients.filter((item) => item !== argsAmbient);
  await message.client.db.set(`vc.${message.guild.id}.ambients`, ambients);

  let song = list[con.state.subscription.player.state.resource.metadata.index];

  // Tentukan titik waktu mulai mixing
  const startOffset = getCurrentlyPlayingTime(con);
  if (!startOffset) return message.replyWithoutMention({ embeds: [errorEmbed("No song were played!")] });
  con.state.subscription.player.pause();

  let msg = await message.channel.send({ embeds: [loadingEmbed(`removing ${argsAmbient} on playback ${startOffset} seconds`)] });

  if (ambients.length <= 0) {
    message.client.ffmpeg(song.path)
      .setStartTime(startOffset)
      .outputOptions("-preset", "fast")
      .output(`temp/${message.guild.id}/${song.title}-cut.mp3`)
      .on("end", () => {
        const res = createAudioResource(`temp/${message.guild.id}/${song.title}-cut.mp3`, {
          inputType: StreamType.Raw,
          inlineVolume: true,
          metadata: { ...song, index: list.findIndex((item) => item.title == song.title) },
        });
        con.state.subscription.player.play(res);
        msg.edit({ embeds: [successEmbed("Ambient removed successfully!")] });
      })
      .run();

    return;
  }

  let songdur = await getAudioDurationInSeconds(song.path);

  await message.client.db.set(`vc.${message.guild.id}.filtergraph`, ["[0:a]volume=3[a0]"]);
  await message.client.db.set(`vc.${message.guild.id}.filtergraph_last`, 0);
  await message.client.db.set(`vc.${message.guild.id}.filtergraph_mix`, "");
  await message.client.db.set(`vc.${message.guild.id}.filtergraph_mix_count`, 1);

  for (let ambient of ambients) {
    ambient = ambientList.find((item) => item.name == ambient);
    let ambientdur = await getAudioDurationInSeconds(ambient.path);
    let loops = Math.ceil(songdur / ambientdur); // Jumlah loop

    let hasfiltergraph = await message.client.db.get(`vc.${message.guild.id}.filtergraph`);
    let lastfvar = await message.client.db.get(`vc.${message.guild.id}.filtergraph_last`);
    let fmix = await message.client.db.get(`vc.${message.guild.id}.filtergraph_mix`);
    let filtergraph = hasfiltergraph;

    let fmix2 = fmix ? fmix : "";

    filtergraph.push(`[${ambients.findIndex((item) => item == ambient.name) + 1}:a]volume=${ambient.defaultVolume}[a${lastfvar + 1}]`);
    filtergraph.push(`[${ambients.findIndex((item) => item == ambient.name) + 1}:a]aloop=loop=${loops}:size=1e6[a${lastfvar + 2}]`);
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
  message.client.ffmpeg(song.path)
    .setStartTime(startOffset)
    .outputOptions("-preset", "fast")
    .output(`temp/${message.guild.id}/${song.title}-cut.mp3`)
    .on("end", () => {
      // Setelah selesai memotong, mix audio dengan ambient sound
      let command = message.client.ffmpeg().input(`temp/${message.guild.id}/${song.title}-cut.mp3`);

      for (const ambient of ambients) {
        let ambientPath = ambientList.find((item) => item.name == ambient).path;
        command.input(ambientPath);
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
            metadata: {
              ...song,
              mix_path: path,
              index: list.findIndex((item) => item.title == song.title),
            },
          });

          con.state.subscription.player.play(res);
          message.client.db.set(`vc.${message.guild.id}.now_path`, path);
          msg.edit({ embeds: [successEmbed("Ambient removed successfully!")] });
        })
        .run();
    })
    .run();
};

module.exports = removeAmbient;
