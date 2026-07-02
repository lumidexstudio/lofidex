import { getVoiceConnection, type VoiceConnection } from "@discordjs/voice";
import { hyperlink, bold } from "discord.js";
import {
  errorEmbed,
  successEmbed,
} from "../../../lib/embed";
import stop from "../../../lib/music/stop";
import type { MessageWithReply } from "../../../types";

export = {
  name: "stop",
  description: "Stops the music being played.",
  cooldown: 6,
  category: "lofi",
  async execute(
    message: MessageWithReply
  ): Promise<unknown> {
    const getdb = (await message.client.db.get(
      `vc.${message.guild!.id}`
    )) as {
      master?: string;
      channel?: string;
    } | null;
    if (!getdb)
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed(
            "The bot is not playing music right now."
          ),
        ],
      });
    if (
      getdb.master !== message.member!.user.id
    )
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed(
            "Only the DJ can control using this command."
          ),
        ],
      });
    if (
      getdb.channel !==
      (message.member as { voice: { channelId: string } }).voice
        .channelId
    )
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed(
            "We are not in the same voice channel!"
          ),
        ],
      });

    const connection = getVoiceConnection(
      message.guild!.id
    ) as VoiceConnection | undefined;
    if (!connection)
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed(
            "The bot is not playing music right now."
          ),
        ],
      });

    await stop(connection, message);
    return message.replyWithoutMention!({
      embeds: [
        successEmbed(
          `Disconnected\n\nThank you for using this bot. We are aware that many issues still exist. Come join our ${hyperlink(bold("Support Server"), message.client.config.supportServer)} to get information, updates and more.`
        ),
      ],
    });
  },
};
