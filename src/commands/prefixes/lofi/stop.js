const { getVoiceConnection } = require("@discordjs/voice");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "stop",
  description: "stop playing!",
  cooldown: 1,
  category: "lofi",
  async execute(message) {
    let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
    if(!isplaying) return message.reply("does'nt play any song rn");

    let getdb = await message.client.db.get(`vc.${message.guild.id}`);
    if (getdb.master !== message.member.user.id) return message.reply(`you are not the user that using the play command previously`);
    if (getdb.channel !== message.member.voice.channelId) return message.reply(`we are not in the same vc`);

    await getVoiceConnection(message.guild.id).disconnect();
    await message.client.db.delete(`vc.${message.guild.id}`);

    let embed = new EmbedBuilder().setTitle("Disconnected").setColor("Random");
    message.replyWithoutMention({ embeds: [embed] });
  },
};
