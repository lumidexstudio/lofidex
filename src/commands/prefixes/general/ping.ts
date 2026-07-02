import { EmbedBuilder } from "discord.js";
import type { MessageWithReply } from "../../../types";

export = {
  name: "ping",
  description: "Pong!",
  cooldown: 1,
  category: "general",
  async execute(message: MessageWithReply): Promise<void> {
    const ping = Date.now() - message.createdTimestamp;
    const embed = new EmbedBuilder()
      .setAuthor({ name: "pong!" })
      .setDescription(
        `:hourglass_flowing_sand: **Response Time:** ${ping}ms\n:stopwatch: **Websocket:** ${Math.round(message.client.ws.ping)}ms`
      )
      .setColor(
        ping <= 100 ? "Green" : ping <= 500 ? "Yellow" : "Red"
      );

    await message.replyWithoutMention!({ embeds: [embed] });
  },
};
