const { Events, EmbedBuilder, inlineCode } = require("discord.js");

module.exports = {
  name: Events.Error,
  async execute(error, message) {
    message.reply("Oops.. There is something wrong, We're sorry for the inconvenience. This problem will be reported automatically to our support server!");
    const guild = message.client.guilds.cache.get("1221002195588354098");
    if (guild) {
      const channel = guild.channels.cache.get("1228358782329819196");
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle(error.message)
          .setThumbnail(message.author.displayAvatarURL())
          .setDescription(inlineCode(`Stack Trace:\n${error.stack}`))
          .setColor("Red")
          .addFields([
            {
              name: "Encountered By",
              value: `${message.author.username}`,
            },
            {
              name: "Origin Server",
              value: `${message.guild.name} (ID ${message.guild.id})`,
            },
          ])
          .setTimestamp();
        channel.send({ embeds: [embed] });
      } else {
        console.error(`Channel "${channel.id}" is not a valid text channel`);
      }
    } else {
      console.error(`Guild "${guild.id}" not found`);
    }
  },
};
