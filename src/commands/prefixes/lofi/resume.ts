import { AudioPlayerStatus, getVoiceConnection, type AudioPlayer } from "@discordjs/voice";
import {
  errorEmbed,
  successEmbed,
} from "../../../lib/embed";
import type { MessageWithReply } from "../../../types";

export = {
  name: "resume",
  description: "Resume the song that was paused.",
  cooldown: 3,
  category: "lofi",
  async execute(
    message: MessageWithReply
  ): Promise<unknown> {
    const guildData = (await message.client.db.get(
      `vc.${message.guild!.id}`
    )) as {
      master?: string;
      channel?: string;
    } | null;
    if (!guildData)
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed(
            "The bot is not playing music right now."
          ),
        ],
      });

    if (
      guildData.master !== message.member!.user.id
    )
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed(
            "Only the DJ can control using this command."
          ),
        ],
      });
    if (
      guildData.channel !==
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
    );
    if (!connection)
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed(
            "The bot is not playing music right now."
          ),
        ],
      });

    const player = (connection.state as { subscription: { player: AudioPlayer } }).subscription.player;
    player.unpause();
    return message.replyWithoutMention!({
      embeds: [successEmbed("Resumed!")],
    });
  },
};
