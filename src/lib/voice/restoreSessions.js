const { startPlaybackSession } = require("./playbackSession");

/**
 * On startup, rejoin and resume guilds that had 24/7 mode enabled, and drop any
 * stale (non-24/7) sessions left behind by the previous process.
 */
async function restoreSessions(client) {
  const all = await client.db.get("vc");
  if (!all || typeof all !== "object") return;

  for (const [guildId, session] of Object.entries(all)) {
    // Only 24/7 sessions persist across restarts.
    if (!session?.stay247) {
      await client.db.delete(`vc.${guildId}`);
      continue;
    }

    try {
      const guild = await client.guilds.fetch(guildId);
      const voiceChannel = await guild.channels.fetch(session.channel);
      if (!voiceChannel) {
        await client.db.delete(`vc.${guildId}`);
        continue;
      }

      await startPlaybackSession(client, {
        guild,
        voiceChannel,
        textChannel: null,
        announce: false,
        resume: true,
      });

      console.log(`restored 24/7 session in guild ${guildId}`);
    } catch (error) {
      console.error(`failed to restore session ${guildId}: ${error.message}`);
      await client.db.delete(`vc.${guildId}`);
    }
  }
}

module.exports = restoreSessions;
