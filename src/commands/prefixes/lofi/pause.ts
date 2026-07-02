import { AudioPlayerStatus, getVoiceConnection, type AudioPlayer } from "@discordjs/voice";
import { errorEmbed, successEmbed } from "../../../lib/embed";
import type { MessageWithReply } from "../../../types";

export = {
  name: "pause",
  description: "Pauses the currently playing song.",
  cooldown: 3,
  category: "lofi",
  async execute(
    message: MessageWithReply
  ): Promise<unknown> {
    const isplaying = await message.client.db.has(
      `vc.${message.guild!.id}.now`
    );
    if (!isplaying)
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed(
            "The bot is not playing music right now."
          ),
        ],
      });

    const getdb = (await message.client.db.get(
      `vc.${message.guild!.id}`
    )) as { master: string; channel: string };
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
    player.pause();
    return message.replyWithoutMention!({
      embeds: [
        successEmbed(
          "Successfully paused the current playing song."
        ),
      ],
    });
  },
};
