import { getVoiceConnection, type AudioPlayer } from "@discordjs/voice";
import { errorEmbed, successEmbed } from "../../../lib/embed";
import type { MessageWithReply } from "../../../types";

export = {
  name: "repeat",
  description: "Repeating current song",
  category: "lofi",
  async execute(message: MessageWithReply): Promise<unknown> {
    const guildData = (await message.client.db.get(`vc.${message.guild!.id}`)) as {
      master?: string;
      channel?: string;
      ambientOnly?: boolean;
    } | null;
    if (!guildData)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("The bot is not playing music right now.")],
      });

    if (guildData.ambientOnly)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("Cannot repeat in ambient-only mode.")],
      });

    if (guildData.master !== message.member!.user.id)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("Only the DJ can control using this command.")],
      });

    if (guildData.channel !== (message.member as { voice: { channelId: string } }).voice.channelId)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("We are not in the same voice channel!")],
      });

    const connection = getVoiceConnection(message.guild!.id);
    if (!connection)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("The bot is not playing music right now.")],
      });

    const player = (connection.state as { subscription: { player: AudioPlayer } }).subscription.player;
    const resourceMeta = (player.state as { resource: { metadata: Record<string, unknown> } }).resource.metadata;
    const song = { ...resourceMeta };

    let repeat = await message.client.db.get<{ state: boolean; song: Record<string, unknown> }>(
      `vc.${message.guild!.id}.repeat`
    );

    await message.client.db.set(`vc.${message.guild!.id}.repeat.song`, song);
    await message.client.db.set(`vc.${message.guild!.id}.repeat.state`, !repeat?.state);

    const repeatState = await message.client.db.get<{ state: boolean }>(`vc.${message.guild!.id}.repeat`);

    if (repeatState?.state) {
      return message.replyWithoutMention!({
        embeds: [successEmbed("Repeating current song!")],
      });
    } else {
      return message.replyWithoutMention!({
        embeds: [successEmbed("Disabling Repeating current song!")],
      });
    }
  },
};
