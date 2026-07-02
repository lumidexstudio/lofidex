import { Events, type VoiceState } from "discord.js";
import config from "../config";
import leaveVoice from "../lib/voice/leaveVoice";

function clearPending(
  timers: Map<string, NodeJS.Timeout>,
  guildId: string
): void {
  const pending = timers.get(guildId);
  if (pending) {
    clearTimeout(pending);
    timers.delete(guildId);
  }
}

function countHumans(channel: {
  members: { filter: (fn: (member: { user: { bot: boolean } }) => boolean) => { size: number } };
}): number {
  if (!channel) return 0;
  return channel.members.filter((member) => !member.user.bot).size;
}

export = {
  name: Events.VoiceStateUpdate,
  async execute(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<void> {
    const guild = newState.guild ?? oldState.guild;
    const client = guild.client;
    const guildId = guild.id;
    const timers = client.leaveTimers;

    const session = await client.db.get(`vc.${guildId}`);
    if (!session) return;

    const botChannelId = guild.members.me?.voice?.channelId;
    if (!botChannelId) {
      clearPending(timers, guildId);
      return;
    }

    const channel = guild.channels.cache.get(botChannelId) as {
      members: {
        filter: (
          fn: (member: { user: { bot: boolean } }) => boolean
        ) => { size: number };
      };
    } | undefined;

    if (
      (channel && countHumans(channel) > 0) ||
      (session as { stay247?: boolean }).stay247
    ) {
      clearPending(timers, guildId);
      return;
    }

    if (timers.has(guildId)) return;

    const timer = setTimeout(async () => {
      timers.delete(guildId);

      const current = await client.db.get<{ stay247?: boolean }>(
        `vc.${guildId}`
      );
      if (!current || current.stay247) return;

      const stillBotChannelId = guild.members.me?.voice?.channelId;
      const stillChannel = stillBotChannelId
        ? (guild.channels.cache.get(stillBotChannelId) as Parameters<
            typeof countHumans
          >[0] | undefined)
        : null;
      if (
        !stillBotChannelId ||
        (stillChannel && countHumans(stillChannel) === 0)
      ) {
        await leaveVoice(client, guildId);
        console.log(`auto-left empty channel in guild ${guildId}`);
      }
    }, config.voice.emptyLeaveMs);

    timers.set(guildId, timer);
  },
};
