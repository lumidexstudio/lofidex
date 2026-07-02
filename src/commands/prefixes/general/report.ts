import { EmbedBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../../../lib/embed";
import type { MessageWithReply } from "../../../types";

export = {
  name: "report",
  description: "Bug report",
  cooldown: 5,
  category: "general",
  args: ["<message>"],
  async execute(message: MessageWithReply, args: string[]): Promise<unknown> {
    if (!args.length) {
      return message.replyWithoutMention!({
        embeds: [errorEmbed("Message required!")],
      });
    }

    const reportEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("Bug Report")
      .setThumbnail(message.author.displayAvatarURL())
      .addFields(
        { name: "Reported By", value: `${message.author.username} (ID: ${message.author.id})`, inline: true },
        { name: "Origin Server", value: `${message.guild!.name} (ID: ${message.guild!.id})`, inline: true },
        { name: "Report", value: args.join(" "), inline: false }
      )
      .setTimestamp();

    const reportChannel = message.client.guilds.cache
      .get(message.client.config.reportTo.guild)
      ?.channels.cache.get(message.client.config.reportTo.channel) as
      | { send: (opts: unknown) => Promise<unknown> }
      | undefined;
    if (reportChannel) {
      await reportChannel.send({ content: `<@${message.author.id}>`, embeds: [reportEmbed] });
      return message.replyWithoutMention!({
        embeds: [successEmbed("Thanks for reporting! Our developers will check it as soon as possible!")],
      });
    } else {
      return message.replyWithoutMention!({
        embeds: [errorEmbed("Failed to send...")],
      });
    }
  },
};
