const { createAudioResource } = require("@discordjs/voice");
const ambientList = require("../../ambient-sound");
const list = require("../../lofi");
const { StreamType } = require("@discordjs/voice");
const { getAudioDurationInSeconds } = require("get-audio-duration");
const getCurrentlyPlayingTime = require("../getCurrentPlayingTime");
const { errorEmbed, loadingEmbed, successEmbed } = require("../embed");

const addAmbient = async (message, con, argsAmbient) => {
  if (!ambientList.find((item) => item.name == argsAmbient)) return message.replyWithoutMention({ embeds: [errorEmbed("Ambient not found!")] });

  let getdb = await message.client.db.get(`vc.${message.guild.id}`);
  if (getdb.ambients.includes(argsAmbient)) return message.replyWithoutMention({ embeds: [errorEmbed(`${argsAmbient} ambient already in use!`)] });

  let ambient = ambientList.find((item) => item.name == argsAmbient);

  getdb.ambients.push(ambient.name);
  await message.client.db.set(`vc.${message.guild.id}.ambients`, getdb.ambients);

  console.log("39", getdb.ambients);

  // Mendapatkan lagu yang sedang diputar
  let song = list[con.state.subscription.player.state.resource.metadata.index];

  // Tentukan titik waktu mulai mixing
  const startOffset = getCurrentlyPlayingTime(con);
  if (!startOffset) return message.replyWithoutMention({ embeds: [errorEmbed("No song were played!")] });
  con.state.subscription.player.pause();

  let msg = await message.channel.send({ embeds: [loadingEmbed(`Trying to add ${ambient.name} to the current song...`)] });

  let songdur = await getAudioDurationInSeconds(song.path);
  let ambientdur = await getAudioDurationInSeconds(ambient.path);
  let loops = Math.ceil(songdur / ambientdur); // Jumlah loop

  let fmix2 = getdb.filtergraph_mix || "";

  getdb.filtergraph.push(`[${getdb.ambients.length}:a]volume=${ambient.defaultVolume}[a${getdb.filtergraph_last + 1}]`);
  getdb.filtergraph.push(`[${getdb.ambients.length}:a]aloop=loop=${loops}:size=1e6[a${getdb.filtergraph_last + 2}]`);
  getdb.filtergraph.push(`[a${getdb.filtergraph_last + 2}]apad=whole_dur=10000,atrim=0:duration=${songdur}[a${getdb.filtergraph_last + 3}]`);

  await message.client.db.set(`vc.${message.guild.id}.filtergraph_last`, getdb.filtergraph_last + 3);
  await message.client.db.set(`vc.${message.guild.id}.filtergraph`, getdb.filtergraph);

  fmix2 += `[a${getdb.filtergraph_last + 1}][a${getdb.filtergraph_last + 3}]`;
  await message.client.db.set(`vc.${message.guild.id}.filtergraph_mix`, fmix2);
  await message.client.db.add(`vc.${message.guild.id}.filtergraph_mix_count`, 2);

  let path = `temp/${message.guild.id}/${Date.now()}.mp3`;

  let fg = await message.client.db.get(`vc.${message.guild.id}.filtergraph`);
  let fgm = await message.client.db.get(`vc.${message.guild.id}.filtergraph_mix`);
  let fgmc = await message.client.db.get(`vc.${message.guild.id}.filtergraph_mix_count`);

  fg.push(`[a0]${fgm}amix=inputs=${fgmc}:duration=longest`);

  message.client.ffmpeg(song.path)
    .setStartTime(startOffset)
    .outputOptions("-preset", "fast")
    .output(`temp/${message.guild.id}/${song.title}-cut.mp3`)
    .on("end", () => {
      // Setelah selesai memotong, mix audio dengan ambient sound
      let command = message.client.ffmpeg().input(`temp/${message.guild.id}/${song.title}-cut.mp3`);

      for (const ambient of getdb.ambients) {
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
          msg.edit({ embeds: [successEmbed("Ambient added successfully!")] });
        })
        .run();
    })
    .run();
};

module.exports = addAmbient;
