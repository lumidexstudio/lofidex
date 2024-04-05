const { getVoiceConnection } = require("@discordjs/voice");
const skipMusic = require("../../../lib/music/skip");
const { errorEmbed, loadingEmbed, successEmbed } = require("../../../lib/embed");

module.exports = {
  name: "skip",
  description: "Skips the currently playing song and continues to the song after it.",
  aliases: ["next"],
  cooldown: 8,
  category: "lofi",
  async execute(message) {
    let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
    if (!isplaying) return message.replyWithoutMention({ embeds: [errorEmbed("The bot is not playing music right now.")] });

    let getdb = await message.client.db.get(`vc.${message.guild.id}`);
    if (getdb.master !== message.member.user.id) return message.replyWithoutMention({ embeds: [errorEmbed("Only the DJ can control using this command.")] });
    if (getdb.channel !== message.member.voice.channelId) return message.replyWithoutMention({ embeds: [errorEmbed(`We are not in the same voice channel!`)] });

    const connection = getVoiceConnection(message.guild.id);
    if (!connection) return message.replyWithoutMention({ embeds: [errorEmbed("The bot is not playing music right now.")] });

    connection.state.subscription.player.pause();

    message.replyWithoutMention({ embeds: [loadingEmbed(`Trying to skip ${connection.state.subscription.player.state.resource.metadata.title} - ${connection.state.subscription.player.state.resource.metadata.author}`)] });

    await skipMusic(message, connection.state.subscription.player);
  },
};
