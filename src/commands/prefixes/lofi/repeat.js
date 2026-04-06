const { getVoiceConnection } = require("@discordjs/voice");
const { errorEmbed, successEmbed } = require("../../../lib/embed");

module.exports = {
  name: "repeat",
  description: "Repeating current song",
  category: "lofi",

  async execute(message) {
    let guildData = await message.client.db.get(`vc.${message.guild.id}`);
    if (!guildData) return message.replyWithoutMention({ embeds: [errorEmbed("The bot is not playing music right now.")] });

    if (guildData.ambientOnly) return message.replyWithoutMention({ embeds: [errorEmbed("Cannot repeat in ambient-only mode.")] });

    if (guildData.master !== message.member.user.id) return message.replyWithoutMention({ embeds: [errorEmbed("Only the DJ can control using this command.")] });

    if (guildData.channel !== message.member.voice.channelId) return message.replyWithoutMention({ embeds: [errorEmbed(`We are not in the same voice channel!`)] });

    let connection = getVoiceConnection(message.guild.id);
    if (!connection) return message.replyWithoutMention({ embeds: [errorEmbed("The bot is not playing music right now.")] });

    let songResource = connection.state.subscription.player.state.resource.metadata;
    let song = { ...songResource };

    let repeat = await message.client.db.get(`vc.${message.guild.id}.repeat`);
    await message.client.db.set(`vc.${message.guild.id}.repeat.song`, song);
    await message.client.db.set(`vc.${message.guild.id}.repeat.state`, !repeat.state);
    repeat = await message.client.db.get(`vc.${message.guild.id}.repeat`);

    if (repeat.state) {
      return message.replyWithoutMention({ embeds: [successEmbed("Repeating current song!")] });
    } else {
      return message.replyWithoutMention({ embeds: [successEmbed("Disabling Repeating current song!")] });
    }
  },
};
