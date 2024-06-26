const { EmbedBuilder, bold, hyperlink } = require('discord.js');
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
const { errorEmbed, successEmbed } = require('../../../lib/embed');
const stop = require('../../../lib/music/stop');
const stopAllCollectors = require('../../../lib/stopAllCollectors');

module.exports = {
  name: "nowplaying",
  description: "Get details of the currently playing song.",
  aliases: ['np'],
  cooldown: 1,
  category: "lofi",
  async execute(message) {
    let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
    if(!isplaying) return message.replyWithoutMention({ embeds: [errorEmbed('The bot is not playing music right now.')] });
    
    let getdb = await message.client.db.get(`vc.${message.guild.id}`);
    if (getdb.channel !== message.member.voice.channelId) return message.replyWithoutMention({ embeds: [errorEmbed(`We are not in the same voice channel!`)] });

    let detail = songlist[getdb.now];

    let connection = await getVoiceConnection(message.guild.id);
    if(!connection) return message.replyWithoutMention({ embeds: [errorEmbed('The bot is not playing music right now.')] });

    let dur = await getAudioDurationInSeconds(detail.path);
    let nowin = getCurrentlyPlayingTime(connection);

    let embed = new EmbedBuilder()
        .setColor('Fuchsia')
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

    let row = new ActionRowBuilder().addComponents(btns.pause, btns.skip, btns.stop);
    let msg = await message.channel.send({ embeds: [embed], components: [row] });

    await stopAllCollectors(message);
    let collector = message.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });
    message.client.nowplaying.set(message.guild.id, collector)
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
          let coll = message.client.nowplaying.get(message.guild.id);
          coll.stop('disconnect');
        } else if(x.customId === 'skip') {
          await skipMusic(message, connection.state.subscription.player, false);
          let now = await message.client.db.get(`vc.${message.guild.id}.now`);
          let detail = songlist[now];

          let dur = await getAudioDurationInSeconds(detail.path);
          let nowin = getCurrentlyPlayingTime(connection);

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
      if(d.user.id !== getdb.master) {
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
          await stop(connection, message)

          message.replyWithoutMention({ embeds: [successEmbed(`Disconnected\n\nThank you for using this bot. We are aware that many issues still exist. Come join our ${hyperlink(bold('Support Server'), message.client.config.supportServer)} to get information, updates and more.`)] });
        } catch {
          console.log("err stop button now playing")
        }

        return;
      }

      return;
    })
  },
};
