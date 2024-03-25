const { EmbedBuilder } = require('discord.js');
const songlist = require('../../../lofi');
const { getVoiceConnection } = require('@discordjs/voice');
const formatTime = require('../../../lib/formatTime');
const getCurrentlyPlayingTime = require('../../../lib/getCurrentPlayingTime');
const createProgressBar = require('../../../lib/createProgressBar');
const { default: getAudioDurationInSeconds } = require('get-audio-duration');

module.exports = {
  name: "nowplaying",
  description: "get current playing song detail!",
  cooldown: 1,
  category: "lofi",
  async execute(message) {
    let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
    if(!isplaying) return message.reply("does'nt play any song rn");

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

    message.reply({ embeds: [embed] });
  },
};
