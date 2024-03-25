const { joinVoiceChannel, VoiceConnectionStatus, entersState, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { ActionRowBuilder } = require("discord.js");
const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getAudioDurationInSeconds } = require("get-audio-duration");
const humanizeTime = require("../../../lib/humanizeTime");
const { getVoiceConnection } = require("@discordjs/voice");
const skipMusic = require("../../../lib/music/skip");

module.exports = {
  name: "skip",
  description: "skip current song",
  cooldown: 1,
  category: "lofi",
  async execute(message) {
    if (!message.client.voice.adapters.has(message.guild.id)) return message.reply(`bot not in vc`);

    let getdb = await message.client.db.get(`vc.${message.guild.id}`);
    if (getdb.master !== message.member.user.id) return message.reply(`you are not the user that using the play command previously`);
    if (getdb.channel !== message.member.voice.channelId) return message.reply(`we are not in the same vc`);

    const connection = getVoiceConnection(message.guild.id);
    await skipMusic(message, connection.state.subscription.player);
  },
};
