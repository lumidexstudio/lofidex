import { VoiceConnectionStatus, getVoiceConnection } from "@discordjs/voice";
import { errorEmbed, infoEmbed } from "../../../lib/embed";
import { startPlaybackSession } from "../../../lib/voice/playbackSession";
import leaveVoice from "../../../lib/voice/leaveVoice";
import ambientLibrary from "../../../ambient-sound";
import type { MessageWithReply } from "../../../types";

function findAmbient(name: string): (typeof ambientLibrary)[number] | undefined {
  const exact = ambientLibrary.find((item) => item.name === name);
  if (exact) return exact;

  return ambientLibrary.find((item) => {
    if (item.category !== "root" && item.name.startsWith(item.category + "-")) {
      const withoutPrefix = item.name.slice(item.category.length + 1);
      if (withoutPrefix === name) return true;
    }
    return false;
  });
}

export = {
  name: "play",
  description: "start playing a song.",
  aliases: ["p"],
  cooldown: 3,
  category: "lofi",
  args: ["<ambient?>"],
  async execute(message: MessageWithReply, args: string[]): Promise<unknown> {
    const voiceChannelId = (message.member as { voice: { channelId: string } }).voice.channelId;
    if (!voiceChannelId)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("You must be on the voice channel first!")],
      });

    const voiceChannel = message.guild!.channels.cache.get(voiceChannelId);
    if (!voiceChannel)
      return message.replyWithoutMention!({
        embeds: [errorEmbed(`Voice channel not found`)],
      });

    const existingConnection = getVoiceConnection(message.guild!.id);
    if (existingConnection) {
      if (existingConnection.state.status !== VoiceConnectionStatus.Destroyed) {
        return message.replyWithoutMention!({
          embeds: [infoEmbed("Lofidex is already on the voice channel and is probably playing lofi.")],
        });
      }
      existingConnection.destroy();
    }

    const ambientArg = args[0] ? findAmbient(args[0]) : null;
    const isAmbientOnly = !!ambientArg;

    await message.client.db.set(`vc.${message.guild!.id}`, {
      channel: voiceChannel.id,
      master: message.member!.user.id,
      ambients: isAmbientOnly ? [ambientArg!.name] : [],
      ambientOnly: isAmbientOnly,
      stay247: false,
      repeat: { state: false, song: null },
    });

    try {
      await startPlaybackSession(message.client, {
        guild: message.guild!,
        voiceChannel: voiceChannel as import("discord.js").VoiceBasedChannel,
        textChannel: message.channel as import("discord.js").TextBasedChannel,
        announce: true,
      });
    } catch {
      await leaveVoice(message.client, message.guild!.id);
      return message.replyWithoutMention!({
        embeds: [errorEmbed("Failed to join the voice channel.")],
      });
    }

    console.log("bot connected - ready to play");
  },
};
