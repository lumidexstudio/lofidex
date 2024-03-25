const { EmbedBuilder } = require('discord.js');
const songlist = require('../../../lofi');
const { getVoiceConnection } = require('@discordjs/voice');
const formatTime = require('../../../lib/formatTime');
const getCurrentlyPlayingTime = require('../../../lib/getCurrentPlayingTime');
const createProgressBar = require('../../../lib/createProgressBar');
const { default: getAudioDurationInSeconds } = require('get-audio-duration');
const { ButtonBuilder, ButtonStyle } = require('discord.js');
const { ActionRowBuilder, ComponentType } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const skipMusic = require('../../../lib/music/skip');

module.exports = {
  name: "nowplaying",
  description: "get current playing song detail!",
  cooldown: 1,
  category: "lofi",
  async execute(message) {
    let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
    if(!isplaying) return message.reply("does'nt play any song rn");

    let host = await message.client.db.get(`vc.${message.guild.id}.master`);
    let now = await message.client.db.get(`vc.${message.guild.id}.now`);
    let detail = songlist[now];

    let connection = await getVoiceConnection(message.guild.id);
    let dur = await getAudioDurationInSeconds(detail.path);
    let nowin = getCurrentlyPlayingTime(connection);

    let embed = new EmbedBuilder()
        .setColor('Random')
        .setTitle(detail.title + " by " + detail.author)
        .setURL(detail.source)
        .setThumbnail(detail.cover)
        .setDescription(`${formatTime(nowin)} ${createProgressBar(nowin, dur)} ${formatTime(dur)}`)
        .setTimestamp()
        .setFooter({ text: `Song ID: ${detail.id}` });

    let btns = {
      pause: new ButtonBuilder().setCustomId('pause').setLabel('Pause').setEmoji("⏸").setStyle(ButtonStyle.Secondary),
      stop: new ButtonBuilder().setCustomId('stop').setLabel('Stop').setEmoji("⏹").setStyle(ButtonStyle.Danger),
      skip: new ButtonBuilder().setCustomId('skip').setLabel('Skip').setEmoji("⏭").setStyle(ButtonStyle.Primary),
    }

    // buggy btns.pause
    let row = new ActionRowBuilder().addComponents(btns.pause, btns.skip, btns.stop);
    let msg = await message.channel.send({ embeds: [embed], components: [row] });

    const collector = message.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });
    collector.on("collect", async (d) => {
      const set = async (x) => {
        if(x.customId === 'pause') {
          let player = connection.state.subscription.player;
          player.state.resource.metadata.shouldSendEmbed = false;
          if(player.state.status === AudioPlayerStatus.Paused) {
              player.unpause();
              btns.pause.setStyle(ButtonStyle.Secondary).setLabel('Pause').setEmoji("⏸");
          } else {
              player.pause();
              btns.pause.setStyle(ButtonStyle.Primary).setLabel('Resume').setEmoji("▶");
          }
        } else if(x.customId === 'stop') {
          collector.stop('disconnect');
        } else if(x.customId === 'skip') {
          await skipMusic(message, connection.state.subscription.player, false);
          let now = await message.client.db.get(`vc.${message.guild.id}.now`);
          let detail = songlist[now];
          embed.setTitle(detail.title + " by " + detail.author)
            .setURL(detail.source)
            .setThumbnail(detail.cover)
            .setDescription(`${formatTime(nowin)} ${createProgressBar(nowin, dur)} ${formatTime(dur)}`)
            .setTimestamp()
            .setFooter({ text: `Song ID: ${detail.id}` });
        }

        msg.edit({ embeds: [embed], components: [row] })
      };

      await d.deferUpdate();
      if(d.user.id !== host) {
        return d.followUp({
          content: `${d.user.username}, only host can use this button.`,
          ephemeral: true,
        });
      }

      set(d);
    });

    collector.on('end', async(d, r) => {
      if(r === 'disconnect') {
        try {
          connection.disconnect();
          await message.client.db.delete(`vc.${message.guild.id}`);

          let embed = new EmbedBuilder().setTitle("Disconnected").setColor("Random");
          message.replyWithoutMention({ embeds: [embed] });
        } catch {
          console.log("err stop button now playing")
        }

        return;
      }

      return;
    })
  },
};
