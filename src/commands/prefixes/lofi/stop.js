const { getVoiceConnection } = require("@discordjs/voice");
const { hyperlink, bold } = require("discord.js");
const { errorEmbed, successEmbed } = require("../../../lib/embed");
const fs = require("fs");
const stop = require("../../../lib/music/stop");

module.exports = {
  name: "stop",
  description: "Stops the music being played.",
  cooldown: 6,
  category: "lofi",
  async execute(message) {
    let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
    if (!isplaying) return message.replyWithoutMention({ embeds: [errorEmbed("The bot is not playing music right now.")] });

    let getdb = await message.client.db.get(`vc.${message.guild.id}`);
    if (getdb.master !== message.member.user.id) return message.replyWithoutMention({ embeds: [errorEmbed("Only the DJ can control using this command.")] });
    if (getdb.channel !== message.member.voice.channelId) return message.replyWithoutMention({ embeds: [errorEmbed(`We are not in the same voice channel!`)] });

    let connection = getVoiceConnection(message.guild.id);
    if (!connection) return message.replyWithoutMention({ embeds: [errorEmbed("The bot is not playing music right now.")] });

    await stop(connection, message);
    message.replyWithoutMention({ embeds: [successEmbed(`Disconnected\n\nThank you for using this bot. We are aware that many issues still exist. Come join our ${hyperlink(bold('Support Server'), message.client.config.supportServer)} to get information, updates and more.`)] });
  },
};
