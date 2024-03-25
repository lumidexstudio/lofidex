const { VoiceConnectionStatus, enterState, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require("@discordjs/voice");
const ambientList = require("../../../ambient-sound");
const { mixAudio } = require("ffmpeg-audio-mixer");
const { StreamType } = require("@discordjs/voice");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { getAudioDurationInSeconds } = require("get-audio-duration");
const { ActionRowBuilder, ButtonStyle, ButtonBuilder, ComponentType, inlineCode } = require('discord.js');
const getCurrentlyPlayingTime = require("../../../lib/getCurrentPlayingTime");
const { errorEmbed, loadingEmbed, successEmbed, infoEmbed } = require("../../../lib/embed");

const addAmbient = async (message, con, argsAmbient) => {
  if (!ambientList[argsAmbient]) return message.replyWithoutMention({ embeds: [errorEmbed('Ambient not found!') ]});
  let ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);

  let ambient = ambientList[argsAmbient][0];
  let list = require("../../../lofi");

  ambients.push(ambient.name);
  await message.client.db.set(`vc.${message.guild.id}.ambients`, ambients);

  console.log("39", ambients);

  // Mendapatkan lagu yang sedang diputar
  let song = list[con.state.subscription.player.state.resource.metadata.index];

  // Tentukan titik waktu mulai mixing
  const startOffset = getCurrentlyPlayingTime(con);
  if (!startOffset) return message.replyWithoutMention({ embeds: [errorEmbed('No song were played!') ]});
  con.state.subscription.player.pause();

  let msg = await message.channel.send({ embeds: [loadingEmbed(`Trying to add ${ambient.name} to the current song...`)] });

  let songdur = await getAudioDurationInSeconds(song.path);
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
          msg.edit({ embeds: [successEmbed('Ambient added successfully!')] })
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
  args: ["<ambient?>"],
  async execute(message, args) {
    let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
    if(!isplaying) return message.replyWithoutMention({ embeds: [errorEmbed('The bot is not playing music right now.')] });
    
    let host = await message.client.db.get(`vc.${message.guild.id}.master`);
    
    let getdb = await message.client.db.get(`vc.${message.guild.id}`);
    if(getdb.master !== message.member.user.id) return message.replyWithoutMention({ embeds: [errorEmbed('Only the DJ can control using this command.')] })
    if(getdb.channel !== message.member.voice.channelId) return message.replyWithoutMention({ embeds: [errorEmbed(`We are not in the same voice channel!`)] });

    const connection = getVoiceConnection(message.guild.id);
    
    if(args[0]) {
      addAmbient(message, connection, args[0]);
    } else {
      let btns = {};
      let ambientsNow = await message.client.db.get(`vc.${message.guild.id}.ambients`);
      let row = new ActionRowBuilder();
      for (const xambient of Object.keys(ambientList)) {
        let ambient = ambientList[xambient][0]
        btns[ambient.name] = new ButtonBuilder().setCustomId(ambient.name).setLabel(ambient.name).setEmoji(ambient.emoji);
        
        if(ambientsNow.includes(ambient.name)) {
          btns[ambient.name].setStyle(ButtonStyle.Primary);
        } else {
          btns[ambient.name].setStyle(ButtonStyle.Secondary);
        }

        row.addComponents(btns[ambient.name]);
      }

      let msg = await message.channel.send({ embeds: [infoEmbed(`Add some ambients? use the buttons below...\n\nCurrent ambients: ${inlineCode(ambientsNow.length ? ambientsNow.join('`, `') : 'none')}`)], components: [row] });
      const collector = message.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });
      collector.on('collect', async(d) => {
          const set = async(x) => {
              let ambientsOld = await message.client.db.get(`vc.${message.guild.id}.ambients`);

              if(ambientsOld.includes(x.customId)) {
                // TODO: remove ambients

                return;
              }

              await addAmbient(message, connection, x.customId);

              let ambientsNow = await message.client.db.get(`vc.${message.guild.id}.ambients`);
              Object.keys(btns).map((x) => {
                if(ambientsNow.includes(x)) {
                  btns[x].setStyle(ButtonStyle.Primary);
                } else {
                  btns[x].setStyle(ButtonStyle.Secondary);
                }
              })
              
              msg.edit({ embeds: [infoEmbed(`Add some ambients? use the buttons below...\n\nCurrent ambients: ${inlineCode(ambientsNow.length ? ambientsNow.join('`, `') : 'none')}`)], components: [row] })
          }

          await d.deferUpdate();
          if(d.user.id !== host) {
            return d.followUp({
              content: `${d.user.username}, only host can use this button.`,
              ephemeral: true,
            });
          }

          set(d)
      });
    }
  },
};