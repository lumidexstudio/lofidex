import type { Message } from "discord.js";
import list from "../../lofi";
import { createTrackResource } from "../audio/playbackEngine";

const restoreAmbient = async (
  message: Message,
  songIndex: number,
  options: {
    startOffsetSeconds?: number;
    shouldSendEmbed?: boolean;
  } = {}
) => {
  const ambients = await message.client.db.get<string[]>(
    `vc.${message.guild!.id}.ambients`
  );
  const song = list[songIndex];

  const { resource } = createTrackResource(
    message.client,
    message.guild!.id,
    song,
    {
      ambientNames: ambients ?? [],
      songIndex,
      startOffsetSeconds: options.startOffsetSeconds ?? 0,
      shouldSendEmbed: options.shouldSendEmbed ?? true,
    }
  );

  return resource;
};

export = restoreAmbient;
