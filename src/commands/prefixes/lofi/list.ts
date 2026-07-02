import { EmbedBuilder } from "discord.js";
import lofi from "../../../lofi";
import type { MessageWithReply } from "../../../types";

export = {
  name: "list",
  description: "list of all song",
  category: "lofi",
  aliases: ["songlist"],
  cooldown: 1,
  async execute(message: MessageWithReply): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle(`List of Song available in ${message.client.user!.username}`)
      .setThumbnail(message.client.user!.avatarURL())
      .addFields(
        lofi.map((item) => {
          return {
            name: item.title,
            value: item.author,
          };
        })
      )
      .setTimestamp()
      .setColor("Fuchsia");

    await (message.channel as unknown as { send: (opts: unknown) => Promise<unknown> }).send({
      embeds: [embed],
    });
  },
};
