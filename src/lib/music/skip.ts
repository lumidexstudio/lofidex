import type { AudioPlayer } from "@discordjs/voice";
import type { Message } from "discord.js";
import { playSong } from "../audio/playbackEngine";
import type { LofiSong, MessageWithReply } from "../../types";

async function skipMusic(
  message: Message,
  player: AudioPlayer,
  shouldSendEmbed = true
): Promise<void> {
  const guildData = (await message.client.db.get(`vc.${message.guild!.id}`)) as { ambientOnly?: boolean } | undefined;
  if (guildData?.ambientOnly) {
    const { errorEmbed } = require("../embed") as { errorEmbed: (msg: string) => unknown };
    await (message as MessageWithReply).replyWithoutMention!({
      embeds: [errorEmbed("Cannot skip in ambient-only mode.")],
    });
    return;
  }

  const list = require("../../lofi") as LofiSong[];
  const now = await message.client.db.get<number>(`vc.${message.guild!.id}.now`);

  let song: LofiSong;
  let nextIndex: number;

  if (now != null && now + 1 < list.length) {
    song = list[now + 1];
    nextIndex = now + 1;
    await message.client.db.set(`vc.${message.guild!.id}.now`, now + 1);
  } else {
    song = list[0];
    nextIndex = 0;
    await message.client.db.set(`vc.${message.guild!.id}.now`, 0);
  }

  const ambients = await message.client.db.get<string[]>(`vc.${message.guild!.id}.ambients`);

  playSong(message.client, message.guild!.id, player, song, {
    ambientNames: ambients ?? [],
    songIndex: nextIndex,
    startOffsetSeconds: 0,
    shouldSendEmbed,
  });
}

export = skipMusic;
