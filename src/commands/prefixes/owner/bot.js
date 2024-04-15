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
      .setDescription(`**Uptime:** ${require('ms')(Number(message.client.uptime), { long: true })}
**Total server:** ${message.client.guilds.cache.size}
**Total pengguna:** ${message.client.guilds.cache.map(x => x.memberCount ?? 0).reduce((a, b) => a + b, 0)}

**Penggunaan RAM:** ${usage.memory}GB
**Penggunaan CPU:** ${usage.cpu}%`
      )
      .setColor(Colors.Fuchsia);

    return message.replyWithoutMention({ embeds: [embed] })
  },
};