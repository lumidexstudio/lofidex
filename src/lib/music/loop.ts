import type { Client, TextBasedChannel } from "discord.js";
import type { AudioPlayer } from "@discordjs/voice";
import { successEmbed } from "../embed";
import { playSong } from "../audio/playbackEngine";

const loop = async (
  client: Client,
  guildId: string,
  player: AudioPlayer,
  textChannel: TextBasedChannel | null = null
): Promise<void> => {
  const repeat = (await client.db.get(`vc.${guildId}.repeat`)) as {
    song: Record<string, unknown> & { title: string; index: number };
  };
  const ambients = await client.db.get<string[]>(`vc.${guildId}.ambients`);

  playSong(client, guildId, player, repeat.song as never, {
    ambientNames: ambients ?? [],
    songIndex: repeat.song.index,
    startOffsetSeconds: 0,
    shouldSendEmbed: true,
  });

  if (textChannel && "send" in textChannel) {
    await (textChannel as { send: (opts: unknown) => Promise<unknown> }).send({
      embeds: [successEmbed(`Now repeating ${repeat.song.title}`)],
    });
  }
};

export = loop;
