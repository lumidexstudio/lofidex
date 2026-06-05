const fs = require("fs");
const { getVoiceConnection } = require("@discordjs/voice");
const { destroyGuildMixer } = require("../audio/playbackEngine");

/**
 * Tears down everything tied to a guild's playback session: the native mixer,
 * the voice connection, any pending auto-leave timer, the now-playing collector,
 * the temp directory and the persisted session. Safe to call repeatedly.
 */
async function leaveVoice(client, guildId) {
  destroyGuildMixer(client, guildId);

  const connection = getVoiceConnection(guildId);
  if (connection) {
    connection.destroy();
  }

  const timer = client.leaveTimers?.get(guildId);
  if (timer) {
    clearTimeout(timer);
    client.leaveTimers.delete(guildId);
  }

  client.nowplaying.delete(guildId);

  try {
    fs.rmSync(`temp/${guildId}`, { recursive: true, force: true });
  } catch {
    // temp dir may not exist — nothing to clean up
  }

  await client.db.delete(`vc.${guildId}`);
}

module.exports = leaveVoice;
