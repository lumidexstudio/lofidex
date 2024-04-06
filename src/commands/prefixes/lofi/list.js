const { EmbedBuilder } = require("discord.js");
const lofi = require("../../../lofi");
module.exports = {
  name: "list",
  description: "list of all song",
  aliases: ["songlist"],
  cooldown: 1,

  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle(`List of Song available in ${message.client.user.username}`)
      .setThumbnail(message.client.user.avatarURL())
      .addFields(
        lofi.map((item) => {
          return {
            name: item.title,
            value: item.author,
          };
        })
      )
      .setTimestamp()
      .setColor("Random");

    message.channel.send({ embeds: [embed] });
  },
};
