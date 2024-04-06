const { Colors } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const getUsage = require("../../../lib/getUsage");

module.exports = {
  name: "bot",
  description: "Lihat informasi dan statistik bot.",
  cooldown: 10,
  category: "owner",
  aliases: ["uptime", "infobot"],
  async execute(message) {
    const usage = getUsage();
    const embed = new EmbedBuilder()
      .setAuthor({ name: message.client.user.username + '#' + message.client.user.discriminator })
      .setThumbnail(`https://cdn.discordapp.com/avatars/${message.client.user.id}/${message.client.user.avatar}.png`)
      .setDescription(`<:arrowup:1058777961089749073> **Uptime:** ${require('ms')(Number(message.client.uptime), { long: true })}
<:shieldicon:1058255266090594372> **Total server:** ${message.client.guilds.cache.size}
<:users:1058783082477518848> **Total pengguna:** ${message.client.guilds.cache.map(x => x.memberCount ?? 0).reduce((a, b) => a + b, 0)}

<:ramicon:1058972522441343078> **Penggunaan RAM:** ${usage.memory}GB
<:cpu:1058972500505145414> **Penggunaan CPU:** ${usage.cpu}%`
      )
      .setColor(Colors.LuminousVividPink);

    return message.replyWithoutMention({ embeds: [embed] })
  },
};