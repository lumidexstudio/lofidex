"use strict";
const playbackSession_1 = require("./playbackSession");
async function restoreSessions(client) {
    const all = await client.db.get("vc");
    if (!all || typeof all !== "object")
        return;
    for (const [guildId, session] of Object.entries(all)) {
        if (!session?.stay247) {
            await client.db.delete(`vc.${guildId}`);
            continue;
        }
        try {
            const guild = await client.guilds.fetch(guildId);
            const voiceChannel = await guild.channels.fetch(session.channel);
            if (!voiceChannel || !("adapterCreator" in voiceChannel)) {
                await client.db.delete(`vc.${guildId}`);
                continue;
            }
            await (0, playbackSession_1.startPlaybackSession)(client, {
                guild,
                voiceChannel: voiceChannel,
                textChannel: null,
                announce: false,
                resume: true,
            });
            console.log(`restored 24/7 session in guild ${guildId}`);
        }
        catch (error) {
            console.error(`failed to restore session ${guildId}: ${error.message}`);
            await client.db.delete(`vc.${guildId}`);
        }
    }
}
module.exports = restoreSessions;
//# sourceMappingURL=restoreSessions.js.map