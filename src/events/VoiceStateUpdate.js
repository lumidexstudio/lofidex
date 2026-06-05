const { Events } = require("discord.js");
const config = require("../../config");
const leaveVoice = require("../lib/voice/leaveVoice");

function clearPending(timers, guildId) {
  const pending = timers.get(guildId);
  if (pending) {
    clearTimeout(pending);
    timers.delete(guildId);
  }
}

function countHumans(channel) {
  if (!channel) return 0;
  return channel.members.filter((member) => !member.user.bot).size;
}

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const guild = newState.guild ?? oldState.guild;
    const client = guild.client;
    const guildId = guild.id;
    const timers = client.leaveTimers;

    const session = await client.db.get(`vc.${guildId}`);
    if (!session) return; // no active playback session in this guild

    // Use the bot's live voice channel so a channel move never strands the check.
    const botChannelId = guild.members.me?.voice?.channelId;
    if (!botChannelId) {
      clearPending(timers, guildId);
      return;
    }

    const channel = guild.channels.cache.get(botChannelId);

    // Someone is present, or 24/7 is on — cancel any scheduled disconnect.
    if (countHumans(channel) > 0 || session.stay247) {
      clearPending(timers, guildId);
      return;
    }

    // Empty and not 24/7 — schedule a disconnect after the grace period.
    if (timers.has(guildId)) return;

    const timer = setTimeout(async () => {
      timers.delete(guildId);

      const current = await client.db.get(`vc.${guildId}`);
      if (!current || current.stay247) return; // 24/7 toggled on, or already gone

      const stillBotChannelId = guild.members.me?.voice?.channelId;
      const stillChannel = stillBotChannelId ? guild.channels.cache.get(stillBotChannelId) : null;
      if (!stillBotChannelId || countHumans(stillChannel) === 0) {
        await leaveVoice(client, guildId);
        console.log(`auto-left empty channel in guild ${guildId}`);
      }
    }, config.voice.emptyLeaveMs);

    timers.set(guildId, timer);
  },
};
