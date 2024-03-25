const { joinVoiceChannel, VoiceConnectionStatus, entersState, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { ActionRowBuilder } = require("discord.js");
const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getAudioDurationInSeconds } = require("get-audio-duration");
const humanizeTime = require("../../../lib/humanizeTime");
const { getVoiceConnection } = require("@discordjs/voice");
const skipMusic = require("../../../lib/music/skip");
const { errorEmbed } = require("../../../lib/embed");

module.exports = {
  name: "skip",
  description: "skip current song",
  cooldown: 1,
  category: "lofi",
  async execute(message) {
    let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
    if(!isplaying) return message.replyWithoutMention({ embeds: [errorEmbed('The bot is not playing music right now.')] });

    let getdb = await message.client.db.get(`vc.${message.guild.id}`);
    if (getdb.master !== message.member.user.id) return message.replyWithoutMention({ embeds: [errorEmbed('Only the DJ can control using this command.')] });
    if (getdb.channel !== message.member.voice.channelId) return message.replyWithoutMention({ embeds: [errorEmbed(`We are not in the same voice channel!`)] });

    const connection = getVoiceConnection(message.guild.id);
    await skipMusic(message, connection.state.subscription.player);
  },
};
