import type { VoiceConnection, AudioPlayer } from "@discordjs/voice";
import { successEmbed, errorEmbed } from "../embed";
import getCurrentlyPlayingTime from "../getCurrentPlayingTime";
import { playSong, playAmbientOnly } from "../audio/playbackEngine";
import type { MessageWithReply } from "../../types";

const removeAmbient = async (
  message: MessageWithReply,
  con: VoiceConnection,
  argsAmbient: string
): Promise<ReturnType<NonNullable<MessageWithReply["replyWithoutMention"]>>> => {
  let ambients = (await message.client.db.get<string[]>(`vc.${message.guild!.id}.ambients`)) ?? [];

  if (!ambients.includes(argsAmbient)) {
    return message.replyWithoutMention!({
      embeds: [errorEmbed("Ambient not found in the active list.")],
    });
  }

  const getdb = (await message.client.db.get(`vc.${message.guild!.id}`)) as Record<string, unknown> & {
    ambients: string[];
    ambientOnly: boolean;
  };

  ambients = ambients.filter((item) => item !== argsAmbient);
  await message.client.db.set(`vc.${message.guild!.id}.ambients`, ambients);

  const player = (con.state as { subscription: { player: AudioPlayer & { skipNextIdle?: () => void } } }).subscription.player;

  if (typeof player.skipNextIdle === "function") player.skipNextIdle();

  if (getdb.ambientOnly) {
    if (ambients.length === 0) {
      return message.replyWithoutMention!({
        embeds: [errorEmbed("Cannot remove the last ambient in ambient-only mode. Use stop instead.")],
      });
    }
    playAmbientOnly(message.client, message.guild!.id, player, ambients, {
      shouldSendEmbed: false,
    });
    return message.replyWithoutMention!({
      embeds: [successEmbed("Ambient removed successfully!")],
    });
  }

  const list = require("../../lofi") as { title: string; path: string }[];
  const song = list[(player.state as { resource: { metadata: { index: number } } }).resource.metadata.index];
  const startOffset = getCurrentlyPlayingTime(con, message.client, message.guild!.id);
  if (startOffset === null)
    return message.replyWithoutMention!({
      embeds: [errorEmbed("No song were played!")],
    });

  playSong(message.client, message.guild!.id, player, song as never, {
    ambientNames: ambients,
    songIndex: list.findIndex((item) => item.title === song.title),
    startOffsetSeconds: startOffset,
    shouldSendEmbed: false,
  });

  return message.replyWithoutMention!({
    embeds: [successEmbed("Ambient removed successfully!")],
  });
};

export = removeAmbient;
