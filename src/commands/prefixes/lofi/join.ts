import { joinVoiceChannel, VoiceConnectionStatus, entersState, createAudioPlayer } from "@discordjs/voice";
import { errorEmbed, successEmbed } from "../../../lib/embed";
import leaveVoice from "../../../lib/voice/leaveVoice";
import type { MessageWithReply } from "../../../types";

export = {
  name: "join",
  description: "Make the bot join your voice channel without playing anything.",
  aliases: ["j"],
  cooldown: 3,
  category: "lofi",
  async execute(message: MessageWithReply): Promise<unknown> {
    const voiceChannelId = (message.member as { voice: { channelId: string } }).voice.channelId;
    if (!voiceChannelId)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("You must be on a voice channel first!")],
      });

    const existingData = await message.client.db.get(`vc.${message.guild!.id}`);
    if (existingData)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("The bot is already connected to a voice channel. Use `stop` first.")],
      });

    const voiceChannel = message.guild!.channels.cache.get(voiceChannelId);
    if (!voiceChannel)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("Voice channel not found")],
      });

    await message.client.db.set(`vc.${message.guild!.id}`, {
      channel: voiceChannel.id,
      master: message.member!.user.id,
      ambients: [],
      ambientOnly: false,
      stay247: false,
    });

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild!.id,
      adapterCreator: message.guild!.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        await leaveVoice(message.client, message.guild!.id);
      }
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch {
      await leaveVoice(message.client, message.guild!.id);
      return message.replyWithoutMention!({
        embeds: [errorEmbed("Failed to join the voice channel.")],
      });
    }

    const player = createAudioPlayer();
    connection.subscribe(player);
    player.on("error", console.error);

    return message.replyWithoutMention!({
      embeds: [successEmbed(`Joined **${voiceChannel.name}**! Use \`add <ambient>\` to play sounds or \`play\` to start lofi music.`)],
    });
  },
};
