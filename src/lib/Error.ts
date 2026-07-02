import { Events, EmbedBuilder, codeBlock } from "discord.js";
import hastebin from "./hastebin";
import { dieEmbed } from "./embed";
import type { MessageWithReply } from "../types";

export = {
  name: Events.Error,
  async execute(error: Error, message: MessageWithReply): Promise<void> {
    message.replyWithoutMention?.({
      embeds: [
        dieEmbed(
          "Oops.. There is something wrong, We're sorry for the inconvenience. This problem will be reported automatically to our support server!"
        ),
      ],
    });
    const guild = message.client.guilds.cache.get(message.client.config.errorTo.guild);
    if (guild) {
      const channel = guild.channels.cache.get(message.client.config.errorTo.channel);
      if (channel && "send" in channel) {
        const embed = new EmbedBuilder()
          .setTitle(error.message.length > 256 ? error.message.slice(0, 253) + "..." : error.message)
          .setThumbnail(message.author.displayAvatarURL())
          .setDescription(
            error.stack && error.stack.length > 4096
              ? await hastebin(error.stack)
              : codeBlock(`Stack Trace:\n${error.stack ?? error.message}`)
          )
          .setColor("Red")
          .addFields([
            { name: "Encountered By", value: `${message.author.username}` },
            { name: "Origin Server", value: `${message.guild?.name} (ID ${message.guild?.id})` },
          ])
          .setTimestamp();
        await (channel as { send: (opts: unknown) => Promise<unknown> }).send({ embeds: [embed] });
      } else {
        console.warn(`[ErrorHandler] Cannot report error — channel "${message.client.config.errorTo.channel}" is not a valid text channel in guild "${message.client.config.errorTo.guild}". origin guild=${message.guild?.id} user=${message.author.tag}`);
      }
    } else {
      console.warn(`[ErrorHandler] Cannot report error — guild "${message.client.config.errorTo.guild}" is not in the client cache. origin guild=${message.guild?.id} user=${message.author.tag}`);
    }
  },
};
