import type { VoiceConnection, AudioPlayer } from "@discordjs/voice";
import ambientList from "../../ambient-sound";
import list from "../../lofi";
import getCurrentlyPlayingTime from "../getCurrentPlayingTime";
import { errorEmbed, successEmbed } from "../embed";
import { playSong, playAmbientOnly } from "../audio/playbackEngine";
import type { MessageWithReply } from "../../types";

const addAmbient = async (
  message: MessageWithReply,
  con: VoiceConnection,
  argsAmbient: string
): Promise<ReturnType<NonNullable<MessageWithReply["replyWithoutMention"]>>> => {
  if (!ambientList.find((item) => item.name === argsAmbient))
    return message.replyWithoutMention!({
      embeds: [errorEmbed("Ambient not found!")],
    });

  const getdb = (await message.client.db.get(`vc.${message.guild!.id}`)) as Record<string, unknown> & {
    ambients: string[];
    ambientOnly: boolean;
  };
  if (getdb.ambients.includes(argsAmbient))
    return message.replyWithoutMention!({
      embeds: [errorEmbed(`${argsAmbient} ambient already in use!`)],
    });

  getdb.ambients.push(argsAmbient);
  await message.client.db.set(`vc.${message.guild!.id}.ambients`, getdb.ambients);

  const player = (con.state as { subscription: { player: AudioPlayer & { skipNextIdle?: () => void } } }).subscription.player;

  if (typeof player.skipNextIdle === "function") player.skipNextIdle();

  if (getdb.ambientOnly) {
    playAmbientOnly(message.client, message.guild!.id, player, getdb.ambients, {
      shouldSendEmbed: false,
    });
    return message.replyWithoutMention!({
      embeds: [successEmbed("Ambient added successfully!")],
    });
  }

  const resource = (player.state as { resource?: { metadata: { index: number } } }).resource;
  if (!resource) {
    console.warn(`[addAmbient] guild ${message.guild!.id}: no song resource available (player state: ${player.state.status}), but ambientOnly=false — treating as empty queue`);
    return message.replyWithoutMention!({
      embeds: [errorEmbed("No song is currently playing. Use `/play` first.")],
    });
  }

  const song = list[resource.metadata.index];
  const startOffset = getCurrentlyPlayingTime(con, message.client, message.guild!.id);
  if (startOffset === null)
    return message.replyWithoutMention!({
      embeds: [errorEmbed("No song were played!")],
    });

  playSong(message.client, message.guild!.id, player, song, {
    ambientNames: getdb.ambients,
    songIndex: list.findIndex((item) => item.title === song.title),
    startOffsetSeconds: startOffset,
    shouldSendEmbed: false,
  });

  return message.replyWithoutMention!({
    embeds: [successEmbed("Ambient added successfully!")],
  });
};

export = addAmbient;
