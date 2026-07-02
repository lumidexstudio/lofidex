import { getVoiceConnection, type AudioPlayer } from "@discordjs/voice";
import skipMusic from "../../../lib/music/skip";
import {
  errorEmbed,
  loadingEmbed,
} from "../../../lib/embed";
import type { MessageWithReply } from "../../../types";

export = {
  name: "skip",
  description:
    "Skips the currently playing song and continues to the song after it.",
  aliases: ["next"],
  cooldown: 8,
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
    )) as {
      master: string;
      channel: string;
    };
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

    const meta = (player.state as { resource: { metadata: { title: string; author: string } } }).resource.metadata;
    await message.replyWithoutMention!({
      embeds: [
        loadingEmbed(
          `Trying to skip ${meta.title} - ${meta.author}`
        ),
      ],
    });

    await skipMusic(message, player);
  },
};
